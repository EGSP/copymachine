import { Elysia } from "elysia";

// PORT и HOSTNAME — из .env (см. .env.example), при отсутствии файла работают дефолты.
const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

const app = new Elysia()
	.get("/", () => "Hello Elysia")
	.listen({ hostname, port });

console.log(
	`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
