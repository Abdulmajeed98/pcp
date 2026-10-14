import { Category } from '../part/Category';

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
