// client/src/hooks/useCosting.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export function usePartCosting(partId) {
  return useQuery({
    queryKey: ['part-costing', partId],
    queryFn: async () => {
      if (!partId) return null;
      const res = await api.get(`/parts/${partId}/costing`);
      return res.data;
    },
    enabled: !!partId,
  });
}

export function useCalculateCosting(partId) {
  return useMutation({
    mutationFn: async (costingInput) => {
      const res = await api.post(`/parts/${partId}/calculate`, costingInput);
      return res.data;
    },
  });
}

export function useSaveCosting(partId, rfqId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (costingInput) => {
      const res = await api.post(`/parts/${partId}/save-costing`, costingInput);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['part-costing', partId] });
      if (rfqId) {
        queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
      }
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}
