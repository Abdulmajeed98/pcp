import { expect, type Locator, type Page } from '@playwright/test';

import { layoutOf } from './languages';
import { dashboardUrl } from './platform';

// The Admin console's Vendors section. The Admin console is in English only,
// so its screens are found by their English names.
export const vendorsUrl = `${dashboardUrl}/vendors`;

// The Vendors list's heading, which tells the screen apart.
export function vendorsHeading(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: 'Vendors' });
}

// The rows of the page of the list shown now.
export function listedVendors(page: Page): Locator {
  return page.getByRole('list', { name: 'Vendors' }).getByRole('listitem');
}

// The row of a Vendor, found by its name.
export function rowOfVendor(page: Page, name: string): Locator {
  return listedVendors(page).filter({ hasText: name });
}

// Opens the Vendors list at its first page, and goes on to the next page
// until each name has been seen or the last page is reached. It gives back
// the names in the order the list showed them, and leaves the list at the
// page where the last of them was seen.
export async function findOnTheList(page: Page, names: string[]): Promise<string[]> {
  await page.goto(vendorsUrl);
  await expect(vendorsHeading(page)).toBeVisible();

  const pages = page.getByRole('navigation', { name: 'Pages of the Vendors' });
  const seen: string[] = [];
  for (let number = 1; ; number++) {
    // The list shows the way to other pages only when it has more than one.
    // While the next page is on its way the last one stays, marked busy.
    await expect(listedVendors(page).first()).toBeVisible();
    if ((await pages.count()) > 0) {
      await expect(pages.getByText(`Page ${number} of`)).toBeVisible();
    }
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    for (const shown of await listedVendors(page).allInnerTexts()) {
      seen.push(...names.filter((name) => shown.includes(name)));
    }

    const next = pages.getByRole('button', { name: 'Next' });
    if (seen.length === names.length || (await pages.count()) === 0) return seen;
    if (await next.isDisabled()) return seen;
    await next.click();
  }
}

// A Vendor's page, at the address of its own.
export function vendorPageUrl(vendorId: string): string {
  return `${vendorsUrl}/${vendorId}`;
}

// The row of a Vendor's page that shows one detail, found by the detail's
// name in the API, such as `phoneNumber`.
export function detailRow(page: Page, detail: string): Locator {
  return page.locator(`[data-detail="${detail}"]`);
}

// A piece of text that is English in every language, such as a phone number,
// found inside a place by its own characters, as an element that holds
// nothing else. It is marked so: kept apart from the text around it, running
// left to right and said to be English.
export async function expectMarkedAlwaysEnglish(
  inside: Locator,
  text: string,
): Promise<void> {
  const marked = inside.getByText(text, { exact: true });

  await expect(marked).toBeVisible();
  expect(await layoutOf(marked), `"${text}" is kept apart, left to right`).toEqual({
    direction: 'ltr',
    keptApart: true,
  });
  await expect(marked).toHaveAttribute('lang', 'en');
}

// Text someone wrote, found inside a place as an element that holds it whole,
// shown as it was written: its characters unchanged, kept apart from the
// text around it, and running in the direction of its own first letter.
export async function expectShownAsWritten(inside: Locator, text: string): Promise<void> {
  const marked = inside.locator('[dir="auto"]').filter({ hasText: text });

  await expect(marked).toHaveCount(1);
  expect(await marked.innerText()).toBe(text);
  const firstLetter = /\p{L}/u.exec(text)?.[0] ?? '';
  expect(await layoutOf(marked), `"${text}" is kept apart, in its own direction`).toEqual({
    direction: /\p{Script=Arabic}/u.test(firstLetter) ? 'rtl' : 'ltr',
    keptApart: true,
  });
}

// The menu of the Admin console's sections, in the frame's top bar. On a
// phone the sections are behind a menu button.
export async function openTheSection(page: Page, section: string): Promise<void> {
  await page.getByRole('button', { name: 'Sections' }).click();
  await page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: section, exact: true })
    .click();
}

// The form for a new Vendor, at the address of its own under the Vendors.
export const newVendorUrl = `${vendorsUrl}/new`;

// The form's heading, which tells the screen apart.
export function newVendorHeading(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: 'New Vendor' });
}

// A control of the Vendor form, found by its label alone, so that "Phone
// number" is not "Login phone number".
export function vendorFormField(page: Page, label: string): Locator {
  return page.getByLabel(label, { exact: true });
}
