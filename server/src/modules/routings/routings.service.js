// server/src/modules/routings/routings.service.js
import { prisma } from '../../config/database.js';
import { calculatePartSimilarity } from './similarity.js';
import { NotFoundError, AuthorizationError, ValidationError } from '../../utils/errors.js';

/**
 * Find historically similar parts with operations and compute deterministic scores
 * @param {object} user - Current user
 * @param {string} targetPartId - Target Part UUID
 * @param {number} minScore - Cutoff threshold (default 0.50)
 */
export async function getRoutingSuggestions(user, targetPartId, minScore = 0.5) {
  const targetPart = await prisma.part.findUnique({
    where: { id: targetPartId },
    include: { rfq: true },
  });

  if (!targetPart) throw new NotFoundError('Part');
  if (user.role === 'ESTIMATOR' && targetPart.rfq.ownerId !== user.id) {
    throw new AuthorizationError('Access denied to this part');
  }

  // Fetch all other historical parts that have manufacturing operations configured
  const candidateParts = await prisma.part.findMany({
    where: {
      id: { not: targetPartId },
      operations: { some: {} }, // Must have at least 1 operation
    },
    include: {
      rfq: {
        select: {
          id: true,
          rfqNumber: true,
          customerName: true,
        },
      },
      operations: {
        orderBy: { operationSequence: 'asc' },
      },
    },
  });

  const matches = [];

  for (const candidate of candidateParts) {
    const { score, breakdown } = calculatePartSimilarity(
      {
        partName: targetPart.partName,
        material: targetPart.material,
        netWeightKg: targetPart.netWeightKg ? Number(targetPart.netWeightKg) : null,
      },
      {
        partName: candidate.partName,
        material: candidate.material,
        netWeightKg: candidate.netWeightKg ? Number(candidate.netWeightKg) : null,
      }
    );

    if (score >= minScore) {
      matches.push({
        sourcePartId: candidate.id,
        partName: candidate.partName,
        partNumber: candidate.partNumber,
        material: candidate.material,
        netWeightKg: candidate.netWeightKg ? Number(candidate.netWeightKg) : null,
        annualVolume: candidate.annualVolume,
        customerName: candidate.rfq?.customerName || 'OEM Customer',
        rfqNumber: candidate.rfq?.rfqNumber || 'RFQ',
        similarityScore: score,
        similarityPercentage: Math.round(score * 100),
        breakdown,
        operations: candidate.operations.map((op) => ({
          operationSequence: op.operationSequence,
          operationName: op.operationName,
          machineType: op.machineType,
          cycleTimeMinutes: Number(op.cycleTimeMinutes),
          machineHourRate: Number(op.machineHourRate),
          setupHours: op.setupHours ? Number(op.setupHours) : 0,
        })),
      });
    }
  }

  // Sort descending by similarity score
  matches.sort((a, b) => b.similarityScore - a.similarityScore);

  // Return top 5 matches
  return matches.slice(0, 5);
}

/**
 * Copy operations from a source historical part onto the target part
 * @param {object} user - Current user
 * @param {string} targetPartId - Target Part UUID
 * @param {string} sourcePartId - Historical Part UUID to clone from
 */
export async function applyRoutingSuggestion(user, targetPartId, sourcePartId) {
  const targetPart = await prisma.part.findUnique({
    where: { id: targetPartId },
    include: { rfq: true },
  });

  if (!targetPart) throw new NotFoundError('Target Part');
  if (user.role === 'ESTIMATOR' && targetPart.rfq.ownerId !== user.id) {
    throw new AuthorizationError('You can only modify parts belonging to your RFQs');
  }

  const sourcePart = await prisma.part.findUnique({
    where: { id: sourcePartId },
    include: {
      operations: { orderBy: { operationSequence: 'asc' } },
    },
  });

  if (!sourcePart) throw new NotFoundError('Source Part');
  if (!sourcePart.operations || sourcePart.operations.length === 0) {
    throw new ValidationError('Source historical part has no manufacturing operations to copy');
  }

  // Atomically clone operations onto target part
  const result = await prisma.$transaction(async (tx) => {
    // 1. Clear existing operations on target part
    await tx.partOperation.deleteMany({
      where: { partId: targetPartId },
    });

    // 2. Clone operations from source part
    await tx.partOperation.createMany({
      data: sourcePart.operations.map((op) => ({
        partId: targetPartId,
        operationSequence: op.operationSequence,
        operationName: op.operationName,
        machineType: op.machineType,
        cycleTimeMinutes: op.cycleTimeMinutes,
        machineHourRate: op.machineHourRate,
        setupHours: op.setupHours || 0,
        machineRateVersionId: op.machineRateVersionId,
      })),
    });

    // 3. Mark suggestion as accepted if record exists, or create one
    const existingSuggestion = await tx.routingSuggestion.findFirst({
      where: {
        targetPartId,
        sourcePartId,
      },
    });

    if (existingSuggestion) {
      await tx.routingSuggestion.update({
        where: { id: existingSuggestion.id },
        data: { accepted: true },
      });
    } else {
      await tx.routingSuggestion.create({
        data: {
          targetPartId,
          sourcePartId,
          similarityScore: 1.0,
          accepted: true,
          suggestionData: { appliedAt: new Date().toISOString() },
        },
      });
    }

    // 4. Audit log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'APPLY_ROUTING_SUGGESTION',
        entityType: 'PART',
        entityId: targetPartId,
        newValues: {
          sourcePartId,
          sourcePartName: sourcePart.partName,
          clonedOperationsCount: sourcePart.operations.length,
        },
      },
    });

    // 5. Return target part with its new operations
    return tx.part.findUnique({
      where: { id: targetPartId },
      include: {
        operations: { orderBy: { operationSequence: 'asc' } },
        rfq: true,
      },
    });
  });

  return result;
}

/**
 * Plant Head Routing Review list: fetches parts with operations and verification status
 */
export async function getRoutingChecks(user) {
  const parts = await prisma.part.findMany({
    where: {
      operations: { some: {} },
    },
    include: {
      rfq: {
        select: {
          id: true,
          rfqNumber: true,
          customerName: true,
          status: true,
          dueDate: true,
        },
      },
      operations: {
        orderBy: { operationSequence: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return parts;
}
