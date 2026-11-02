// server/src/modules/rates/rates.service.js
import { prisma } from '../../config/database.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError, ConflictError, AuthorizationError } from '../../utils/errors.js';

export async function listRates(query) {
  const { page, limit, skip } = parsePagination(query);

  const where = {};
  if (query.rateType) {
    where.rateType = query.rateType;
  }
  if (query.isActive !== undefined) {
    where.isActive = query.isActive === 'true';
  }
  if (query.search?.trim()) {
    const term = query.search.trim();
    where.OR = [
      { rateName: { contains: term, mode: 'insensitive' } },
      { materialGrade: { contains: term, mode: 'insensitive' } },
      { machineType: { contains: term, mode: 'insensitive' } },
    ];
  }

  const [total, records] = await Promise.all([
    prisma.rateMaster.count({ where }),
    prisma.rateMaster.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { rateType: 'asc' },
        { rateName: 'asc' },
        { versionNumber: 'desc' },
      ],
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return {
    data: records,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getRateHistory(id) {
  const rate = await prisma.rateMaster.findUnique({ where: { id } });
  if (!rate) {
    throw new NotFoundError('RateMaster');
  }

  const history = await prisma.rateMaster.findMany({
    where: {
      rateType: rate.rateType,
      rateName: rate.rateName,
    },
    orderBy: { versionNumber: 'desc' },
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  return history;
}

export async function getEffectiveRates(targetDate = new Date(), rateType = null) {
  const atDate = new Date(targetDate);

  const where = {
    isActive: true,
    effectiveFrom: { lte: atDate },
    OR: [
      { effectiveTo: null },
      { effectiveTo: { gt: atDate } },
    ],
  };

  if (rateType) {
    where.rateType = rateType;
  }

  const rates = await prisma.rateMaster.findMany({
    where,
    orderBy: [
      { rateType: 'asc' },
      { rateName: 'asc' },
      { versionNumber: 'desc' },
    ],
  });

  return rates;
}

export async function createRateVersion(user, data) {
  if (user.role !== 'SALES_HEAD') {
    throw new AuthorizationError('Only the Sales Head can create or modify master rates');
  }

  const from = new Date(data.effectiveFrom);
  const to = data.effectiveTo ? new Date(data.effectiveTo) : null;

  // Retrieve existing versions for this exact rate key
  const existingVersions = await prisma.rateMaster.findMany({
    where: {
      rateType: data.rateType,
      rateName: data.rateName,
      isActive: true,
    },
  });

  let maxVersion = 0;
  let openEndedVersion = null;

  for (const v of existingVersions) {
    if (v.versionNumber > maxVersion) {
      maxVersion = v.versionNumber;
    }

    const vFrom = new Date(v.effectiveFrom);
    const vTo = v.effectiveTo ? new Date(v.effectiveTo) : null;

    // Check if previous version is open-ended
    if (vTo === null) {
      if (from > vFrom) {
        openEndedVersion = v;
      } else {
        throw new ConflictError(
          `Cannot create version effective ${from.toISOString()}; overlaps with open-ended version v${v.versionNumber} starting ${vFrom.toISOString()}`
        );
      }
    } else {
      // Check standard date overlap
      const newEnd = to ? to.getTime() : Infinity;
      const existEnd = vTo.getTime();
      const overlaps = from.getTime() < existEnd && newEnd > vFrom.getTime();

      if (overlaps) {
        throw new ConflictError(
          `Date overlap with existing rate version v${v.versionNumber} (${vFrom.toISOString()} to ${vTo.toISOString()})`
        );
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    // If there was an open-ended version that preceded this new version, cap its effectiveTo
    if (openEndedVersion) {
      await tx.rateMaster.update({
        where: { id: openEndedVersion.id },
        data: { effectiveTo: from },
      });
    }

    // Insert new version
    const newRate = await tx.rateMaster.create({
      data: {
        rateType: data.rateType,
        rateName: data.rateName,
        materialGrade: data.materialGrade || null,
        machineType: data.machineType || null,
        rateValue: data.rateValue,
        unit: data.unit,
        currency: data.currency || 'INR',
        versionNumber: maxVersion + 1,
        effectiveFrom: from,
        effectiveTo: to,
        isActive: true,
        createdBy: user.id,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_RATE_VERSION',
        entityType: 'RATE_MASTER',
        entityId: newRate.id,
        newValues: {
          rateName: newRate.rateName,
          rateValue: newRate.rateValue,
          version: newRate.versionNumber,
        },
      },
    });

    return newRate;
  });
}
