import { fact, problemWhen, whatever, yesOrNo } from './findings';
import { rule } from './statement';

// Rule 21: the motherboard has its connectors on its back and the case does
// not take such boards. An ordinary board passes whatever the case says, and
// a case that takes such boards passes whatever the board says.
export const rule21 = rule({
  number: 21,
  involves: {
    motherboard: ['back_connect_connectors'],
    case: ['supports_rear_connecting_motherboard'],
  },
  judge: ({ motherboard, case: pcCase }) =>
    problemWhen(
      whatever(motherboard.read('back_connect_connectors'), yesOrNo, (onItsBack) =>
        onItsBack
          ? whatever(
              pcCase.read('supports_rear_connecting_motherboard'),
              yesOrNo,
              (takes) => fact(!takes),
            )
          : fact(false),
      ),
    ),
});
