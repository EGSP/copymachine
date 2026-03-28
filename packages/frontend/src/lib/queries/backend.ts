import { useQuery } from "@tanstack/react-query";
import { apiClient } from "#/lib/api";

export const backendHealthQueryKey = ["backendHealth"] as const;

export function useBackendHealthQuery(options?: { retry?: number }) {
	return useQuery({
		queryKey: backendHealthQueryKey,
		queryFn: async () => {
			const { data } = await apiClient.get<{ ok: true }>("/health");
			return data;
		},
		retry: options?.retry ?? 2,
	});
}
