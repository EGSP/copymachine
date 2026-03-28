import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import CreatePlanForm from "#/components/leafs/CreatePlanForm";
import PlansFrame from "#/components/leafs/PlansFrame";
import PathPicker from "#/components/PathPicker";
import { useBackendHealthQuery } from "#/lib/queries/backend";
import { useCopyAnalysisQuery } from "#/lib/queries/copy";

export const Route = createFileRoute("/")({ component: App });

const SOURCE_PATH_STORAGE_KEY = "sourcePath";
const TARGET_PATH_STORAGE_KEY = "targetPath";

function App() {
	const [sourcePath, setSourcePath] = useState("");
	const [targetPath, setTargetPath] = useState("");

	const healthQuery = useBackendHealthQuery({ retry: 2 });

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

	const copyAnalysisQuery = useCopyAnalysisQuery({
		sourcePath,
		targetPath,
		enabled:
			healthQuery.isSuccess && Boolean(sourcePath) && Boolean(targetPath),
	});

	const analysisText =
		copyAnalysisQuery.data !== undefined
			? `Будет скопировано файлов: ${copyAnalysisQuery.data.filesCount}, общий размер: ${copyAnalysisQuery.data.totalSize.value} ${copyAnalysisQuery.data.totalSize.unit}`
			: "";

	if (healthQuery.isPending) {
		return (
			<p className="text-sm text-(--sea-ink-soft)">Подключение к бэкенду…</p>
		);
	}

	if (healthQuery.isError) {
		return <p>Бэкенд недоступен (проверь URL и что сервер запущен).</p>;
	}

	return (
		<main className="">
			<p>Copy Machine</p>
			<div className="flex flex-col gap-4">
				<PlansFrame plansQueryEnabled={healthQuery.isSuccess} />

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
