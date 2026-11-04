// client/src/hooks/useQuotations.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export function useQuotation(id) {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/quotations/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateQuotation(rfqId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteData) => {
      const res = await api.post(`/rfqs/${rfqId}/quotations`, quoteData);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useSendQuotation(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sendData) => {
      const res = await api.post(`/quotations/${id}/send`, sendData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}
