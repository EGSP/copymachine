import path from "node:path";

/** Каталог для lowdb; по умолчанию ./data от cwd бэкенда */
export const dbDirectory = process.env.DATA_DIR
	? path.resolve(process.env.DATA_DIR)
	: path.resolve(process.cwd(), "data");
