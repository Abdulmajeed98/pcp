import { expect, type Locator, type Page } from '@playwright/test';

import { closeTheMenu, openTheMenuOnAPhone } from './menu-sheet';

// The Vendor portal's Part Requests, its section, its list and its form,
// found by test ids and by where links lead, whatever language they are in.

// The portal's Part Requests section: in the frame's sidebar from 64rem, and
// in the menu sheet on a phone.
export function thePartRequestsSection(page: Page): Locator {
  return page.getByTestId('portal-sections').locator('a[href$="/part-requests"]');
}

// Goes to the Part Requests section, as a Vendor does: on a phone it opens
// the menu sheet, which choosing a section closes.
export async function goToThePartRequests(page: Page): Promise<void> {
  await openTheMenuOnAPhone(page);
  await thePartRequestsSection(page).click();
}

// The section is marked as the one the Vendor is in, read in the menu sheet
// on a phone.
export async function expectThePartRequestsSectionCurrent(page: Page): Promise<void> {
  const opened = await openTheMenuOnAPhone(page);
  await expect(thePartRequestsSection(page)).toHaveAttribute('aria-current', 'page');
  if (opened) await closeTheMenu(page);
}

// The Vendor's Part Requests, the section's screen.
export function theVendorsPartRequests(page: Page): Locator {
  return page.getByTestId('vendors-part-requests');
}

// The Part Requests listed on it, one row each.
export function listedPartRequests(page: Page): Locator {
  return page.getByTestId('part-request');
}

// The row of the Part Request with this part number.
export function rowOfPartRequest(page: Page, partNumber: string): Locator {
  return listedPartRequests(page).filter({
    has: page.getByTestId('part-number').getByText(partNumber, { exact: true }),
  });
}

// What the list says to a Vendor that has sent no Part Request.
export function noPartRequests(page: Page): Locator {
  return page.getByTestId('no-part-requests');
}

// The note, on the list, that a Part Request was sent.
export function theSentNote(page: Page): Locator {
  return page.getByTestId('part-request-sent');
}

// The Part Request form.
export function thePartRequestForm(page: Page): Locator {
  return page.getByTestId('part-request-form');
}

// One of the form's fields, found by the detail the API names it by.
export function partRequestField(
  page: Page,
  detail: 'category' | 'name' | 'partNumber' | 'usdPrice' | 'iqdPrice' | 'warrantyMonths',
): Locator {
  return page.locator(`#part-request-form-${detail}`);
}

// What the form says below a field when the API refused it.
export function refusalOf(
  page: Page,
  detail: 'category' | 'name' | 'partNumber' | 'usdPrice' | 'iqdPrice' | 'warrantyMonths',
): Locator {
  return page.locator(`#part-request-form-${detail}-error`);
}

// The form's button that sends the request, whatever language it is named in.
export function sendThePartRequest(page: Page): Locator {
  return thePartRequestForm(page).locator('button[type="submit"]');
}

// The state a listed request is in, as the API names it, with what goes with
// it, read from its mark.
export function stateOf(row: Locator): Locator {
  return row.getByTestId('state');
}

// The empty catalog search's action that opens the Part Request form.
export function askForItToBeAdded(page: Page): Locator {
  return page.getByTestId('ask-for-it');
}
