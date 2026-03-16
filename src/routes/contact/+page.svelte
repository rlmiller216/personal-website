<script lang="ts">
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

<section class="max-w-xl mx-auto px-6 py-16">
	<h1 class="text-3xl font-bold mb-4">Get in Touch</h1>
	<p class="text-muted-foreground mb-8">
		I'd love to hear from you — whether it's about a potential collaboration,
		a question about my work, or just to say hello.
	</p>

	{#if formState === 'success'}
		<div class="rounded-lg border border-border p-6 text-center">
			<p class="font-semibold mb-1">Thanks! I'll get back to you soon.</p>
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
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium mb-1.5">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<div>
				<label for="message" class="block text-sm font-medium mb-1.5">Message</label>
				<textarea
					id="message"
					name="message"
					rows="5"
					required
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
				></textarea>
			</div>

			<button
				type="submit"
				disabled={formState === 'sending'}
				class="rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
			>
				{formState === 'sending' ? 'Sending...' : 'Send Message'}
			</button>

			{#if formState === 'error'}
				<p class="text-sm text-destructive">
					Something went wrong. Try emailing me directly.
				</p>
			{/if}
		</form>
	{/if}
</section>
