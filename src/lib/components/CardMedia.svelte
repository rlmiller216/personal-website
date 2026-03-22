<!-- Shared card media — renders <video> or <img> with poster + reduced-motion support.
     Used by: ProjectCard, ToolCard, ToolListItem, ResourceCard, +page.svelte feature card. -->
<script lang="ts">
	import { browser } from '$app/environment';

	let {
		src,
		poster = '',
		alt = '',
		isVideo = false,
		class: className = ''
	}: {
		src: string;
		poster?: string;
		alt?: string;
		isVideo?: boolean;
		class?: string;
	} = $props();

	let videoEl: HTMLVideoElement | undefined = $state();

	// Pause video for users who prefer reduced motion (matches LetterSidebar pattern)
	$effect(() => {
		if (!browser || !videoEl) return;
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => (mq.matches ? videoEl?.pause() : videoEl?.play());
		update();
		mq.addEventListener('change', update);
		return () => mq.removeEventListener('change', update);
	});
</script>

{#if isVideo}
	<video
		bind:this={videoEl}
		{src}
		poster={poster || undefined}
		class={className}
		autoplay
		loop
		muted
		playsinline
	></video>
{:else}
	<img {src} {alt} class={className} loading="lazy" />
{/if}
