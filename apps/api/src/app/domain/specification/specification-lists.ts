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

const lists = new Map<Category, SpecificationList>([
  [Category.CPU, cpuSpecifications],
  [Category.CPU_COOLER, cpuCoolerSpecifications],
  [Category.MOTHERBOARD, motherboardSpecifications],
  [Category.RAM, ramSpecifications],
  [Category.STORAGE, storageSpecifications],
  [Category.GPU, gpuSpecifications],
  [Category.CASE, caseSpecifications],
  [Category.PSU, psuSpecifications],
]);

// Every Category has its list above. The test of the Categories endpoint reads
// all eight, and fails if one has none.
export function specificationListOf(category: Category): SpecificationList {
  return lists.get(category) as SpecificationList;
}
