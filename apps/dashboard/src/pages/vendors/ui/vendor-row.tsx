import type { VendorSummaryResponse } from '@pcp/api-client';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import { Link, useMatch } from 'react-router';

import { DeactivatedMark } from '@/entities/vendor';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/shared/ui';

// One Vendor in the list: its name as it writes it, and one secondary line
// with its login phone number in Iraq's own form, which is English in every
// language, and the mark of a deactivated Vendor when it is one. The whole
// row opens the Vendor's page, while the link's name is the Vendor's alone,
// and the page of the list stays on its address. The row of the Vendor open
// beside the list is marked as the open one, on a Shelf ground.
export function VendorRow({ vendor }: { vendor: VendorSummaryResponse }) {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const opened = useMatch('/vendors/:vendorId/*')?.params.vendorId === vendor.id;

  return (
    <Item
      className={cn(
        'relative rounded-none px-0 hover:bg-secondary has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2',
        opened && 'bg-secondary',
      )}
    >
      <ItemContent>
        <ItemTitle>
          <Link
            to={keepingTheQuery(`/vendors/${vendor.id}`)}
            aria-current={opened ? 'page' : undefined}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            <AsWritten>{vendor.name}</AsWritten>
          </Link>
        </ItemTitle>
        <ItemDescription className="flex flex-wrap items-center gap-x-2">
          <AlwaysEnglish>{vendor.loginPhoneNumber.national}</AlwaysEnglish>
          {!vendor.active && <DeactivatedMark />}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
