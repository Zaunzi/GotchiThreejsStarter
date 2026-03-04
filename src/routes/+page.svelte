<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { account, network } from '$lib/stores/walletStore';
	import { getAavegotchiFromContract, getTokenIdsOfOwner } from '$lib/utils/contracts';
	import type { Aavegotchi } from '$lib/utils/graphql';
	import { selectedGotchiStore } from '$lib/stores/selectedGotchiStore';
	import type { RenderUrls } from '$lib/stores/selectedGotchiStore';
	import WalletStatus from '$lib/components/WalletStatus.svelte';
	import GotchiCard from '$lib/components/GotchiCard.svelte';
	import { BASE_MAINNET_ID } from '$lib/config/chains';
	import { createConcurrencyLimit } from '$lib/utils/fetchQueue';
	import { Loader2, Ghost, ArrowUp, ArrowDown, SortAsc, SortDesc } from '@lucide/svelte';

	type SortOption = 'name-asc' | 'name-desc' | 'rarity-desc' | 'rarity-asc';

	const PREVIEW_CONCURRENCY = 6;

	let loading = $state(false);
	let error = $state<string | null>(null);
	let myGotchis = $state<Aavegotchi[]>([]);
	let sortBy = $state<SortOption>('rarity-desc');
	let mounted = $state(false);
	let renderCache = $state<Record<string, RenderUrls>>({});

	const previewQueue = createConcurrencyLimit(PREVIEW_CONCURRENCY);
	const isWalletConnected = $derived($account.address !== null);
	const address = $derived($account.address);
	const chainId = $derived($network.chainId);

	onMount(() => {
		mounted = true;
	});

	/** Fetch PNG-only preview for the grid (concurrency-limited). GLB is fetched on the play page when user spawns. */
	async function fetchAndCacheRenderUrls(tokenId: string): Promise<RenderUrls | null> {
		if (renderCache[tokenId]) return renderCache[tokenId];
		return previewQueue.run(async () => {
			if (renderCache[tokenId]) return renderCache[tokenId];
			try {
				const res = await fetch(`/api/render/${tokenId}?preview=true`);
				const data = await res.json();
				if (data.error || !res.ok) return null;
				const urls: RenderUrls = {
					pngHeadshotUrl: data.pngHeadshotUrl,
					pngFullUrl: data.pngFullUrl,
					glbUrl: undefined
				};
				renderCache = { ...renderCache, [tokenId]: urls };
				return urls;
			} catch {
				return null;
			}
		});
	}

	async function loadGotchis() {
		if (!address) {
			error = 'Connect your wallet to see your Aavegotchis';
			return;
		}
		if (chainId !== BASE_MAINNET_ID) {
			error = 'Switch to Base network to load your Aavegotchis';
			return;
		}

		loading = true;
		error = null;
		myGotchis = [];

		try {
			const tokenIds = await getTokenIdsOfOwner(address);
			if (tokenIds.length === 0) {
				error = 'No Aavegotchis in this wallet';
				return;
			}

			const results = await Promise.all(tokenIds.map((id) => getAavegotchiFromContract(id)));
			const summoned = results
				.filter((g): g is Aavegotchi => g !== null && Number(g.status) === 3)
				.sort((a, b) => Number(a.tokenId) - Number(b.tokenId));
			myGotchis = summoned;

			if (summoned.length === 0) {
				error = 'No summoned Aavegotchis in this wallet';
			}
		} catch (err) {
			console.error('Failed to load gotchis:', err);
			error = err instanceof Error ? err.message : 'Failed to load Aavegotchis';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (
			mounted &&
			address &&
			chainId === BASE_MAINNET_ID &&
			myGotchis.length === 0 &&
			!loading &&
			!error
		) {
			loadGotchis();
		}
	});

	function sortGotchis(gotchis: Aavegotchi[], order: SortOption): Aavegotchi[] {
		const list = [...gotchis];
		switch (order) {
			case 'name-asc':
				return list.sort((a, b) => (a.name || `#${a.tokenId}`).localeCompare(b.name || `#${b.tokenId}`));
			case 'name-desc':
				return list.sort((a, b) => (b.name || `#${b.tokenId}`).localeCompare(a.name || `#${a.tokenId}`));
			case 'rarity-desc':
				return list.sort(
					(a, b) =>
						(b.modifiedRarityScore ?? b.baseRarityScore ?? 0) - (a.modifiedRarityScore ?? a.baseRarityScore ?? 0)
				);
			case 'rarity-asc':
				return list.sort(
					(a, b) =>
						(a.modifiedRarityScore ?? a.baseRarityScore ?? 0) - (b.modifiedRarityScore ?? b.baseRarityScore ?? 0)
				);
			default:
				return list;
		}
	}

	const sortedGotchis = $derived(sortGotchis(myGotchis, sortBy));

	function playWith(gotchi: Aavegotchi) {
		const urls = renderCache[gotchi.tokenId] ?? null;
		selectedGotchiStore.set({
			tokenId: gotchi.tokenId,
			name: gotchi.name || undefined,
			gotchi,
			...(urls ? { renderUrls: urls } : {})
		});
		goto('/play');
	}
