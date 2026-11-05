// server/src/modules/audit/audit.service.js
import { prisma } from '../../config/database.js';

/**
 * Fetch immutable audit trail records for a specific entity.
 * @param {string} entityType - The entity category (e.g. RFQ, PART, QUOTATION, RATE_MASTER)
 * @param {string} entityId - The unique identifier of the entity
 * @returns {Promise<Array>} List of audit records with user metadata
 */
export async function getAuditLogs(entityType, entityId) {
  const where = {};
  if (entityType) {
    where.entityType = entityType.toUpperCase();
  }
  if (entityId) {
    where.entityId = entityId;
  }

  return prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });
}
