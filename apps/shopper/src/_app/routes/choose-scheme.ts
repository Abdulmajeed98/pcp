import { addressAfterChoosingScheme, isScheme, rememberScheme } from '@/shared/scheme';

import { answerTheSwitch } from './answer-a-switch';

// What the scheme switch asks for, at `/<language>/scheme`: the chosen
// scheme, written into the browser for a year, or forgotten when the
// device's is chosen, and the page the Shopper was on, which they are sent
// back to, drawn in the chosen scheme. Which address that is,
// `addressAfterChoosingScheme` says. With script the page changes its
// colours in place and sends the same form, so that the server's answer
// still writes the choice down. `answerTheSwitch` says how the answer is
// made.
export const chooseScheme = answerTheSwitch({
  field: 'scheme',
  isChoice: isScheme,
  addressAfter: addressAfterChoosingScheme,
  remember: rememberScheme,
});
