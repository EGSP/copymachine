import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureBackgroundServer } from "#/actions/background.functions";
import { getCopyAnalysis, startCopy } from "#/actions/copy/copy.functions";
import CreatePlanForm from "#/components/leafs/CreatePlanForm";
import PlansList from "#/components/leafs/PlansList";
import PathPicker from "#/components/PathPicker";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({ component: App });

const SOURCE_PATH_STORAGE_KEY = "sourcePath";
const TARGET_PATH_STORAGE_KEY = "targetPath";

function copyAnalysisQueryKey(sourcePath: string, targetPath: string) {
	return ["copyAnalysis", sourcePath, targetPath] as const;
}

function App() {
	const [sourcePath, setSourcePath] = useState("");
	const [targetPath, setTargetPath] = useState("");

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
				<PlansList plansQueryEnabled={ensureServerMutation.isSuccess} />

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
				{/* <Button
					variant={"default"}
					disabled={startCopyMutation.isPending}
					onClick={() => startCopyMutation.mutate({ sourcePath, targetPath })}
				>
					Start copy
				</Button> */}
				<CreatePlanForm sourcePath={sourcePath} targetPath={targetPath} />
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
