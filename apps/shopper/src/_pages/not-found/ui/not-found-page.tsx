import { getTranslations } from 'next-intl/server';

// The "not found" screen, in the visitor's language. When a route asks for
// it, Next answers with the status 404 and a bare document, and the browser
// draws this screen inside the frame.
export async function NotFoundPage() {
  const t = await getTranslations('NotFoundPage');

  return (
    <>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </>
  );
}
