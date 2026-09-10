import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ApiResponse, DiscoveryFiltersResponse } from '@devconnect/shared';

export function useDiscoveryFilters() {
  return useQuery({
    queryKey: ['discovery-filters'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DiscoveryFiltersResponse>>('/discovery/filters');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