</script>

<svelte:head>
	<title>Gotchi Three.js – Aavegotchi Template</title>
	<meta name="description" content="Connect your wallet, choose an Aavegotchi, and play in a Three.js world." />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="text-center mb-8">
		<h1 class="font-aavegotchi text-3xl md:text-4xl font-bold text-surface-900 dark:text-surface-100 mb-2 lowercase">
			Gotchi Three.js
		</h1>
		<p class="text-surface-600 dark:text-surface-400 max-w-xl mx-auto">
			Connect your wallet, pick an Aavegotchi, and hit Play to spawn on the purple square.
		</p>
	</div>

	{#if !isWalletConnected}
		<div class="flex flex-col items-center justify-center py-12">
			<div class="card p-8 text-center max-w-md w-full">
				<Ghost class="w-16 h-16 mx-auto mb-4 text-primary-500 opacity-80" />
				<p class="text-lg text-surface-700 dark:text-surface-300 mb-6">
					Connect your wallet to see your Aavegotchis and play.
				</p>
				<div class="flex justify-center">
					<WalletStatus />
				</div>
			</div>
		</div>
	{:else if chainId !== BASE_MAINNET_ID}
		<div class="flex flex-col items-center justify-center py-4">
			<div class="card p-8 text-center border-warning max-w-md w-full">
				<p class="text-lg text-surface-700 dark:text-surface-300 mb-6">
					Please switch to Base network to load your Aavegotchis.
				</p>
				<div class="flex justify-center">
					<WalletStatus />
				</div>
			</div>
		</div>
	{:else}
		{#if error}
			<div class="alert alert-error mb-6">
				<span>{error}</span>
				<button type="button" class="btn btn-sm" onclick={() => loadGotchis()}>Retry</button>
			</div>
		{/if}

		{#if loading && myGotchis.length === 0}
			<div class="card p-12 text-center">
				<Loader2 class="w-10 h-10 animate-spin mx-auto mb-4 text-primary-500" />
				<p class="text-surface-600 dark:text-surface-400">Loading your Aavegotchis...</p>
			</div>
		{:else if myGotchis.length > 0}
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
				<h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
					Choose an Aavegotchi
				</h2>
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-sm text-surface-600 dark:text-surface-400">Sort by</span>
					<div class="flex flex-wrap gap-1">
						<button
							type="button"
							class="btn btn-sm {sortBy === 'name-asc' ? 'btn-primary' : 'btn-outline'}"
							onclick={() => (sortBy = 'name-asc')}
							title="Name A–Z"
						>
							<SortAsc class="w-3.5 h-3.5" />
							Name
						</button>
						<button
							type="button"
							class="btn btn-sm {sortBy === 'name-desc' ? 'btn-primary' : 'btn-outline'}"
							onclick={() => (sortBy = 'name-desc')}
							title="Name Z–A"
						>
							<SortDesc class="w-3.5 h-3.5" />
							Name
						</button>
						<button
							type="button"
							class="btn btn-sm {sortBy === 'rarity-desc' ? 'btn-primary' : 'btn-outline'}"
							onclick={() => (sortBy = 'rarity-desc')}
							title="Rarity: highest first"
						>
							<ArrowDown class="w-3.5 h-3.5" />
							Rarity ↓
						</button>
						<button
							type="button"
							class="btn btn-sm {sortBy === 'rarity-asc' ? 'btn-primary' : 'btn-outline'}"
							onclick={() => (sortBy = 'rarity-asc')}
							title="Rarity: lowest first"
						>
							<ArrowUp class="w-3.5 h-3.5" />
							Rarity ↑
						</button>
					</div>
					<button type="button" class="btn btn-outline btn-sm" onclick={() => loadGotchis()} disabled={loading}>
						{#if loading}
							<Loader2 class="w-4 h-4 animate-spin" />
						{/if}
						Reload
					</button>
				</div>
			</div>
			<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
				{#each sortedGotchis as gotchi (gotchi.tokenId)}
					<GotchiCard
						gotchi={gotchi}
						renderUrls={renderCache[gotchi.tokenId]}
						fetchRenderUrls={fetchAndCacheRenderUrls}
						onPlay={() => playWith(gotchi)}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>
