import type { Plan, StartCopyData } from "copymachine-shared";
import express from "express";
import { analyzeCopy, copy } from "./copy/copy-service.js";
import { plansDb } from "./db/instance.js";
import { openFile, openFolder } from "./path-pick/native.js";
import cors from "cors";

const router = express.Router();

router.get("/health", (_req, res) => {
	res.json({ ok: true as const });
});

router.get("/plans", async (_req, res) => {
	res.json(await plansDb.get());
});

router.post("/plans", async (req, res) => {
	await plansDb.create(req.body as Plan);
	res.json({ ok: true as const });
});

router.put("/plans", async (req, res) => {
	await plansDb.update(req.body as Plan);
	res.json({ ok: true as const });
});

router.delete("/plans/:id", async (req, res) => {
	await plansDb.deleteById(req.params.id);
	res.json({ ok: true as const });
});

router.post("/copy/analysis", async (req, res) => {
	const { sourcePath, targetPath } = req.body as StartCopyData;
	res.json(await analyzeCopy(sourcePath, targetPath));
});

router.post("/copy/start", async (req, res) => {
	const { sourcePath, targetPath } = req.body as StartCopyData;
	await copy(sourcePath, targetPath);
	res.json({ ok: true as const });
});

router.post("/path-pick/folder", async (_req, res) => {
	res.json(await openFolder());
});

router.post("/path-pick/file", async (_req, res) => {
	res.json(await openFile());
});

export const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", router);

app.use(
	(
		err: unknown,
		_req: express.Request,
		res: express.Response,
		_next: express.NextFunction,
	) => {
		console.error(err);
		const message =
			err instanceof Error ? err.message : "Внутренняя ошибка сервера";
		res.status(500).json({ error: message });
	},
);
