<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Page not found</title>
</svelte:head>

<section class="max-w-xl mx-auto px-6 py-24 text-center">
	<p class="text-8xl font-bold text-primary mb-4" style="font-family: 'Bodoni Moda', serif;">
		{page.status}
	</p>
	<p class="text-lg text-muted-foreground mb-8">{page.error?.message || 'Something went wrong'}</p>
	<a
		href="/"
		class="inline-block rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium
			hover:bg-primary/90 transition-colors"
	>
		&larr; Back to home
	</a>
</section>
