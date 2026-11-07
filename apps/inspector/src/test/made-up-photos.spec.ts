import { describe, expect, it } from '@jest/globals';
import sharp from 'sharp';

import { madeUpPhotos } from '../made-up-photos.ts';

describe("the made-up shop's photos", () => {
  it('are one WebP picture for each of the eight Categories, each of its own shape', async () => {
    const photos = await madeUpPhotos();
    const shapes = await Promise.all(
      [...photos.entries()].map(async ([category, bytes]) => {
        const { format, width, height } = await sharp(bytes).metadata();
        return { category, format, ratio: Number((width / height).toFixed(2)) };
      }),
    );

    expect(shapes.map((shape) => shape.category).sort()).toEqual(
      ['case', 'cpu', 'cpuCooler', 'gpu', 'motherboard', 'psu', 'ram', 'storage'].sort(),
    );
    expect(shapes.every((shape) => shape.format === 'webp')).toBe(true);
    expect(shapes.find((shape) => shape.category === 'gpu')?.ratio).toBeGreaterThan(1.5);
    expect(shapes.find((shape) => shape.category === 'case')?.ratio).toBeLessThan(0.8);
  });
});
