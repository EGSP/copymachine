import axios from "axios";

export function backendBaseUrl(): string {
	const url = import.meta.env.VITE_EXTERNAL_BACKEND_URL;
	if (!url) {
		throw new Error("Не задан VITE_EXTERNAL_BACKEND_URL");
	}
	return url.replace(/\/$/, "");
}

/** Клиент к REST API бэкенда (префикс `/api`) */
export const apiClient = axios.create({
	baseURL: `${backendBaseUrl()}/api`,
});
