<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { FALLBACK_THEME } from '$lib/constants/themes';
	import { initWalletStore } from '$lib/stores/walletStore';

	// TODO: Consolidate theme initialization logic - this is duplicated in app.html, ThemeSwitcher.svelte, and LightSwitch.svelte
	// Initialize theme and mode on layout load
	if (browser) {
		const mode = localStorage.getItem('mode') || 'dark';
		document.documentElement.setAttribute('data-mode', mode);

		const theme = localStorage.getItem('theme') || FALLBACK_THEME;
		document.documentElement.setAttribute('data-theme', theme);
	}

	onMount(() => {
		if (browser) void initWalletStore();
	});

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/SKSFAVICON.svg" type="image/svg+xml" />
</svelte:head>

<div class="layout-root">
	<Navbar />
	<main class="layout-main bg-surface-50 dark:bg-surface-900">
		{@render children?.()}
	</main>
</div>

<style>
	.layout-root {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		min-height: 100dvh;
		overflow: hidden;
	}
	.layout-main {
		flex: 1;
		min-height: 0;
		overflow: auto;
	}
</style>
