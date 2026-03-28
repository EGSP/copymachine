import type { Plan } from "copymachine-shared";
import { PathType } from "copymachine-shared";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useCreatePlanMutation } from "#/lib/queries/plans";

type CreatePlanFormProps = {
	sourcePath: string;
	targetPath: string;
};

export default function CreatePlanForm({
	sourcePath,
	targetPath,
}: CreatePlanFormProps) {
	const [planName, setPlanName] = useState("");

	const createPlanMutation = useCreatePlanMutation();

	function handleCreatePlan() {
		const normalizedName = planName.trim();
		if (!normalizedName || !sourcePath || !targetPath) {
			return;
		}

		const plan: Plan = {
			name: normalizedName,
			source: { path: sourcePath, type: PathType.DIRECTORY },
			target: { path: targetPath, type: PathType.DIRECTORY },
		};

		createPlanMutation.mutate(plan, {
			onSuccess: () => setPlanName(""),
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
