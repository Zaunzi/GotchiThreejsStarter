/**
 * Run at most N async tasks at a time. Used to limit concurrent /api/render requests
 * so we don't overwhelm the browser or server (e.g. 180+ gotchis).
 */
export function createConcurrencyLimit(maxConcurrent: number) {
	let inFlight = 0;
	const waiting: Array<() => void> = [];

	function acquire(): Promise<void> {
		if (inFlight < maxConcurrent) {
			inFlight += 1;
			return Promise.resolve();
		}
		return new Promise<void>((resolve) => {
			waiting.push(() => {
				inFlight += 1;
				resolve();
			});
		});
	}

	function release(): void {
		inFlight -= 1;
		const next = waiting.shift();
		if (next) next();
	}

	async function run<T>(fn: () => Promise<T>): Promise<T> {
		await acquire();
		try {
			return await fn();
		} finally {
			release();
		}
	}

	return { run };
}
