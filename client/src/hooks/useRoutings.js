// client/src/hooks/useRoutings.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export function useRoutingSuggestions(partId, minScore = 0.5) {
  return useQuery({
    queryKey: ['routing-suggestions', partId, minScore],
    queryFn: async () => {
      if (!partId) return [];
      const res = await api.get(`/parts/${partId}/routing-suggestions?minScore=${minScore}`);
      return res.data;
    },
    enabled: !!partId,
  });
}

export function useApplyRouting(partId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourcePartId) => {
      const res = await api.post(`/parts/${partId}/apply-routing`, { sourcePartId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['part-costing', partId] });
      queryClient.invalidateQueries({ queryKey: ['routing-suggestions', partId] });
    },
  });
}
