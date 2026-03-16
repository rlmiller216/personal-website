<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Page not found</title>
</svelte:head>

<section class="max-w-xl mx-auto px-6 py-24 text-center">
	<h1 class="text-6xl font-bold mb-4">{page.status}</h1>
	<p class="text-lg text-muted-foreground mb-8">{page.error?.message || 'Something went wrong'}</p>
	<a href="/" class="text-sm hover:underline">&larr; Back to home</a>
</section>
