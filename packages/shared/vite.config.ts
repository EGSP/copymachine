import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
	// Тесты импортируют пакет по имени публикации — резолвим на исходники без сборки.
	resolve: {
		alias: {
			"copymachine-shared": fileURLToPath(new URL("./src/index.ts", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
	},
});
