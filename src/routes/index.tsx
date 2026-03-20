import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCopyAnalysis, startCopy } from "#/actions/copy/copy.functions";
import PathPicker from "#/components/PathPicker";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({ component: App });

const SOURCE_PATH_STORAGE_KEY = "sourcePath";
const TARGET_PATH_STORAGE_KEY = "targetPath";

function App() {
	const [sourcePath, setSourcePath] = useState("");
	const [targetPath, setTargetPath] = useState("");
	const [analysisText, setAnalysisText] = useState("");
	const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

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

	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			<p>Hello World</p>
			<div className="flex flex-col gap-4">
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
				{!sourcePath || !targetPath ? (
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Чтобы увидеть анализ, выберите source и target.
					</p>
				) : isAnalysisLoading ? (
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Считаю анализ копирования...
					</p>
				) : (
					<p className="text-sm text-[var(--sea-ink)]">
						{analysisText || "Нет данных для анализа"}
					</p>
				)}
			</div>
		</main>
	);
}
