<script lang="ts">
	import { Sun, Moon } from '@lucide/svelte';

	let { class: className = 'text-muted-foreground hover:text-foreground' }: { class?: string } = $props();

	let isDark = $state(false);

	$effect(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggle() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
	}
</script>

<button
	onclick={toggle}
	class="p-2 rounded-lg {className} hover:bg-accent transition-colors"
	aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
	{#if isDark}
		<Sun class="w-4 h-4" />
	{:else}
		<Moon class="w-4 h-4" />
	{/if}
</button>
