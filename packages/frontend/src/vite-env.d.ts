/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Базовый URL бэкенда — из .env (префикс VITE_). */
	readonly VITE_EXTERNAL_BACKEND_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
