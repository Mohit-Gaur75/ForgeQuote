// client/src/hooks/useAI.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useExtractRFQ(rfqId) {
  return useMutation({
    mutationFn: async ({ emailText, partListText }) => {
      const res = await api.post(`/rfqs/${rfqId}/extract`, { emailText, partListText });
      return res.data;
    },
  });
}

export function useConfirmExtraction(rfqId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ extractionId, confirmedData }) => {
      const res = await api.post(`/rfqs/${rfqId}/extractions/${extractionId}/confirm`, confirmedData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}
