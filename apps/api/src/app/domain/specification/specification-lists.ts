import { Category } from '../part/Category';
import { caseSpecifications } from './case.specifications';
import { cpuCoolerSpecifications } from './cpu-cooler.specifications';
import { cpuSpecifications } from './cpu.specifications';
import { gpuSpecifications } from './gpu.specifications';
import { motherboardSpecifications } from './motherboard.specifications';
import { psuSpecifications } from './psu.specifications';
import { ramSpecifications } from './ram.specifications';
import { SpecificationList } from './SpecificationList';
import { storageSpecifications } from './storage.specifications';

// Every Category's list, by the key of the Category each names, so that a
// list and its Category cannot disagree.
const lists = new Map<string, SpecificationList>(
  [
    cpuSpecifications,
    cpuCoolerSpecifications,
    motherboardSpecifications,
    ramSpecifications,
    storageSpecifications,
    gpuSpecifications,
    caseSpecifications,
    psuSpecifications,
  ].map((list) => [list.getCategoryKey(), list]),
);

// Every Category has its list above. The test of the Categories endpoint reads
// all eight, and fails if one has none.
export function specificationListOf(category: Category): SpecificationList {
  return lists.get(category.getKey()) as SpecificationList;
}
