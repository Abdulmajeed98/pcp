import sharp from 'sharp';

import type { Category, MadeUpPhotos } from './the-shoppers-shop.ts';

// The made-up shop's photos: one drawing for each Category, made here when
// the command starts, so that no picture is kept in the repository. No Part
// imported from OpenDB has a photo, since the Admin adds each one (CAT-6),
// and a photo of a real Part would be a picture of something it may not be.
// So each is a plain drawing of the kind of Part, on a light ground, in the
// size and shape a product photo of it would have, and says that it is made
// up. The API serves photos as WebP, and so does the stand-in.

// The drawing of each Category: its width and height, and what is drawn.
const drawings: Record<Category, { width: number; height: number; shapes: string }> = {
  cpu: {
    width: 900,
    height: 900,
    shapes: `
      <rect x="210" y="210" width="480" height="480" rx="28" fill="#2f6b3a"/>
      <rect x="290" y="290" width="320" height="320" rx="18" fill="#c9c6bd"/>
      <rect x="330" y="330" width="240" height="240" rx="10" fill="#b5b1a6"/>`,
  },
  cpuCooler: {
    width: 900,
    height: 1100,
    shapes: `
      ${Array.from({ length: 22 }, (_, fin) => `<rect x="250" y="${200 + fin * 30}" width="400" height="14" rx="4" fill="#9c9a94"/>`).join('')}
      <rect x="300" y="860" width="300" height="60" rx="10" fill="#3a3c40"/>
      <circle cx="450" cy="530" r="170" fill="#2b2d31"/><circle cx="450" cy="530" r="50" fill="#55585e"/>`,
  },
  motherboard: {
    width: 1000,
    height: 1100,
    shapes: `
      <rect x="170" y="150" width="660" height="800" rx="12" fill="#2a2f2c"/>
      <rect x="380" y="250" width="200" height="200" rx="8" fill="#8f8d86"/>
      <rect x="640" y="230" width="22" height="300" fill="#4b4f55"/><rect x="690" y="230" width="22" height="300" fill="#4b4f55"/>
      <rect x="240" y="600" width="520" height="34" rx="6" fill="#4b4f55"/><rect x="240" y="740" width="520" height="34" rx="6" fill="#4b4f55"/>`,
  },
  ram: {
    width: 1200,
    height: 500,
    shapes: `
      <rect x="120" y="150" width="960" height="180" rx="10" fill="#1f2124"/>
      ${Array.from({ length: 8 }, (_, chip) => `<rect x="${170 + chip * 110}" y="200" width="80" height="80" rx="4" fill="#45484e"/>`).join('')}
      <rect x="120" y="330" width="960" height="24" fill="#c8a24a"/>`,
  },
  storage: {
    width: 1200,
    height: 600,
    shapes: `
      <rect x="160" y="230" width="880" height="150" rx="10" fill="#1d3b2a"/>
      <rect x="260" y="260" width="160" height="90" rx="4" fill="#2b2d31"/><rect x="460" y="260" width="300" height="90" rx="4" fill="#2b2d31"/>
      <rect x="160" y="230" width="40" height="150" fill="#c8a24a"/>`,
  },
  gpu: {
    width: 1200,
    height: 700,
    shapes: `
      <rect x="100" y="170" width="1000" height="330" rx="26" fill="#2b2d31"/>
      <circle cx="320" cy="335" r="130" fill="#1b1c1f"/><circle cx="320" cy="335" r="36" fill="#55585e"/>
      <circle cx="680" cy="335" r="130" fill="#1b1c1f"/><circle cx="680" cy="335" r="36" fill="#55585e"/>
      <rect x="160" y="500" width="520" height="30" fill="#c8a24a"/>`,
  },
  case: {
    width: 900,
    height: 1200,
    shapes: `
      <rect x="230" y="130" width="440" height="900" rx="16" fill="#26282c"/>
      <rect x="270" y="180" width="360" height="800" rx="8" fill="#3c4048"/>
      <circle cx="450" cy="360" r="90" fill="#1b1c1f"/><circle cx="450" cy="600" r="90" fill="#1b1c1f"/>`,
  },
  psu: {
    width: 1100,
    height: 900,
    shapes: `
      <rect x="220" y="230" width="660" height="440" rx="18" fill="#2b2d31"/>
      ${[170, 130, 90, 50].map((r) => `<circle cx="550" cy="450" r="${r}" fill="none" stroke="#55585e" stroke-width="10"/>`).join('')}`,
  },
};

function svgOf({ width, height, shapes }: (typeof drawings)[Category]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#f2f0eb"/>
    <ellipse cx="${width / 2}" cy="${height - 90}" rx="${width * 0.36}" ry="24" fill="#dcd8cf"/>
    ${shapes}
    <text x="32" y="${height - 32}" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#8a867c">Made-up photo</text>
  </svg>`;
}

export async function madeUpPhotos(): Promise<MadeUpPhotos> {
  const photos = await Promise.all(
    (Object.keys(drawings) as Category[]).map(
      async (category): Promise<[Category, Buffer]> => [
        category,
        await sharp(Buffer.from(svgOf(drawings[category])))
          .webp()
          .toBuffer(),
      ],
    ),
  );
  return new Map(photos);
}
