import type { Plan } from "./plans/plans"

console.log("Server started")

const globalWithServer = globalThis as typeof globalThis & {
    backgroundServer?: BackgroundServer
}

export function getServer() {
    return globalWithServer.backgroundServer
}

export class BackgroundServer {

    plans = new Set<Plan>()
    
    async ini() {
        if (globalWithServer.backgroundServer) {
            console.log("Background server already started")
            return globalWithServer.backgroundServer
        }

        console.log("Initializing background server")
        const server = new BackgroundServer()
        globalWithServer.backgroundServer = server
        console.log("Background server initialized")

        console.log("Starting background server")
        await server.start()
        console.log("Background server started")
        return server
    }

    async start() {
    }
}
