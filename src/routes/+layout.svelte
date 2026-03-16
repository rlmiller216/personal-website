<script lang="ts">
	import '../app.css';

	let { children, data } = $props();

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/about', label: 'About' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/open-source', label: 'Open Source' },
		{ href: '/resources', label: 'Resources' },
		{ href: '/interests', label: 'Interests' },
		{ href: '/contact', label: 'Contact' }
	];

	let mobileMenuOpen = $state(false);
</script>

<svelte:head>
	<title>{data.siteName}</title>
	<meta name="description" content={data.siteTagline} />
</svelte:head>

<div class="min-h-screen flex flex-col">
	<!-- Nav -->
	<header class="border-b border-border">
		<nav class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
			<a href="/" class="font-semibold text-lg">{data.siteName}</a>

			<!-- Desktop nav -->
			<div class="hidden md:flex items-center gap-6 text-sm">
				{#each navLinks as link}
					<a href={link.href} class="text-muted-foreground hover:text-foreground transition-colors">
						{link.label}
					</a>
				{/each}
			</div>

			<!-- Mobile hamburger -->
			<button
				class="md:hidden p-2 text-muted-foreground hover:text-foreground"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Toggle menu"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if mobileMenuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					{/if}
				</svg>
			</button>
		</nav>

		<!-- Mobile menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden border-t border-border px-6 py-4 flex flex-col gap-3">
				{#each navLinks as link}
					<a
						href={link.href}
						class="text-sm text-muted-foreground hover:text-foreground transition-colors"
						onclick={() => (mobileMenuOpen = false)}
					>
						{link.label}
					</a>
				{/each}
			</div>
		{/if}
	</header>

	<!-- Main content -->
	<main class="flex-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-border mt-16">
		<div class="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
			<span>&copy; {new Date().getFullYear()} {data.siteName}</span>
			<div class="flex items-center gap-4">
				<a href="https://github.com/rlmiller216" class="hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">GitHub</a>
				<a href="https://linkedin.com/in/rlmiller216" class="hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">LinkedIn</a>
				<span class="opacity-30">&middot;</span>
				<a href="/contact" class="hover:text-foreground transition-colors">Get in touch</a>
			</div>
		</div>
	</footer>
</div>
