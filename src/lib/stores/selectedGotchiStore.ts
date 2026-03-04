import { writable } from 'svelte/store';
import type { Aavegotchi } from '$lib/utils/graphql';

export interface RenderUrls {
	pngHeadshotUrl?: string;
	pngFullUrl?: string;
	glbUrl?: string;
}

export interface SelectedGotchi {
	tokenId: string;
	name?: string;
	gotchi?: Aavegotchi;
	renderUrls?: RenderUrls;
}

function createSelectedGotchiStore() {
	const { subscribe, set } = writable<SelectedGotchi | null>(null);

	return {
		subscribe,
		set: (gotchi: SelectedGotchi | null) => set(gotchi),
		clear: () => set(null)
	};
}

export const selectedGotchiStore = createSelectedGotchiStore();
