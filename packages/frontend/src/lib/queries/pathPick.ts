import { useMutation } from "@tanstack/react-query";
import { axs } from "#/lib/api";

export type PathPickMode = "file" | "folder";

/** Нативный выбор пути через бэкенд (один запрос на вызов mutate) */
export function usePathPickMutation() {
	return useMutation({
		mutationKey: ["pathPick"],
		mutationFn: async (mode: PathPickMode) => {
			const { data } =
				mode === "folder"
					? await axs.post<string | null>("/path-pick/folder")
					: await axs.post<string | null>("/path-pick/file");
			return data;
		},
	});
}
