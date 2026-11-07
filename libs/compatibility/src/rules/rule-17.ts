import { exceeds, fact, problemWhen, product, whatever, yesOrNo } from './findings';
import { rule } from './statement';

// Rule 17: an air cooler, one that is not liquid cooled, is taller than the
// case allows. A liquid cooler passes, so a cooler that fits passes whether
// or not it says it is liquid cooled.
export const rule17 = rule({
  number: 17,
  involves: { cpuCooler: ['water_cooled', 'height'], case: ['max_cpu_cooler_height'] },
  judge: ({ cpuCooler, case: pcCase }) =>
    problemWhen(
      whatever(cpuCooler.read('water_cooled'), yesOrNo, (liquid) =>
        liquid
          ? fact(false)
          : exceeds(
              product(cpuCooler.read('height')),
              pcCase.read('max_cpu_cooler_height'),
            ),
      ),
    ),
});
