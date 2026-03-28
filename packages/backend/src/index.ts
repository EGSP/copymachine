// Node не подгружает .env сам — только через dotenv (раньше Bun делал это неявно)
import "dotenv/config";
import { app } from "./app.js";
import { startBackground } from "./background/background.js";


await startBackground();

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

app.listen(port, hostname, () => {
	console.log(`Express слушает http://${hostname}:${port}`);
});
