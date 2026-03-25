import path from "node:path";
import { PlansDB } from "./plans.db.server";

export const dbDirectory = path.resolve(process.cwd(), "data");

export const globalWithDB = globalThis as typeof globalThis & {
	plansDb?: PlansDB;
};

export const plansDb = globalWithDB.plansDb ?? new PlansDB("plans");
globalWithDB.plansDb = plansDb;
void plansDb.init();

