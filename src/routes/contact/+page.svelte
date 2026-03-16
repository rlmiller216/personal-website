<script lang="ts">
	import { Send } from '@lucide/svelte';

	let { data } = $props();
	let formState = $state<'idle' | 'sending' | 'success' | 'error'>('idle');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		formState = 'sending';

		try {
			const response = await fetch(form.action, {
				method: 'POST',
				body: new FormData(form),
				headers: { Accept: 'application/json' }
			});

			if (response.ok) {
				formState = 'success';
				form.reset();
			} else {
				formState = 'error';
			}
		} catch {
			formState = 'error';
		}
	}
</script>

<svelte:head>
	<title>Contact — {data.siteName}</title>
</svelte:head>

<!-- Page header — Space Indigo -->
<div class="bg-hero">
	<div class="max-w-xl mx-auto px-6 py-12">
		<h1 class="text-4xl font-bold text-hero-foreground">Get in Touch</h1>
		<p class="text-hero-foreground/70 mt-2">
			Whether it's about a potential collaboration, a question about my work, or just to say hello.
		</p>
	</div>
</div>

<section class="max-w-xl mx-auto px-6 py-12">
	{#if formState === 'success'}
		<div class="rounded-lg border-2 border-secondary p-8 text-center animate-fade-in">
			<p class="text-xl font-bold mb-1">Thanks! I'll get back to you soon.</p>
			<p class="text-sm text-muted-foreground">Usually within a day or two.</p>
		</div>
	{:else}
		<form
			action="https://formspree.io/f/xbdzaneq"
			method="POST"
			onsubmit={handleSubmit}
			class="space-y-6"
		>
			<div>
				<label for="name" class="block text-sm font-medium mb-1.5">Name</label>
				<input
					type="text"
					id="name"
					name="name"
					required
					class="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm
						focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium mb-1.5">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					class="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm
						focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
				/>
			</div>

			<div>
				<label for="message" class="block text-sm font-medium mb-1.5">Message</label>
				<textarea
					id="message"
					name="message"
					rows="5"
					required
					class="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm
						focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-y"
				></textarea>
			</div>

			<button
				type="submit"
				disabled={formState === 'sending'}
				class="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium
					hover:bg-primary/90 transition-colors disabled:opacity-50"
			>
				{#if formState === 'sending'}
					Sending...
				{:else}
					Send Message
					<Send class="w-4 h-4" />
				{/if}
			</button>

			{#if formState === 'error'}
				<p class="text-sm text-destructive">
					Something went wrong. Try emailing me directly.
				</p>
			{/if}
		</form>
	{/if}
</section>
