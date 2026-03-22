import { create } from "zustand";
import type { Plan } from "#/background/plans/plans";

export type PlansStore = {
	plan: Plan | null;
	setPlan: (plan: Plan | null) => void;
	clearPlan: () => void;
};

export const usePlansStore = create<PlansStore>((set) => ({
	plan: null,
	setPlan: (plan) => set({ plan }),
	clearPlan: () => set({ plan: null }),
}));
