import { getTranslations } from 'next-intl/server';

// The "not found" screen, in the visitor's language. Next shows it, inside
// the frame and with the status 404, when a route asks for it.
export async function NotFoundPage() {
  const t = await getTranslations('NotFoundPage');

  return (
    <>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </>
  );
}
