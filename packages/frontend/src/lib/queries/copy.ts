import { useQuery } from "@tanstack/react-query";
import type { CopyAnalysis, StartCopyData } from "copymachine-shared";
import { apiClient } from "#/lib/api";

export function copyAnalysisQueryKey(sourcePath: string, targetPath: string) {
	return ["copyAnalysis", sourcePath, targetPath] as const;
}

export function useCopyAnalysisQuery(params: {
	sourcePath: string;
	targetPath: string;
	enabled: boolean;
}) {
	return useQuery({
		queryKey: copyAnalysisQueryKey(params.sourcePath, params.targetPath),
		queryFn: async () => {
			const body: StartCopyData = {
				sourcePath: params.sourcePath,
				targetPath: params.targetPath,
			};
			const { data } = await apiClient.post<CopyAnalysis>(
				"/copy/analysis",
				body,
			);
			return data;
		},
		enabled: params.enabled,
	});
}
