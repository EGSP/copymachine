import { treaty } from "@elysiajs/eden";
import type { App } from "copymachine-backend/app";

function backendBaseUrl(): string {
	const url = import.meta.env.VITE_EXTERNAL_BACKEND_URL;
	if (!url) {
		throw new Error("Не задан VITE_EXTERNAL_BACKEND_URL");
	}
	return url.replace(/\/$/, "");
}

/** Типобезопасный клиент Elysia Eden (treaty) */
export const api = treaty<App>(backendBaseUrl());

/** Достаёт data или бросает по ошибке HTTP / сети */
export async function treatyData<T>(promise: Promise<{ data: T; error: null } | { data: null; error: unknown }>): Promise<T> {
	const result = await promise;
	if (result.error != null) {
		throw new Error(
			typeof result.error === "object" && result.error !== null && "value" in result.error
				? JSON.stringify(result.error)
				: String(result.error),
		);
	}
	return result.data as T;
}
