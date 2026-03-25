
import { createServerFn } from "@tanstack/react-start";
import { BackgroundServer, getServer } from "../background/background.server";

export const ensureBackgroundServer = createServerFn({ method: "POST" }).handler(
	async () => {
		let server = getServer();
		if (!server) {
			server = await new BackgroundServer().ini();
		}
		if (server) {
			return "Background server is running";
		}
		throw new Error("Failed to start background server");
	},
);