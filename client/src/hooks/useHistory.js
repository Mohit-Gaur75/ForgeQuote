// client/src/hooks/useHistory.js
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';

export function useHistorySearch({
  q = '',
  material = 'ALL',
  minWeight = '',
  maxWeight = '',
  minVolume = '',
  maxVolume = '',
  page = 1,
  limit = 15,
} = {}) {
  return useQuery({
    queryKey: ['history', { q, material, minWeight, maxWeight, minVolume, maxVolume, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q && q.trim()) params.append('q', q.trim());
      if (material && material !== 'ALL') params.append('material', material);
      if (minWeight !== '') params.append('minWeight', minWeight);
      if (maxWeight !== '') params.append('maxWeight', maxWeight);
      if (minVolume !== '') params.append('minVolume', minVolume);
      if (maxVolume !== '') params.append('maxVolume', maxVolume);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await api.get(`/history/search?${params.toString()}`);
      return res;
    },
    keepPreviousData: true,
  });
}
