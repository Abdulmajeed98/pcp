import { Category } from '../part/Category';

// The one commit of OpenDB the import reads: the last released under ODC-By
// 1.0, of 5 October 2026. OpenDB's later data is under CC BY-NC-SA 4.0, which
// is not for a business, and the import refuses it.
export const pinnedCommit = 'ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf';

// OpenDB's folders that hold the eight Categories, in the order they are
// imported. Its other folders, such as monitors and keyboards, are never read
// (CAT-1).
export const openDbFolders: readonly (readonly [string, Category])[] = [
  ['CPU', Category.CPU],
  ['CPUCooler', Category.CPU_COOLER],
  ['Motherboard', Category.MOTHERBOARD],
  ['RAM', Category.RAM],
  ['Storage', Category.STORAGE],
  ['GPU', Category.GPU],
  ['PCCase', Category.CASE],
  ['PSU', Category.PSU],
];
