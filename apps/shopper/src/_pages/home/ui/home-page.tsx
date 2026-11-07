import { chosenCurrency } from '@/shared/currency';
import { photographs } from '@/shared/photographs';
import { BackCover } from '@/widgets/back-cover';

import { readTheHomePage } from '../api/read-the-home-page';
import { Card } from './card';
import { CategoriesSheet } from './categories-sheet';
import { FactsRow } from './facts-row';
import { Plate } from './plate';

// The home page, at `/<language>` (DESIGN.md's The home page): the card over a
// dim room, the whole first screen, which holds the frame's row; the sheet of
// the eight Categories, each leading to its Category page; the square plate,
// one Part and its slip; the facts row; and the back cover. It is drawn on
// the server for each request, in the page's language and the chosen
// currency, from what the API answers then. It is the Shopper app's proof
// that it reads the API.
export async function HomePage() {
  const currency = await chosenCurrency();
  const { firstPages, plate, figures } = await readTheHomePage(currency);

  return (
    <>
      <main>
        <Card part={plate?.part} figures={figures} />
        <CategoriesSheet firstPages={firstPages} figures={figures} />
        {plate !== undefined && (
          <Plate part={plate.part} offers={plate.offers} figures={figures} />
        )}
        <FactsRow figures={figures} />
      </main>
      <BackCover
        photographs={[
          photographs.redLitMotherboard,
          photographs.builtPc,
          photographs.caseConnectors,
        ]}
      />
    </>
  );
}
