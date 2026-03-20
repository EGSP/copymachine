
import { getServer, BackgroundServer } from '../background/background.server'

export async function ensureBackgroundServer() {
    let server = getServer()
    if (!server) {
        server = await new BackgroundServer().ini()
    }
    if (server) {
        return "Background server is running"
    }
    throw new Error("Failed to start background server")
}