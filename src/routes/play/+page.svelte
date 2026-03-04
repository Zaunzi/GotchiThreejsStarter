<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { selectedGotchiStore } from '$lib/stores/selectedGotchiStore';

	type PlayScene = { dispose: () => void };

	let scene: PlayScene | null = null;

	onMount(async () => {
		const selected = get(selectedGotchiStore);
		if (!selected?.tokenId) {
			goto('/');
			return;
		}

		const container = document.getElementById('three-game-container') as HTMLDivElement;
		if (!container) return;

		let glbUrl: string | null = selected.renderUrls?.glbUrl ?? null;
		if (!glbUrl) {
			try {
				const res = await fetch(`/api/render/${selected.tokenId}`);
				const data = await res.json();
				glbUrl = data.glbUrl ?? null;
			} catch {
				// continue with null, scene will show error
			}
		}

		const { createPlayScene } = await import('$lib/three/playScene');
		scene = createPlayScene({
			container,
			glbUrl,
			onError: (msg) => console.error('Play scene:', msg)
		});
	});

	onDestroy(() => {
		if (scene) {
			scene.dispose();
			scene = null;
		}
	});
</script>

<svelte:head>
	<title>Play – Gotchi Three.js</title>
</svelte:head>

<div class="play-root">
	<div id="three-game-container" class="game-container"></div>
	<p class="hint-overlay" aria-hidden="true">
		<kbd>W A S D</kbd> move · Mouse look · Hold <kbd>Right-click</kbd> freelook · Click to lock pointer
	</p>
</div>

<style>
	.play-root {
		height: calc(100vh - 4rem);
		height: calc(100dvh - 4rem);
		min-height: 0;
		overflow: hidden;
		position: relative;
		display: flex;
		flex-direction: column;
	}
	.game-container {
		flex: 1;
		min-height: 0;
		width: 100%;
		position: relative;
		overflow: hidden;
	}
	.hint-overlay {
		position: absolute;
		top: 8px;
		right: 8px;
		margin: 0;
		padding: 6px 10px;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.8);
		background: rgba(0, 0, 0, 0.35);
		border-radius: 8px;
		pointer-events: none;
		z-index: 5;
	}
	.hint-overlay kbd {
		padding: 2px 6px;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.2);
		font-family: inherit;
		font-size: 0.7rem;
	}
</style>
