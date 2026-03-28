import type { Plan, StartCopyData } from "copymachine-shared";
import express from "express";
import { analyzeCopy, copy } from "./copy/copy-service.js";
import { plansDb } from "./db/instance.js";
import { openFile, openFolder } from "./path-pick/native.js";
import cors from "cors";

/** Оборачивает async-обработчик, чтобы ошибки попадали в error-middleware Express 4 */
function asyncHandler(
	fn: (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => Promise<void>,
) {
	return (req: express.Request, res: express.Response, next: express.NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

const router = express.Router();

router.get("/health", (_req, res) => {
	res.json({ ok: true as const });
});

router.get(
	"/plans",
	asyncHandler(async (_req, res) => {
		res.json(await plansDb.get());
	}),
);

router.post(
	"/plans",
	asyncHandler(async (req, res) => {
		await plansDb.create(req.body as Plan);
		res.json({ ok: true as const });
	}),
);

router.put(
	"/plans",
	asyncHandler(async (req, res) => {
		await plansDb.update(req.body as Plan);
		res.json({ ok: true as const });
	}),
);

router.delete(
	"/plans/:id",
	asyncHandler(async (req, res) => {
		await plansDb.deleteById(req.params.id);
		res.json({ ok: true as const });
	}),
);

router.post(
	"/copy/analysis",
	asyncHandler(async (req, res) => {
		const { sourcePath, targetPath } = req.body as StartCopyData;
		res.json(await analyzeCopy(sourcePath, targetPath));
	}),
);

router.post(
	"/copy/start",
	asyncHandler(async (req, res) => {
		const { sourcePath, targetPath } = req.body as StartCopyData;
		await copy(sourcePath, targetPath);
		res.json({ ok: true as const });
	}),
);

router.post(
	"/path-pick/folder",
	asyncHandler(async (_req, res) => {
		res.json(await openFolder());
	}),
);

router.post(
	"/path-pick/file",
	asyncHandler(async (_req, res) => {
		res.json(await openFile());
	}),
);

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
