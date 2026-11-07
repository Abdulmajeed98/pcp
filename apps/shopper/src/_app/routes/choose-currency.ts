import {
  addressAfterChoosingCurrency,
  isCurrency,
  rememberCurrency,
} from '@/shared/currency';

import { answerTheSwitch } from './answer-a-switch';

// What the currency switch asks for, at `/<language>/currency`: the chosen
// currency, written into the browser for a year, and the page the Shopper
// was on, which they are sent back to without a price range typed in the
// other currency. Which address that is, `addressAfterChoosingCurrency`
// says, and it alone. `answerTheSwitch` says how the answer is made.
export const chooseCurrency = answerTheSwitch({
  field: 'currency',
  isChoice: isCurrency,
  addressAfter: addressAfterChoosingCurrency,
  remember: rememberCurrency,
});
