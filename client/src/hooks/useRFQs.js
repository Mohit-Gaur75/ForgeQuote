// client/src/hooks/useRFQs.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useRFQs(params = {}) {
  return useQuery({
    queryKey: ['rfqs', params],
    queryFn: async () => {
      const res = await api.get('/rfqs', { params });
      return res; // returns { success, data, meta, requestId }
    },
    staleTime: 10000,
  });
}

export function useRFQ(id) {
  return useQuery({
    queryKey: ['rfq', id],
    queryFn: async () => {
      const res = await api.get(`/rfqs/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateRFQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rfqData) => {
      const res = await api.post('/rfqs', rfqData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}

export function useUpdateRFQStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, lostReason }) => {
      const res = await api.patch(`/rfqs/${id}/status`, { status, lostReason });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfq', variables.id] });
    },
  });
}
