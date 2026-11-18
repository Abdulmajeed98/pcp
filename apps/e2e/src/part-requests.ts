import { type APIRequestContext, expect } from '@playwright/test';

import { aWordUniqueToTheRun } from './made-up';
import { apiUrl } from './platform';

// What a test gives a Part Request it sends over HTTP, as the API takes it:
// the Part's Category, name and part number, and the Offer the Vendor would
// make. A price left out is not quoted, and the Part is in stock unless the
// test says otherwise.
export interface PartRequestSent {
  category: string;
  name: string;
  partNumber: string;
  usdPrice?: string;
  iqdPrice?: number;
  inStock?: boolean;
  warrantyMonths?: number;
}

// A Part Request as the API answers it, as far as the tests read it.
export interface PartRequestAnswered {
  id: string;
  category: string;
  name: string;
  partNumber: string;
  usdPrice: string | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
  state: 'open' | 'fulfilled' | 'rejected';
  part?: { id: string; name: string };
  offerId?: string | null;
  reason?: string;
}

// A part number no Part and no other request has, unique to the run and
// plainly made up, as a Part the catalog lacks has.
export function aMadeUpPartNumber(): string {
  return `PR-${aWordUniqueToTheRun()}`;
}

// Sends a Part Request for a Vendor over HTTP, as the Admin acting for the
// Vendor or as the Vendor's own Login, and gives back what the API answered.
export async function sendAPartRequest(
  request: APIRequestContext,
  authorization: string,
  vendorId: string,
  sent: PartRequestSent,
): Promise<PartRequestAnswered> {
  const answered = await request.post(`${apiUrl}/v1/vendors/${vendorId}/part-requests`, {
    headers: { authorization },
    data: { inStock: true, ...sent },
  });
  expect(answered.status()).toBe(201);
  return (await answered.json()) as PartRequestAnswered;
}

// The Vendor's Part Requests as the API answers them, newest first, one page
// of as many as the API gives at once.
export async function vendorsPartRequests(
  request: APIRequestContext,
  authorization: string,
  vendorId: string,
): Promise<PartRequestAnswered[]> {
  const answered = await request.get(
    `${apiUrl}/v1/vendors/${vendorId}/part-requests?size=100`,
    { headers: { authorization } },
  );
  expect(answered.status()).toBe(200);
  return ((await answered.json()) as { content: PartRequestAnswered[] }).content;
}

// Fulfils a Part Request with a Part over HTTP, as the Admin, and gives back
// what became of the Vendor's Offer for that Part.
export async function fulfilAPartRequest(
  request: APIRequestContext,
  authorization: string,
  partRequestId: string,
  partId: string,
): Promise<'created' | 'replaced' | 'kept'> {
  const answered = await request.post(
    `${apiUrl}/v1/part-requests/${partRequestId}/fulfil`,
    { headers: { authorization }, data: { partId } },
  );
  expect(answered.status()).toBe(200);
  return ((await answered.json()) as { offer: 'created' | 'replaced' | 'kept' }).offer;
}

// The most open Part Requests the API gives in one answer of the queue.
const requestsInAnAnswer = 100;

// The request's place on the Admin's queue, counted from 0, in the API's
// order, or none when the queue does not hold it. The queue is oldest first,
// so a request a test has just sent is among the last, whatever earlier
// runs left: the API is asked for its pages from the last back, and answers
// in one or two.
export async function placeOnTheQueue(
  request: APIRequestContext,
  authorization: string,
  partRequestId: string,
): Promise<number | undefined> {
  const pageOf = async (number: number) => {
    const answered = await request.get(`${apiUrl}/v1/part-requests`, {
      headers: { authorization },
      params: { page: number, size: requestsInAnAnswer },
    });
    expect(answered.status()).toBe(200);
    return (await answered.json()) as { content: { id: string }[]; totalPages: number };
  };

  const { totalPages } = await pageOf(0);
  for (let number = totalPages - 1; number >= 0; number--) {
    const place = (await pageOf(number)).content.findIndex(
      (each) => each.id === partRequestId,
    );
    if (place >= 0) return number * requestsInAnAnswer + place;
  }
  return undefined;
}

// Rejects a Part Request with a reason over HTTP, as the Admin.
export async function rejectAPartRequest(
  request: APIRequestContext,
  authorization: string,
  partRequestId: string,
  reason: string,
): Promise<void> {
  const answered = await request.post(
    `${apiUrl}/v1/part-requests/${partRequestId}/reject`,
    { headers: { authorization }, data: { reason } },
  );
  expect(answered.status()).toBe(200);
}
