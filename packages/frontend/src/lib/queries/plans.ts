import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Plan } from "copymachine-shared";
import { axs } from "#/lib/api";

export const plansQueryKey = ["plans"] as const;

export function usePlansQuery(options: { enabled: boolean }) {
	return useQuery({
		queryKey: plansQueryKey,
		queryFn: async () => {
			const { data } = await axs.get<Plan[]>("/plans");
			return data;
		},
		enabled: options.enabled,
	});
}

export function useCreatePlanMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: ["createPlan"],
		mutationFn: async (plan: Plan) => {
			await axs.post("/plans", plan);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: plansQueryKey });
		},
	});
}

export function useUpdatePlanMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (plan: Plan) => {
			await axs.put("/plans", plan);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: plansQueryKey });
		},
	});
}

export function useDeletePlanMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			await axs.delete(`/plans/${encodeURIComponent(id)}`);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: plansQueryKey });
		},
	});
}
