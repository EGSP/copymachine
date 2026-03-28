import { PlansDB } from "./plans-db.js";

const globalWithDB = globalThis as typeof globalThis & {
	plansDb?: PlansDB;
};

export const plansDb = globalWithDB.plansDb ?? new PlansDB("plans");
globalWithDB.plansDb = plansDb;

void plansDb.init();
