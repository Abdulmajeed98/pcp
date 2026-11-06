import type { StaticImageData } from 'next/image';

import builtPc from './files/built-pc.webp';
import caseConnectors from './files/case-connectors.webp';
import handSettingMemory from './files/hand-setting-memory.webp';
import memoryChips from './files/memory-chips.webp';
import motherboardCloseup from './files/motherboard-closeup.webp';
import redLitMotherboard from './files/red-lit-motherboard.webp';

// The photographs of PC hardware the Shopper app's pages lie on (DESIGN.md's
// The photographs), each from an open collection under a licence that lets
// it be shown, found with Taste's `assets.mjs` in browse ticket 07. Only
// those under CC0 or CC BY are used: a dimmed copy may count as an
// adaptation, which CC BY-SA would ask to be shared alike. None shows a
// place, a maker's name or logo large, or a person who could be known, and
// none stands for a Part on sale.
//
// Each is kept here once, as WebP at most 1920 pixels wide, made from the
// original with sharp, and Next's image component serves it from the app
// itself at the width each page draws it. Each is credited on the page that
// shows it, in the back cover's credits, by its title, its author and its
// licence, with what the page did to it.
export interface Photograph {
  image: StaticImageData;
  // Its credit, as its collection gives it.
  title: string;
  author: string;
  licence: { name: string; address: string };
  source: string;
  // What the page does to it, which a CC BY licence asks the credit to say:
  // dimmed under the paper, or cropped to its plate.
  changed: 'dimmed' | 'cropped';
}

const ccBy2 = {
  name: 'CC BY 2.0',
  address: 'https://creativecommons.org/licenses/by/2.0/',
};
const ccBy4 = {
  name: 'CC BY 4.0',
  address: 'https://creativecommons.org/licenses/by/4.0/',
};
// A photograph given to the public domain asks for no credit, and is credited
// all the same, as every photograph on a page is.
const cc0 = {
  name: 'CC0 1.0',
  address: 'https://creativecommons.org/publicdomain/zero/1.0/',
};

export const photographs = {
  // The home page's dim room, under its card.
  redLitMotherboard: {
    image: redLitMotherboard,
    title:
      'Close-up view of a red-lit computer motherboard showcasing intricate circuitry and components',
    author: 'Shixart1985',
    licence: ccBy2,
    source: 'https://commons.wikimedia.org/w/index.php?curid=186624319',
    changed: 'dimmed',
  },
  // Under the home page's sheet of the eight Categories, and the not-found
  // page's sheet.
  builtPc: {
    image: builtPc,
    title: 'Gaming-PC 20240426 HOF2514-HDR RAW-Export',
    author: 'PantheraLeo1359531',
    licence: ccBy4,
    source: 'https://commons.wikimedia.org/w/index.php?curid=147760057',
    changed: 'dimmed',
  },
  // The home page's facts row, cut to 4:3 round the expansion slots.
  caseConnectors: {
    image: caseConnectors,
    title:
      'Close view of computer motherboard connectors and circuitry illuminated by blue lighting in a tech workspace',
    author: 'Shixart1985',
    licence: ccBy2,
    source: 'https://commons.wikimedia.org/w/index.php?curid=196551757',
    changed: 'cropped',
  },
  // Under a Category page's swing tag and sheet, the board the Parts go on.
  motherboardCloseup: {
    image: motherboardCloseup,
    title: 'Computer Motherboard Closeup',
    author: 'Lenharth Systems',
    licence: cc0,
    source: 'https://commons.wikimedia.org/w/index.php?curid=153659539',
    changed: 'dimmed',
  },
  // Under a Part page's price slip and sheet of Offers, a hand setting a
  // memory stick into a board.
  handSettingMemory: {
    image: handSettingMemory,
    title:
      'Hand holds RAM module above a computer motherboard illuminated by vibrant red and blue lighting in a dark setting',
    author: 'Shixart1985',
    licence: ccBy2,
    source: 'https://commons.wikimedia.org/w/index.php?curid=186624326',
    changed: 'dimmed',
  },
  // Under a Part page's specifications, the chips of a memory module.
  memoryChips: {
    image: memoryChips,
    title: 'SDRAM memory module, zoomed',
    author: 'Vitaly Zdanevich',
    licence: cc0,
    source: 'https://commons.wikimedia.org/wiki/File:SDRAM_memory_module,_zoomed.jpg',
    changed: 'dimmed',
  },
} as const satisfies Record<string, Photograph>;
