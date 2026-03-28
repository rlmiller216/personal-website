<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { fly, fade } from 'svelte/transition';
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import LinkedinLogoIcon from 'phosphor-svelte/lib/LinkedinLogoIcon';
	import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LetterSidebar from '$lib/components/LetterSidebar.svelte';

	let { children, data } = $props();

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/open-source', label: 'Open Source' },
		{ href: '/resources', label: 'Toolkit' },
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' }
	];

	let mobileMenuOpen = $state(false);
	let sidebarMenuOpen = $state(false);

	// Mutual exclusion — prevent both menus open during resize
	$effect(() => {
		if (sidebarMenuOpen) mobileMenuOpen = false;
	});

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>{data.siteName}</title>
	<meta name="description" content={data.siteTagline} />
	<meta property="og:site_name" content={data.siteName} />
	<meta property="og:type" content="website" />
	<meta property="og:description" content={data.siteTagline} />
	<meta property="og:image" content="https://rlmiller.netlify.app/og-image.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="https://rlmiller.netlify.app/og-image.png" />
</svelte:head>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && sidebarMenuOpen) sidebarMenuOpen = false; }} />

<LetterSidebar bind:menuOpen={sidebarMenuOpen} />

<!-- Sidebar slide-out menu — wrapped for responsive gating (md+ only) -->
<div class="hidden md:block">
	{#if sidebarMenuOpen}
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
			role="presentation"
			transition:fade={{ duration: 200 }}
			onclick={() => sidebarMenuOpen = false}
		></div>

		<!-- Slide-out panel -->
		<nav
			class="fixed top-0 left-14 lg:left-20 z-40 h-screen w-80
				flex flex-col gap-3 px-10 pb-16 overflow-y-auto
				bg-white dark:bg-hero border-r border-border dark:border-white/10 shadow-xl"
			style="padding-top: 0.75rem;"
			transition:fly={{ x: -400, duration: 300 }}
		>
			{#each navLinks as link}
				<a
					href={link.href}
					class="relative py-3 px-4 text-2xl lg:text-3xl font-bold uppercase tracking-wide transition-colors rounded-lg
						hover:bg-accent dark:hover:bg-white/10
						{isActive(link.href) ? 'text-primary dark:text-secondary' : 'text-hero dark:text-hero-foreground'}"
					onclick={() => sidebarMenuOpen = false}
				>
					{link.label}
					{#if isActive(link.href)}
						<span class="absolute bottom-1 left-4 right-4 h-0.5 rounded-full bg-secondary"></span>
					{/if}
				</a>
			{/each}
			<!-- ThemeToggle — pushed to bottom of panel -->
			<div class="mt-auto pt-4 border-t border-border dark:border-white/10 flex items-center gap-2 px-4">
				<ThemeToggle class="text-muted-foreground hover:text-foreground dark:text-hero-foreground/60 dark:hover:text-hero-foreground" />
				<span class="text-sm text-muted-foreground dark:text-hero-foreground/60 uppercase tracking-wide">Theme</span>
			</div>
		</nav>
	{/if}
</div>

<div class="min-h-screen flex flex-col md:ml-14 lg:ml-20">
	<!-- Nav — scrolls away naturally on all screen sizes -->
	<header class="relative z-10 bg-transparent">
		<nav class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
			<a
				href="/"
				class="text-3xl font-extrabold tracking-tight uppercase md:invisible text-hero-foreground"
			>
				{data.siteName}
			</a>

			<!-- Desktop nav -->
			<div class="hidden md:flex items-center gap-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="relative px-3 py-2 text-sm font-medium transition-colors
							{isActive(link.href)
								? 'text-hero-foreground'
								: 'text-hero-foreground/70 hover:text-hero-foreground'}"
					>
						{link.label}
						<!-- Neon Chartreuse underline — active or on hover -->
						<span
							class="absolute bottom-0.5 left-3 right-3 h-0.5 bg-secondary rounded-full
								transition-transform duration-200 origin-center
								{isActive(link.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}"
						></span>
					</a>
				{/each}
				<ThemeToggle class="text-hero-foreground/70 hover:text-hero-foreground" />
			</div>

			<!-- Mobile: theme toggle + hamburger -->
			<div class="md:hidden flex items-center gap-1">
				<ThemeToggle class="text-hero-foreground/70 hover:text-hero-foreground" />
				<button
					class="p-2 transition-colors text-hero-foreground/70 hover:text-hero-foreground"
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
			</div>
		</nav>

		<!-- Mobile menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden bg-background border-t border-border px-6 py-4 flex flex-col gap-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="relative py-2 text-2xl font-bold uppercase tracking-wide transition-colors
							{isActive(link.href) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (mobileMenuOpen = false)}
					>
						{link.label}
						{#if isActive(link.href)}
							<span class="absolute bottom-1 left-0 right-0 h-0.5 rounded-full bg-secondary"></span>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	</header>

	<!-- Main content -->
	<main class="flex-1">
		{@render children()}
	</main>

	<!-- Footer — Deep Twilight background -->
	<footer class="bg-hero text-hero-foreground mt-16">
		<div class="max-w-6xl mx-auto px-6 py-12">
			<!-- Top row: branding -->
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
				<div>
					<p class="text-3xl font-bold tracking-tight opacity-80 font-display">
						Rebecca L Miller, PhD
					</p>
					<p class="text-sm opacity-70 mt-1">{data.siteTagline}</p>
				</div>
				<!-- Social links -->
				<div class="flex items-center gap-4">
					<a href="https://github.com/rlmiller216" class="opacity-70 hover:opacity-100 transition-opacity" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
						<GithubLogoIcon size={22} weight="fill" />
					</a>
					<a href="https://www.linkedin.com/in/rebeccalauriemiller/" class="opacity-70 hover:opacity-100 transition-opacity" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
						<LinkedinLogoIcon size={22} weight="fill" />
					</a>
					<a href="/contact" class="opacity-70 hover:opacity-100 transition-opacity" aria-label="Contact">
						<EnvelopeSimpleIcon size={22} weight="fill" />
					</a>
				</div>
			</div>

			<!-- Land acknowledgement -->
			<p id="land-ack" class="font-display text-base leading-relaxed max-w-3xl mb-8" style="color: rgba(195, 189, 184, 0.7);">
				Our digital presence operates on the land known as Turtle Island. We pay respect to the traditional guardians of this territory and commit to ongoing reconciliation and partnership.
			</p>

			<!-- Bottom row: nav + copyright -->
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-white/10">
				<div class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
					{#each navLinks as link}
						<a href={link.href} class="font-medium text-hero-foreground/70 hover:text-hero-foreground transition-colors">{link.label}</a>
					{/each}
				</div>
				<span class="text-sm opacity-40">&copy; {new Date().getFullYear()} {data.siteName}</span>
			</div>
		</div>
	</footer>
</div>
