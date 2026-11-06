import { getLocale, getTranslations } from 'next-intl/server';

// The name slot, the way home (DESIGN.md's The name slot): a link to the home
// page in every language, in the Label type, "PC Parts and Prices", a plain
// description of what the platform is until its name is chosen (PRODUCT.md's
// Brand Commitments), never the working title. On the home page it is marked
// as the page the Shopper is on.
export async function NameSlot({ onTheHomePage = false }: { onTheHomePage?: boolean }) {
  const [language, t] = await Promise.all([getLocale(), getTranslations('Site')]);

  return (
    <a
      href={`/${language}`}
      aria-current={onTheHomePage ? 'page' : undefined}
      data-testid="name-slot"
      className="type-name-slot inline-flex min-h-control items-center no-underline decoration-2 underline-offset-4 hover:underline"
    >
      {t('name')}
    </a>
  );
}
