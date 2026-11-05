// client/src/hooks/useAudit.js
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Fetch immutable audit trail records for a specific entity.
 * @param {string} entityType - RFQ, PART, QUOTATION, etc.
 * @param {string} entityId - The unique UUID of the entity.
 */
export function useAuditLogs(entityType, entityId) {
  return useQuery({
    queryKey: ['audit', entityType, entityId],
    queryFn: async () => {
      const res = await api.get(`/audit/${entityType}/${entityId}`);
      return res.data;
    },
    enabled: Boolean(entityType && entityId),
  });
}
