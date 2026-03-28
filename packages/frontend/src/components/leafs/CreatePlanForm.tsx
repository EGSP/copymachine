import type { Plan } from "copymachine-shared";
import { PathType } from "copymachine-shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { api, treatyData } from "#/lib/api";
import { plansQueryKey } from "#/lib/plansQuery";

type CreatePlanFormProps = {
	sourcePath: string;
	targetPath: string;
};

export default function CreatePlanForm({
	sourcePath,
	targetPath,
}: CreatePlanFormProps) {
	const queryClient = useQueryClient();
	const [planName, setPlanName] = useState("");

	const createPlanMutation = useMutation({
		mutationKey: ["createPlan"],
		mutationFn: (plan: Plan) => treatyData(api.api.plans.post(plan)),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: plansQueryKey });
			setPlanName("");
		},
	});

	function handleCreatePlan() {
		const normalizedName = planName.trim();
		if (!normalizedName || !sourcePath || !targetPath) {
			return;
		}

		createPlanMutation.mutate({
			name: normalizedName,
			source: { path: sourcePath, type: PathType.DIRECTORY },
			target: { path: targetPath, type: PathType.DIRECTORY },
		});
	}

	return (
		<>
			<Input
				type="text"
				value={planName}
				onChange={(event) => setPlanName(event.target.value)}
				placeholder="Название плана"
				aria-label="Название плана"
			/>
			<Button
				variant={"outline"}
				onClick={handleCreatePlan}
				disabled={
					!planName.trim() ||
					!sourcePath ||
					!targetPath ||
					createPlanMutation.isPending
				}
			>
				Create test plan
			</Button>
		</>
	);
}
