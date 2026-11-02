// client/src/hooks/useParts.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useCreatePart(rfqId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partData) => {
      const res = await api.post(`/rfqs/${rfqId}/parts`, partData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}

export function useUpdatePart(rfqId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...partData }) => {
      const res = await api.patch(`/parts/${id}`, partData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}

export function useDeletePart(rfqId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partId) => {
      const res = await api.delete(`/parts/${partId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}
