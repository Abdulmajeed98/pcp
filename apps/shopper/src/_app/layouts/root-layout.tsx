import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '../styles/global.css';

export const metadata: Metadata = {
  title: 'Shopper app',
};

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
