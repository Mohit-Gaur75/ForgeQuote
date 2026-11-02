// server/src/modules/parts/parts.service.js
import { prisma } from '../../config/database.js';
import { NotFoundError, AuthorizationError, ValidationError } from '../../utils/errors.js';

export async function createPart(user, rfqId, data) {
  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  if (!rfq) {
    throw new NotFoundError('RFQ');
  }

  if (user.role === 'ESTIMATOR' && rfq.ownerId !== user.id) {
    throw new AuthorizationError('You cannot add parts to an RFQ you do not own');
  }

  let grossWeight = data.grossWeightKg !== undefined ? data.grossWeightKg : null;
  const netWeight = data.netWeightKg !== undefined ? data.netWeightKg : null;
  const scrap = data.scrapPercentage !== undefined ? data.scrapPercentage : null;

  // Consistency checks
  if (grossWeight !== null && netWeight !== null && grossWeight < netWeight) {
    throw new ValidationError('Gross weight cannot be less than net weight', [
      { field: 'grossWeightKg', message: 'Gross weight must be greater than or equal to net weight' },
    ]);
  }

  // Derive gross weight if missing but net weight & scrap are present
  if (grossWeight === null && netWeight !== null && scrap !== null && scrap < 100) {
    grossWeight = Number((netWeight / (1 - scrap / 100)).toFixed(4));
  }

  const part = await prisma.part.create({
    data: {
      rfqId,
      partNumber: data.partNumber || null,
      partName: data.partName,
      material: data.material || null,
      grossWeightKg: grossWeight !== null ? grossWeight : null,
      netWeightKg: netWeight !== null ? netWeight : null,
      scrapPercentage: scrap !== null ? scrap : null,
      annualVolume: data.annualVolume !== undefined ? data.annualVolume : null,
      setupHours: data.setupHours !== undefined ? data.setupHours : null,
    },
    include: {
      operations: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'CREATE_PART',
      entityType: 'PART',
      entityId: part.id,
      newValues: { partName: part.partName, rfqId },
    },
  }).catch(() => {});

  return part;
}

export async function getPartById(user, id) {
  const part = await prisma.part.findUnique({
    where: { id },
    include: {
      rfq: {
        select: { id: true, rfqNumber: true, ownerId: true, customerName: true },
      },
      operations: {
        orderBy: { operationSequence: 'asc' },
      },
      targetSuggestions: {
        include: {
          sourcePart: {
            include: {
              rfq: { select: { customerName: true } },
              operations: { orderBy: { operationSequence: 'asc' } },
            },
          },
        },
        orderBy: { similarityScore: 'desc' },
        take: 3,
      },
    },
  });

  if (!part) {
    throw new NotFoundError('Part');
  }

  if (user.role === 'ESTIMATOR' && part.rfq.ownerId !== user.id) {
    throw new AuthorizationError('You do not have permission to view this part');
  }

  return part;
}

export async function updatePart(user, id, data) {
  const existing = await prisma.part.findUnique({
    where: { id },
    include: { rfq: true },
  });

  if (!existing) {
    throw new NotFoundError('Part');
  }

  if (user.role === 'ESTIMATOR' && existing.rfq.ownerId !== user.id) {
    throw new AuthorizationError('You cannot edit a part on an RFQ you do not own');
  }

  let grossWeight = data.grossWeightKg !== undefined ? data.grossWeightKg : (existing.grossWeightKg ? Number(existing.grossWeightKg) : null);
  const netWeight = data.netWeightKg !== undefined ? data.netWeightKg : (existing.netWeightKg ? Number(existing.netWeightKg) : null);
  const scrap = data.scrapPercentage !== undefined ? data.scrapPercentage : (existing.scrapPercentage ? Number(existing.scrapPercentage) : null);

  if (grossWeight !== null && netWeight !== null && grossWeight < netWeight) {
    throw new ValidationError('Gross weight cannot be less than net weight', [
      { field: 'grossWeightKg', message: 'Gross weight must be greater than or equal to net weight' },
    ]);
  }

  if (data.grossWeightKg === undefined && grossWeight === null && netWeight !== null && scrap !== null && scrap < 100) {
    grossWeight = Number((netWeight / (1 - scrap / 100)).toFixed(4));
  }

  const updated = await prisma.part.update({
    where: { id },
    data: {
      ...(data.partNumber !== undefined && { partNumber: data.partNumber }),
      ...(data.partName && { partName: data.partName }),
      ...(data.material !== undefined && { material: data.material }),
      ...(grossWeight !== null && { grossWeightKg: grossWeight }),
      ...(data.netWeightKg !== undefined && { netWeightKg: data.netWeightKg }),
      ...(data.scrapPercentage !== undefined && { scrapPercentage: data.scrapPercentage }),
      ...(data.annualVolume !== undefined && { annualVolume: data.annualVolume }),
      ...(data.setupHours !== undefined && { setupHours: data.setupHours }),
    },
    include: {
      operations: { orderBy: { operationSequence: 'asc' } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'UPDATE_PART',
      entityType: 'PART',
      entityId: id,
      oldValues: { partName: existing.partName },
      newValues: { partName: updated.partName },
    },
  }).catch(() => {});

  return updated;
}

export async function deletePart(user, id) {
  const existing = await prisma.part.findUnique({
    where: { id },
    include: { rfq: true },
  });

  if (!existing) {
    throw new NotFoundError('Part');
  }

  if (user.role === 'ESTIMATOR' && existing.rfq.ownerId !== user.id) {
    throw new AuthorizationError('You cannot delete a part on an RFQ you do not own');
  }

  await prisma.part.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'DELETE_PART',
      entityType: 'PART',
      entityId: id,
      oldValues: { partName: existing.partName, rfqId: existing.rfqId },
    },
  }).catch(() => {});

  return { message: 'Part deleted successfully' };
}
