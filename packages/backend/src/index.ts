import { app } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

app.listen({ hostname, port });

console.log(
	`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
