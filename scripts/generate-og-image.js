// Generate social preview (Open Graph) image for the site.
// 1200×630px — Space Indigo background with brand typography.
// Run: node scripts/generate-og-image.js

import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;

// Design tokens
const SPACE_INDIGO = '#1D2440';
const NEON_CHARTREUSE = '#eeff5d';
const WHITE = '#F6F5F4';

// Build an SVG with embedded Google Fonts-style text
// (sharp renders SVG text with system fonts, so we use basic sans-serif/serif)
const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${NEON_CHARTREUSE}" />
      <stop offset="100%" stop-color="${NEON_CHARTREUSE}" stop-opacity="0.6" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${SPACE_INDIGO}" />

  <!-- Accent bar at bottom -->
  <rect y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="${NEON_CHARTREUSE}" />

  <!-- Decorative accent line -->
  <rect x="80" y="200" width="120" height="4" rx="2" fill="${NEON_CHARTREUSE}" />

  <!-- Name -->
  <text x="80" y="280" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="bold" fill="${WHITE}" letter-spacing="-1">
    Rebecca L Miller
  </text>

  <!-- PhD suffix -->
  <text x="80" y="340" font-family="Georgia, 'Times New Roman', serif" font-size="42" fill="${NEON_CHARTREUSE}" letter-spacing="1">
    PhD
  </text>

  <!-- Tagline -->
  <text x="80" y="420" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="${WHITE}" opacity="0.75" letter-spacing="3">
    SCIENCE FOR THE GREATER GOOD
  </text>

  <!-- URL -->
  <text x="80" y="560" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="${WHITE}" opacity="0.4" letter-spacing="1">
    rlmiller.netlify.app
  </text>

  <!-- Monogram -->
  <text x="${WIDTH - 180}" y="180" font-family="Georgia, 'Times New Roman', serif" font-size="140" font-weight="bold" fill="${WHITE}" opacity="0.06" letter-spacing="-4">
    RLM
  </text>
</svg>`;

await sharp(Buffer.from(svg))
	.png()
	.toFile('static/og-image.png');

console.log('[og-image] Generated static/og-image.png (1200×630)');
