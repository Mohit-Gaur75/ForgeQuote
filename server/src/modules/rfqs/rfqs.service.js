// server/src/modules/rfqs/rfqs.service.js
import { prisma } from '../../config/database.js';
import { generateRFQNumber } from '../../utils/sequence.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import { NotFoundError, AuthorizationError } from '../../utils/errors.js';

export async function listRFQs(user, query) {
  const { page, limit, skip } = parsePagination(query);
  const now = new Date();

  // Role scoping: Estimators view only their assigned RFQs
  const where = {};
  if (user.role === 'ESTIMATOR') {
    where.ownerId = user.id;
  } else if (query.ownerId) {
    where.ownerId = query.ownerId;
  }

  // Filter by status
  if (query.status) {
    where.status = query.status;
  }

  // Search by RFQ number or Customer name
  if (query.search?.trim()) {
    const term = query.search.trim();
    where.OR = [
      { rfqNumber: { contains: term, mode: 'insensitive' } },
      { customerName: { contains: term, mode: 'insensitive' } },
    ];
  }

  // Overdue logic: due date has passed AND status is not terminal (SENT/WON/LOST)
  if (query.isOverdue === 'true') {
    where.status = 'ESTIMATING';
    where.dueDate = { lt: now };
  } else if (query.isOverdue === 'false') {
    where.OR = [
      { dueDate: { gte: now } },
      { dueDate: null },
      { status: { in: ['SENT', 'WON', 'LOST'] } },
    ];
  }

  // Sorting
  const [sortField, sortOrder] = (query.sort || 'createdAt:desc').split(':');
  const orderBy = { [sortField]: sortOrder || 'desc' };

  const [total, records] = await Promise.all([
    prisma.rFQ.count({ where }),
    prisma.rFQ.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { parts: true, quotations: true },
        },
        quotations: {
          select: {
            annualContractValue: true,
            status: true,
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
  ]);

  // Enrich records with overdue calculation
  const data = records.map((rfq) => {
    const isOverdue =
      rfq.dueDate &&
      new Date(rfq.dueDate) < now &&
      !['SENT', 'WON', 'LOST'].includes(rfq.status);

    const latestQuote = rfq.quotations[0];
    const annualValue = latestQuote?.annualContractValue ? Number(latestQuote.annualContractValue) : 0;

    return {
      id: rfq.id,
      rfqNumber: rfq.rfqNumber,
      customerName: rfq.customerName,
      customerType: rfq.customerType,
      receivedAt: rfq.receivedAt,
      dueDate: rfq.dueDate,
      status: rfq.status,
      lostReason: rfq.lostReason,
      owner: rfq.owner,
      partCount: rfq._count.parts,
      quotationCount: rfq._count.quotations,
      annualValue,
      isOverdue,
      createdAt: rfq.createdAt,
      updatedAt: rfq.updatedAt,
    };
  });

  return {
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function createRFQ(user, data) {
  const rfqNumber = await generateRFQNumber();

  const rfq = await prisma.rFQ.create({
    data: {
      rfqNumber,
      customerName: data.customerName,
      customerType: data.customerType || null,
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      ownerId: user.id,
      status: 'ESTIMATING',
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  // Audit log entry
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'CREATE_RFQ',
      entityType: 'RFQ',
      entityId: rfq.id,
      newValues: { rfqNumber: rfq.rfqNumber, customerName: rfq.customerName },
    },
  }).catch(() => {});

  return rfq;
}

export async function getRFQById(user, id) {
  const rfq = await prisma.rFQ.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      parts: {
        include: {
          operations: {
            orderBy: { operationSequence: 'asc' },
          },
          _count: { select: { targetSuggestions: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      quotations: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          quotationNumber: true,
          versionNumber: true,
          status: true,
          subtotalBeforeTax: true,
          annualContractValue: true,
          totalIncludingGST: true,
          createdAt: true,
        },
      },
      extractions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!rfq) {
    throw new NotFoundError('RFQ');
  }

  // Estimators cannot view other estimators' RFQs
  if (user.role === 'ESTIMATOR' && rfq.ownerId !== user.id) {
    throw new AuthorizationError('You do not have access to this RFQ');
  }

  const now = new Date();
  const isOverdue =
    rfq.dueDate &&
    new Date(rfq.dueDate) < now &&
    !['SENT', 'WON', 'LOST'].includes(rfq.status);

  return {
    ...rfq,
    isOverdue,
  };
}

export async function updateRFQ(user, id, data) {
  const existing = await prisma.rFQ.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('RFQ');
  }

  if (user.role === 'ESTIMATOR' && existing.ownerId !== user.id) {
    throw new AuthorizationError('You cannot edit an RFQ you do not own');
  }

  const updated = await prisma.rFQ.update({
    where: { id },
    data: {
      ...(data.customerName && { customerName: data.customerName }),
      ...(data.customerType !== undefined && { customerType: data.customerType }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.lostReason !== undefined && { lostReason: data.lostReason }),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'UPDATE_RFQ',
      entityType: 'RFQ',
      entityId: id,
      oldValues: { customerName: existing.customerName, dueDate: existing.dueDate },
      newValues: { customerName: updated.customerName, dueDate: updated.dueDate },
    },
  }).catch(() => {});

  return updated;
}

export async function updateRFQStatus(user, id, status, lostReason) {
  const existing = await prisma.rFQ.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('RFQ');
  }

  const updated = await prisma.rFQ.update({
    where: { id },
    data: {
      status,
      lostReason: status === 'LOST' ? (lostReason || 'Not specified') : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'UPDATE_RFQ_STATUS',
      entityType: 'RFQ',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: updated.status, lostReason: updated.lostReason },
    },
  }).catch(() => {});

  return updated;
}
