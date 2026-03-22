import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureBackgroundServer } from "#/actions/background.functions";
import { getCopyAnalysis, startCopy } from "#/actions/copy/copy.functions";
import { createPlan, getPlans } from "#/actions/plans.functions";
import type { Plan } from "#/background/plans/plans";
import ListBox from "#/components/builblocks/ListBox";
import PathPicker from "#/components/PathPicker";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "#/components/ui/resizable";
import { PathType } from "#/lib/files/files";

export const Route = createFileRoute("/")({ component: App });

const SOURCE_PATH_STORAGE_KEY = "sourcePath";
const TARGET_PATH_STORAGE_KEY = "targetPath";

const plansQueryKey = ["plans"] as const;

function copyAnalysisQueryKey(sourcePath: string, targetPath: string) {
	return ["copyAnalysis", sourcePath, targetPath] as const;
}

function App() {
	const queryClient = useQueryClient();
	const [sourcePath, setSourcePath] = useState("");
	const [targetPath, setTargetPath] = useState("");
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [planName, setPlanName] = useState("");

	const ensureServerMutation = useMutation({
		mutationKey: ["ensureBackgroundServer"],
		mutationFn: () => ensureBackgroundServer(),
		onSuccess: (result) => {
			console.log("Background server ensured", result);
		},
		onError: (err) => {
			console.error(err instanceof Error ? err.message : err);
		},
	});

	useEffect(() => {
		void ensureServerMutation.mutate();
	}, [ensureServerMutation.mutate]);

	useEffect(() => {
		const savedSourcePath = localStorage.getItem(SOURCE_PATH_STORAGE_KEY);
		const savedTargetPath = localStorage.getItem(TARGET_PATH_STORAGE_KEY);

		if (savedSourcePath !== null) {
			setSourcePath(savedSourcePath);
		}

		if (savedTargetPath !== null) {
			setTargetPath(savedTargetPath);
		}
	}, []);

	useEffect(() => {
		console.log("sourcePath", sourcePath);
		localStorage.setItem(SOURCE_PATH_STORAGE_KEY, sourcePath);
	}, [sourcePath]);

	useEffect(() => {
		console.log("targetPath", targetPath);
		localStorage.setItem(TARGET_PATH_STORAGE_KEY, targetPath);
	}, [targetPath]);

	const plansQuery = useQuery({
		queryKey: plansQueryKey,
		queryFn: () => getPlans(),
		enabled: ensureServerMutation.isSuccess,
	});

	const copyAnalysisQuery = useQuery({
		queryKey: copyAnalysisQueryKey(sourcePath, targetPath),
		queryFn: () => getCopyAnalysis({ data: { sourcePath, targetPath } }),
		enabled:
			ensureServerMutation.isSuccess &&
			Boolean(sourcePath) &&
			Boolean(targetPath),
	});

	const startCopyMutation = useMutation({
		mutationKey: ["startCopy"],
		mutationFn: (paths: { sourcePath: string; targetPath: string }) =>
			startCopy({ data: paths }),
	});

	const createPlanMutation = useMutation({
		mutationKey: ["createPlan"],
		mutationFn: (plan: Plan) => createPlan({ data: plan }),
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

	const plans = plansQuery.data ?? [];
	const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
	const selectedPlanIndex = plans.findIndex(
		(plan) => plan.id === selectedPlanId,
	);

	const analysisText =
		copyAnalysisQuery.data !== undefined
			? `Будет скопировано файлов: ${copyAnalysisQuery.data.filesCount}, общий размер: ${copyAnalysisQuery.data.totalSize.value} ${copyAnalysisQuery.data.totalSize.unit}`
			: "";

	if (ensureServerMutation.isPending) {
		return (
			<p className="text-sm text-(--sea-ink-soft)">Запуск фонового сервера…</p>
		);
	}

	if (ensureServerMutation.isError) {
		return <p>Background server is not running</p>;
	}

	return (
		<main className="">
			<p>Hello World</p>
			<div className="flex flex-col gap-4">
				<ResizablePanelGroup orientation="horizontal">
					<ResizablePanel defaultSize={"21%"}>
						<div className="p-3">
							{plans.length === 0 ? (
								<p className="text-sm text-(--sea-ink-soft)">
									Нет ни одного плана.
								</p>
							) : (
								<ListBox
									items={plans}
									selectedIndex={
										selectedPlanIndex >= 0 ? selectedPlanIndex : null
									}
									onSelect={(item) => setSelectedPlanId(item.id ?? null)}
									ariaLabel="Список планов"
									renderItem={({ item }) => item.name}
								/>
							)}
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel>
						<div className="p-3">
							{selectedPlan ? (
								<p className="text-sm text-(--sea-ink)">
									План: {selectedPlan.name}, ID: {selectedPlan.id ?? "нет id"}
								</p>
							) : (
								<p className="text-sm text-(--sea-ink-soft)">
									Выберите план, чтобы увидеть его название и ID.
								</p>
							)}
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>

				<PathPicker
					label="Source Path"
					value={sourcePath}
					onChange={setSourcePath}
				/>
				<PathPicker
					label="Target Path"
					value={targetPath}
					onChange={setTargetPath}
				/>
				<Button
					variant={"default"}
					disabled={startCopyMutation.isPending}
					onClick={() => startCopyMutation.mutate({ sourcePath, targetPath })}
				>
					Start copy
				</Button>
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
				{!sourcePath || !targetPath ? (
					<p className="text-sm text-(--sea-ink-soft)">
						Чтобы увидеть анализ, выберите source и target.
					</p>
				) : copyAnalysisQuery.isPending ? (
					<p className="text-sm text-(--sea-ink-soft)">
						Считаю анализ копирования...
					</p>
				) : copyAnalysisQuery.isError ? (
					<p className="text-sm text-(--sea-ink-soft)">
						Нет данных для анализа
					</p>
				) : (
					<p className="text-sm text-(--sea-ink)">
						{analysisText || "Нет данных для анализа"}
					</p>
				)}
			</div>
		</main>
	);
}
