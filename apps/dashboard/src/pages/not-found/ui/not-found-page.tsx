import { Link } from 'react-router';

import { buttonVariants } from '@/shared/ui';

// What the Admin console shows at an address that matches none of its
// screens, such as an old link.
export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-xl font-semibold sm:text-2xl">Screen not found</h1>
      <p>This address matches no screen of the Admin console.</p>
      <Link to="/catalog" className={buttonVariants({ variant: 'outline' })}>
        Open the Catalog
      </Link>
    </div>
  );
}
