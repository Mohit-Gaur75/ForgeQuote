// server/src/modules/audit/audit.controller.js
import * as auditService from './audit.service.js';

/**
 * Controller to fetch audit logs by entityType and entityId.
 */
export async function getAuditHistory(req, res) {
  const entityType = req.params.entityType || req.query.entityType;
  const entityId = req.params.entityId || req.query.entityId;

  const logs = await auditService.getAuditLogs(entityType, entityId);

  res.status(200).json({
    success: true,
    data: logs,
    requestId: req.id,
  });
}
