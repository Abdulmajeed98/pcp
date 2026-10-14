import {
  accessDenied,
  bearerHeader,
  expectErrorResponse,
  notValid,
  unauthorized,
} from '@pcp/core/test-utils';
import sharp from 'sharp';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../../test-utils/database/test-database';

type PartWithPhoto = { id: string; photoPath: string | null };

// A made-up photo as a phone's camera gives one: large, as JPEG, and with the
// place it was taken and the camera that took it.
function aPhotoFromAPhone(): Promise<Buffer> {
  return sharp({
    create: { width: 4000, height: 3000, channels: 3, background: '#4a6a8a' },
  })
    .jpeg()
    .withExif({
      IFD0: { Make: 'Made-up Phones', Model: 'Made-up Phone 1' },
      IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '36/1 11/1 0/1' },
    })
    .toBuffer();
}

function aSmallPng(): Promise<Buffer> {
  return sharp({ create: { width: 400, height: 300, channels: 3, background: '#aa3333' } })
    .png()
    .toBuffer();
}

const partNotFound = {
  code: 'PART_NOT_FOUND',
  title: 'part_not_found_title',
  detail: 'part_not_found_details',
};

describe("a Part's photo", () => {
  let testApp: TestAppWithLogins;
  let adminToken: string;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
    adminToken = await testApp.tokenOf({ roles: ['admin'] });
  });

  afterAll(async () => {
    await testApp.close();
  });

  afterEach(async () => {
    await emptyTheDatabase();
  });

  async function aPart(): Promise<PartWithPhoto> {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(adminToken), 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'case',
        name: 'Made-up Mesh Tower',
        manufacturer: 'Made-up Cases',
      }),
    });
    return (await response.json()) as PartWithPhoto;
  }

  function addPhoto(
    partId: string,
    bytes: Buffer,
    file: { name: string; type: string } = { name: 'photo.jpg', type: 'image/jpeg' },
    // `null` sends no token at all.
    token: string | null = adminToken,
  ): Promise<Response> {
    const form = new FormData();
    form.append('photo', new Blob([new Uint8Array(bytes)], { type: file.type }), file.name);
    return fetch(`${testApp.baseUrl}/v1/parts/${partId}/photo`, {
      method: 'PUT',
      headers: token === null ? {} : bearerHeader(token),
      body: form,
    });
  }

  async function served(photoPath: string): Promise<Response> {
    return fetch(`${testApp.baseUrl}${photoPath}`);
  }

  it('is stored small, as WebP, with no metadata at all', async () => {
    const part = await aPart();

    const added = await addPhoto(part.id, await aPhotoFromAPhone());

    expect(added.status).toBe(200);
    const { photoPath } = (await added.json()) as PartWithPhoto;
    expect(photoPath).toMatch(/^\/v1\/photos\/[0-9a-f-]{36}$/);
    const photo = await served(photoPath as string);
    expect(photo.status).toBe(200);
    expect(photo.headers.get('content-type')).toBe('image/webp');
    const metadata = await sharp(Buffer.from(await photo.arrayBuffer())).metadata();
    expect({
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      exif: metadata.exif,
      xmp: metadata.xmp,
      iptc: metadata.iptc,
    }).toEqual({
      format: 'webp',
      width: 1200,
      height: 900,
      exif: undefined,
      xmp: undefined,
      iptc: undefined,
    });
  });

  it('is not enlarged when it is small', async () => {
    const part = await aPart();

    const { photoPath } = (await (
      await addPhoto(part.id, await aSmallPng())
    ).json()) as PartWithPhoto;

    const metadata = await sharp(
      Buffer.from(await (await served(photoPath as string)).arrayBuffer()),
    ).metadata();
    expect([metadata.width, metadata.height]).toEqual([400, 300]);
  });

  it('is judged by its content and not by its name', async () => {
    const part = await aPart();

    const pngNamedAsText = await addPhoto(part.id, await aSmallPng(), {
      name: 'notes.txt',
      type: 'text/plain',
    });
    const textNamedAsJpeg = await addPhoto(part.id, Buffer.from('not a picture at all'), {
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    expect(pngNamedAsText.status).toBe(200);
    await expectErrorResponse(textNamedAsJpeg, 400, [
      notValid('photo', { reason: 'notAPhoto' }),
    ]);
  });

  it('is refused when it is larger than 10 MB', async () => {
    const part = await aPart();

    const response = await addPhoto(part.id, Buffer.alloc(10 * 1024 * 1024 + 1, 1));

    await expectErrorResponse(response, 400, [notValid('photo', { reason: 'tooLarge' })]);
  });

  it('is refused in the same way when it is far larger, before it is all received', async () => {
    const part = await aPart();

    const response = await addPhoto(part.id, Buffer.alloc(13 * 1024 * 1024, 1));

    await expectErrorResponse(response, 400, [notValid('photo', { reason: 'tooLarge' })]);
  });

  it('is refused when it has more pixels than the largest', async () => {
    const part = await aPart();
    // Small as a file, but over 100 million pixels once decoded.
    const huge = await sharp({
      create: { width: 12000, height: 9000, channels: 3, background: '#000000' },
    })
      .png({ compressionLevel: 9 })
      .toBuffer();

    const response = await addPhoto(part.id, huge, { name: 'huge.png', type: 'image/png' });

    await expectErrorResponse(response, 400, [
      notValid('photo', { reason: 'tooManyPixels' }),
    ]);
  });

  it('is refused, naming the field, when it is sent under another name', async () => {
    const part = await aPart();
    const form = new FormData();
    form.append(
      'picture',
      new Blob([new Uint8Array(await aSmallPng())], { type: 'image/png' }),
      'a.png',
    );

    const response = await fetch(`${testApp.baseUrl}/v1/parts/${part.id}/photo`, {
      method: 'PUT',
      headers: bearerHeader(adminToken),
      body: form,
    });

    await expectErrorResponse(response, 400, [notValid('photo', { reason: 'missing' })]);
  });

  it('takes two replacements sent at once one after the other, and keeps one photo', async () => {
    const part = await aPart();

    const [first, second] = await Promise.all([
      addPhoto(part.id, await aSmallPng()),
      addPhoto(part.id, await aPhotoFromAPhone()),
    ]);

    expect([first.status, second.status]).toEqual([200, 200]);
    const read = await fetch(`${testApp.baseUrl}/v1/parts/${part.id}`, {
      headers: bearerHeader(adminToken),
    });
    const { photoPath } = (await read.json()) as PartWithPhoto;
    expect((await served(photoPath as string)).status).toBe(200);
  });

  it('is refused when none is sent', async () => {
    const part = await aPart();
    const response = await fetch(`${testApp.baseUrl}/v1/parts/${part.id}/photo`, {
      method: 'PUT',
      headers: bearerHeader(adminToken),
      body: new FormData(),
    });

    await expectErrorResponse(response, 400, [notValid('photo', { reason: 'missing' })]);
  });

  it('replaces the one a Part had, at a new address, and the old address answers 404', async () => {
    const part = await aPart();
    const first = (
      (await (await addPhoto(part.id, await aSmallPng())).json()) as PartWithPhoto
    ).photoPath as string;

    const second = (
      (await (await addPhoto(part.id, await aPhotoFromAPhone())).json()) as PartWithPhoto
    ).photoPath as string;

    expect(second).not.toBe(first);
    expect((await served(second)).status).toBe(200);
    await expectErrorResponse(await served(first), 404, [
      {
        code: 'PHOTO_NOT_FOUND',
        title: 'photo_not_found_title',
        detail: 'photo_not_found_details',
      },
    ]);
  });

  it('is served to anyone, and may be cached for a year', async () => {
    const part = await aPart();
    const { photoPath } = (await (
      await addPhoto(part.id, await aSmallPng())
    ).json()) as PartWithPhoto;

    const photo = await served(photoPath as string);

    expect(photo.status).toBe(200);
    expect(photo.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(photo.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it("is named in the Part's answer and in each search result", async () => {
    const part = await aPart();
    expect(part.photoPath).toBeNull();
    const { photoPath } = (await (
      await addPhoto(part.id, await aSmallPng())
    ).json()) as PartWithPhoto;

    const read = await fetch(`${testApp.baseUrl}/v1/parts/${part.id}`, {
      headers: bearerHeader(adminToken),
    });
    const found = await fetch(`${testApp.baseUrl}/v1/parts?search=mesh`, {
      headers: bearerHeader(adminToken),
    });

    expect(((await read.json()) as PartWithPhoto).photoPath).toBe(photoPath);
    expect(
      ((await found.json()) as { content: PartWithPhoto[] }).content[0].photoPath,
    ).toBe(photoPath);
  });

  it('is added only to a Part that exists', async () => {
    const response = await addPhoto(
      '6f1d2c3b-4a5e-4f60-8b7a-9c0d1e2f3a4b',
      await aSmallPng(),
    );

    await expectErrorResponse(response, 404, [partNotFound]);
  });

  it('is refused from a Vendor, and from a call without a token', async () => {
    const part = await aPart();
    const vendorToken = await testApp.tokenOf({ roles: ['vendor'] });

    await expectErrorResponse(
      await addPhoto(part.id, await aSmallPng(), undefined, vendorToken),
      403,
      accessDenied,
    );
    await expectErrorResponse(
      await addPhoto(part.id, await aSmallPng(), undefined, null),
      401,
      unauthorized,
    );
  });
});
