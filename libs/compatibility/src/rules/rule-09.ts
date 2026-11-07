import { exceeds, problemWhen } from './findings';
import { rule } from './statement';

// Rule 9: the GPU is longer than the case allows, in millimetres. A GPU
// exactly as long as the case's longest fits.
export const rule9 = rule({
  number: 9,
  involves: { gpu: ['length'], case: ['max_video_card_length'] },
  judge: ({ gpu, case: pcCase }) =>
    problemWhen(exceeds(gpu.read('length'), pcCase.read('max_video_card_length'))),
});
