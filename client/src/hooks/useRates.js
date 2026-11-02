// client/src/hooks/useRates.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export function useRates({ rateType, search, page = 1, limit = 20, effectiveAt } = {}) {
  return useQuery({
    queryKey: ['rates', { rateType, search, page, limit, effectiveAt }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (rateType && rateType !== 'ALL') params.append('rateType', rateType);
      if (search) params.append('search', search);
      if (page) params.append('page', String(page));
      if (limit) params.append('limit', String(limit));
      if (effectiveAt) params.append('effectiveAt', effectiveAt);

      const res = await api.get(`/rates?${params.toString()}`);
      return res;
    },
    keepPreviousData: true,
  });
}

export function useEffectiveRates(at) {
  return useQuery({
    queryKey: ['rates', 'effective', at],
    queryFn: async () => {
      const url = at ? `/rates/effective?at=${encodeURIComponent(at)}` : '/rates/effective';
      const res = await api.get(url);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRateHistory(rateId) {
  return useQuery({
    queryKey: ['rates', rateId, 'history'],
    queryFn: async () => {
      if (!rateId) return [];
      const res = await api.get(`/rates/${rateId}/history`);
      return res.data;
    },
    enabled: !!rateId,
  });
}

export function useCreateRateVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rateData) => {
      const res = await api.post('/rates', rateData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rates'] });
    },
  });
}
