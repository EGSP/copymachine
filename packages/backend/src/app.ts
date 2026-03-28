import { cors } from "@elysiajs/cors";
import type { Plan, StartCopyData } from "copymachine-shared";
import { Elysia } from "elysia";
import { analyzeCopy, copy } from "./copy/copy-service.js";
import { plansDb } from "./db/instance.js";
import { openFile, openFolder } from "./path-pick/native.js";

const defaultCorsOrigin =
	process.env.CORS_ORIGIN ?? "http://localhost:3000";

/** Собирает HTTP API для Eden и рантайма */
export const app = new Elysia()
	.use(
		cors({
			origin: defaultCorsOrigin,
		}),
	)
	.group("/api", (api) =>
		api
			.get("/health", () => ({ ok: true as const }))
			.get("/plans", async () => plansDb.get())
			.post("/plans", async ({ body }) => {
				await plansDb.create(body as Plan);
				return { ok: true as const };
			})
			.put("/plans", async ({ body }) => {
				await plansDb.update(body as Plan);
				return { ok: true as const };
			})
			.delete("/plans/:id", async ({ params }) => {
				await plansDb.deleteById(params.id);
				return { ok: true as const };
			})
			.post("/copy/analysis", async ({ body }) => {
				const { sourcePath, targetPath } = body as StartCopyData;
				return analyzeCopy(sourcePath, targetPath);
			})
			.post("/copy/start", async ({ body }) => {
				const { sourcePath, targetPath } = body as StartCopyData;
				await copy(sourcePath, targetPath);
				return { ok: true as const };
			})
			.post("/path-pick/folder", async () => openFolder())
			.post("/path-pick/file", async () => openFile()),
	);

export type App = typeof app;
