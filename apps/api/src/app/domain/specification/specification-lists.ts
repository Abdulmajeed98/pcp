import { Category } from '../part/Category';
import { cpuSpecifications } from './cpu.specifications';
import { SpecificationList } from './SpecificationList';

// Each Category's specification list. The seven that are empty arrive with
// the rest of the catalog's lists.
const lists = new Map<Category, SpecificationList>([
  [Category.CPU, cpuSpecifications],
  [Category.CPU_COOLER, new SpecificationList([])],
  [Category.MOTHERBOARD, new SpecificationList([])],
  [Category.RAM, new SpecificationList([])],
  [Category.STORAGE, new SpecificationList([])],
  [Category.GPU, new SpecificationList([])],
  [Category.CASE, new SpecificationList([])],
  [Category.PSU, new SpecificationList([])],
]);

// Every Category has its list above. The test of the Categories endpoint reads
// all eight, and fails if one has none.
export function specificationListOf(category: Category): SpecificationList {
  return lists.get(category) as SpecificationList;
}
