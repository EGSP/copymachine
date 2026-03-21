import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCopyAnalysis, startCopy } from "#/actions/copy/copy.functions";
import { createPlan, getPlans } from "#/actions/plans.functions";
import PathPicker from "#/components/PathPicker";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { ensureBackgroundServer } from "#/actions/background.functions";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "#/components/ui/resizable";
import ListBox from "#/components/builblocks/Listbox";
import type { Plan } from "#/background/plans/plans";
import { PathType } from "#/lib/files/files";

export const Route = createFileRoute("/")({ component: App });

const SOURCE_PATH_STORAGE_KEY = "sourcePath";
const TARGET_PATH_STORAGE_KEY = "targetPath";

function App() {
	const [sourcePath, setSourcePath] = useState("");
	const [targetPath, setTargetPath] = useState("");
	const [analysisText, setAnalysisText] = useState("");
	const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
	const [hasServer, setHasServer] = useState(false);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [planName, setPlanName] = useState("");

	useEffect(() => {

		void ensureBackgroundServer()
			.then((result: string) => {
				console.log("Background server ensured", result);
				setHasServer(true);

			})
			.catch((err) => {
				setHasServer(false);
				console.error((err as Error).message);
			});

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

	useEffect(() => {
		let cancelled = false;

		async function loadPlans() {
			if (!hasServer) return;

			try {
				const result = await (getPlans as unknown as () => Promise<Plan[]>)();
				if (cancelled) return;
				setPlans(result);
			} catch {
				if (cancelled) return;
				setPlans([]);
			}
		}

		void loadPlans();

		return () => {
			cancelled = true;
		};
	}, [hasServer]);

	useEffect(() => {
		let cancelled = false;

		async function loadAnalysis() {
			if (!sourcePath || !targetPath) {
				setAnalysisText("");
				setIsAnalysisLoading(false);
				return;
			}

			setIsAnalysisLoading(true);
			try {
				const result = await (
					getCopyAnalysis as unknown as (args: {
						data: { sourcePath: string; targetPath: string };
					}) => Promise<{
						filesCount: number;
						totalSize: { value: number; unit: string };
					}>
				)({ data: { sourcePath, targetPath } });

				if (cancelled) return;
				setAnalysisText(
					`Будет скопировано файлов: ${result.filesCount}, общий размер: ${result.totalSize.value} ${result.totalSize.unit}`,
				);
			} catch {
				if (cancelled) return;
				setAnalysisText("");
			} finally {
				if (!cancelled) {
					setIsAnalysisLoading(false);
				}
			}
		}

		void loadAnalysis();

		return () => {
			cancelled = true;
		};
	}, [sourcePath, targetPath]);

	async function handleStartCopy() {
		await (
			startCopy as unknown as (args: {
				data: { sourcePath: string; targetPath: string };
			}) => Promise<void>
		)({ data: { sourcePath, targetPath } });
	}

	async function handleCreatePlan() {
		const normalizedName = planName.trim();
		if (!normalizedName || !sourcePath || !targetPath) {
			return;
		}

		await (
			createPlan as unknown as (args: {
				data: Plan;
			}) => Promise<void>
		)({
			data: {
				name: normalizedName,
				source: { path: sourcePath, type: PathType.DIRECTORY },
				target: { path: targetPath, type: PathType.DIRECTORY },
			},
		});

		const refreshedPlans = await (getPlans as unknown as () => Promise<Plan[]>)();
		setPlans(refreshedPlans);
		setPlanName("");
	}

	const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
	const selectedPlanIndex = plans.findIndex((plan) => plan.id === selectedPlanId);

	if (!hasServer) {
		return <p>Background server is not running</p>
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
									selectedIndex={selectedPlanIndex >= 0 ? selectedPlanIndex : null}
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
				<Button variant={"default"} onClick={handleStartCopy}>
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
					disabled={!planName.trim() || !sourcePath || !targetPath}
				>
					Create test plan
				</Button>
				{!sourcePath || !targetPath ? (
					<p className="text-sm text-(--sea-ink-soft)">
						Чтобы увидеть анализ, выберите source и target.
					</p>
				) : isAnalysisLoading ? (
					<p className="text-sm text-(--sea-ink-soft)">
						Считаю анализ копирования...
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
