export type Tick = {
    id: () => string;
    tick: () => Promise<void>;
}

export class Ticker {

    /**
     * Точность тикера в миллисекундах
     */
    readonly precision: number = 1000;

    readonly ticks: Map<string, Tick> = new Map();

    /**
     * Список тиков, которые выполняются в данный момент
     */
    private readonly runningTicks: Set<string> = new Set();

    constructor(precision: number) {
        this.precision = precision;
    }

    async start() {
        setInterval(async () => {
            await this.tick();
        }, this.precision);
    }

    private async tick() {
        for (const [id, tick] of this.ticks) {
            if (this.runningTicks.has(id)) {
                continue;
            }
            this.runningTicks.add(id);
            tick.tick().then(() => {
                this.runningTicks.delete(id);
            });
        }
    }

    add(tick: Tick) {
        const id = tick.id();
        if (this.ticks.has(id)) {
            throw new Error(`Tick with id ${id} already exists`);
        }
        this.ticks.set(tick.id(), tick);
    }

    remove(id: string) {
        this.ticks.delete(id);
    }
}