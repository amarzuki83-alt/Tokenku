import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Crisp, professional SVG brand logo for "tokenku"
// Represents electrical energy token, lightning bolt, receipt/digital financial voucher in light blue & navy
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#075985"/>
    </linearGradient>
    <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0f9ff"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0c4a6e" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>

  <!-- Subtle glow rings -->
  <circle cx="256" cy="240" r="190" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.3"/>
  <circle cx="256" cy="240" r="160" fill="none" stroke="#7dd3fc" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.4"/>

  <!-- Receipt / Voucher shape in center -->
  <g filter="url(#shadow)">
    <path d="M 140 120 
             L 372 120 
             Q 384 120 384 132 
             L 384 360 
             L 364 348 L 344 360 L 324 348 L 304 360 L 284 348 L 264 360 L 244 348 L 224 360 L 204 348 L 184 360 L 164 348 L 144 360 L 128 350
             L 128 132 
             Q 128 120 140 120 Z" 
          fill="url(#cardGrad)" />

    <!-- Receipt Header Line -->
    <rect x="160" y="152" width="100" height="12" rx="6" fill="#0284c7"/>
    <rect x="312" y="152" width="40" height="12" rx="6" fill="#94a3b8"/>
    <line x1="156" y1="184" x2="356" y2="184" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6 4"/>
    
    <!-- Token digits simulation line -->
    <rect x="156" y="200" width="200" height="16" rx="4" fill="#e0f2fe"/>
    <rect x="164" y="228" width="80" height="8" rx="4" fill="#cbd5e1"/>
    <rect x="260" y="228" width="96" height="8" rx="4" fill="#0284c7" opacity="0.8"/>
  </g>

  <!-- Big Glowing Lightning Bolt (PLN Electric Token Symbol) -->
  <g filter="url(#shadow)">
    <path d="M 276 170 
             L 190 290 
             L 248 290 
             L 224 380 
             L 322 254 
             L 264 254 
             Z" 
          fill="url(#boltGrad)" 
          stroke="#ca8a04" 
          stroke-width="3" 
          stroke-linejoin="round"/>
  </g>

  <!-- Subtitle Badge at bottom -->
  <rect x="168" y="416" width="176" height="38" rx="19" fill="#0ea5e9"/>
  <text x="256" y="441" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="3">TOKENKU</text>
</svg>`;

// Maskable icon with 15% safe padding
const maskableSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#075985"/>
    </linearGradient>
    <linearGradient id="boltGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
  </defs>

  <!-- Full bleed background for safe area maskable cropping -->
  <rect width="512" height="512" fill="url(#bgGradM)"/>

  <!-- Scaled down content inside 80% circle safe zone (diameter ~400px centered at 256,256) -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <!-- Receipt -->
    <path d="M 140 120 L 372 120 Q 384 120 384 132 L 384 360 L 364 348 L 344 360 L 324 348 L 304 360 L 284 348 L 264 360 L 244 348 L 224 360 L 204 348 L 184 360 L 164 348 L 144 360 L 128 350 L 128 132 Q 128 120 140 120 Z" fill="#ffffff" />
    <rect x="160" y="152" width="100" height="12" rx="6" fill="#0284c7"/>
    <rect x="312" y="152" width="40" height="12" rx="6" fill="#94a3b8"/>
    <line x1="156" y1="184" x2="356" y2="184" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6 4"/>
    <rect x="156" y="200" width="200" height="16" rx="4" fill="#e0f2fe"/>
    <rect x="164" y="228" width="80" height="8" rx="4" fill="#cbd5e1"/>
    <rect x="260" y="228" width="96" height="8" rx="4" fill="#0284c7" opacity="0.8"/>

    <!-- Lightning Bolt -->
    <path d="M 276 170 L 190 290 L 248 290 L 224 380 L 322 254 L 264 254 Z" fill="url(#boltGradM)" stroke="#ca8a04" stroke-width="3" stroke-linejoin="round"/>
    
    <rect x="168" y="416" width="176" height="38" rx="19" fill="#0ea5e9"/>
    <text x="256" y="441" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="3">TOKENKU</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), maskableSvgContent, 'utf-8');

async function generatePngs() {
  const svgBuffer = Buffer.from(svgContent);
  const maskableBuffer = Buffer.from(maskableSvgContent);

  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(48, 48).png().toFile(path.join(publicDir, 'favicon.png'));
  console.log('Successfully generated all PWA icons!');
}

generatePngs().catch(console.error);
