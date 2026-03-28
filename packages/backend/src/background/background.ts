import { Ticker } from "./ticker";


const ticker = new Ticker(1000);

export async function startBackground() {
    ticker.add({
        id: () => "test",
        tick: async () => {
            console.log("test tick");
        },
    });

    await ticker.start();
}