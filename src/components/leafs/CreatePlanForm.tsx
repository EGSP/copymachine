import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createPlan } from "#/actions/plans.functions";
import type { Plan } from "#/background/plans/plans";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { PathType } from "#/lib/files/files";
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
	const createPlanFn = useServerFn(createPlan);

	const createPlanMutation = useMutation({
		mutationKey: ["createPlan"],
		mutationFn: (plan: Plan) => createPlanFn({ data: plan }),
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
