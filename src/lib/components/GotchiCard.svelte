<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Loader2, Gamepad2 } from '@lucide/svelte';
	import type { Aavegotchi } from '$lib/utils/graphql';
	import type { RenderUrls } from '$lib/stores/selectedGotchiStore';

	interface Props {
		gotchi: Aavegotchi;
		renderUrls: RenderUrls | null | undefined;
		fetchRenderUrls: (tokenId: string) => Promise<RenderUrls | null>;
		onPlay: () => void;
	}

	let { gotchi, renderUrls, fetchRenderUrls, onPlay }: Props = $props();

	let cardEl = $state<HTMLDivElement | null>(null);
	let isInView = $state(false);
	let previewUrl = $state<string | null>(null);
	let loadingPreview = $state(true);
	let previewError = $state(false);
	let hasStartedFetch = $state(false);

	let observer: IntersectionObserver | null = null;

	onMount(() => {
		if (!cardEl) return;
		observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) isInView = true;
			},
			{ rootMargin: '100px', threshold: 0 }
		);
		observer.observe(cardEl);
	});

	onDestroy(() => {
		observer?.disconnect();
		observer = null;
	});

	$effect(() => {
		const urls = renderUrls;
		const tokenId = gotchi.tokenId;
		if (urls) {
			previewUrl = urls.pngHeadshotUrl ?? urls.pngFullUrl ?? null;
			loadingPreview = false;
			previewError = !previewUrl;
			return;
		}
		if (!isInView || hasStartedFetch) return;
		hasStartedFetch = true;
		loadingPreview = true;
		previewUrl = null;
		previewError = false;
		fetchRenderUrls(tokenId)
			.then((fetched) => {
				loadingPreview = false;
				if (fetched?.pngHeadshotUrl) {
					previewUrl = fetched.pngHeadshotUrl;
				} else if (fetched?.pngFullUrl) {
					previewUrl = fetched.pngFullUrl;
				} else {
					previewError = true;
				}
			})
			.catch(() => {
				loadingPreview = false;
				previewError = true;
			});
	});
</script>

<div class="card p-2 sm:p-3 flex flex-col" bind:this={cardEl}>
	<div class="rounded-lg overflow-hidden flex items-center justify-center bg-surface-200 dark:bg-surface-800" style="height: 80px;">
		{#if loadingPreview}
			<Loader2 class="w-8 h-8 animate-spin text-primary-500" />
		{:else if previewError}
			<span class="text-surface-500 text-xs">No preview</span>
		{:else if previewUrl}
			<img src={previewUrl} alt="" class="max-h-full w-auto object-contain" loading="lazy" />
		{/if}
	</div>
	<p class="font-semibold text-xs text-surface-900 dark:text-surface-100 truncate mt-1">
		{gotchi.name || `#${gotchi.tokenId}`}
	</p>
	{#if gotchi.modifiedRarityScore != null || gotchi.baseRarityScore != null}
		<p class="text-[10px] sm:text-xs text-surface-500 dark:text-surface-400 mt-0.5" title="Modified Rarity Score (BRS + wearables)">
			BRS {(gotchi.modifiedRarityScore ?? gotchi.baseRarityScore) ?? 0}
		</p>
	{/if}
	<button
		type="button"
		class="btn btn-primary btn-sm mt-1.5 w-full flex items-center justify-center gap-1.5"
		onclick={onPlay}
	>
		<Gamepad2 class="w-3.5 h-3.5" />
		Play
	</button>
</div>
