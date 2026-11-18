import type { Language } from '@pcp/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { askAgainAfterAChangeToTheOffers } from '@/entities/offer';
import { apiClient, dataOf, partsKey } from '@/shared/api';
import { t } from '@/shared/i18n';

import { fileNameIn, saveTheFile } from '../model/file-name';
import { keepTheResult } from '../model/kept-result';

// Downloads the Vendor's Offer sheet in a language, the portal's current
// one, and saves it under the name the API gives, read from the answer's
// `Content-Disposition` (`downloadOfferSheet` answers the file as a Blob,
// sheet ticket 01). A refusal, or an API that cannot be reached, is thrown
// as every call's is.
export function useDownloadOfferSheet(vendorId: string) {
  return useMutation({
    mutationFn: async (language: Language) => {
      const call = apiClient.downloadOfferSheet({
        path: { vendorId },
        query: { language },
      });
      const file = await dataOf(call);
      const { response } = await call;
      const name =
        fileNameIn(response?.headers.get('Content-Disposition') ?? null) ??
        `${t('OfferSheetFile.file')}.xlsx`;
      saveTheFile(file, name);
    },
  });
}

// Uploads an Offer sheet the Vendor chose, and keeps the upload's result for
// the visit. An upload changes the Vendor's Offers through the one path every
// change takes, so that the Offers screen, its counts and the expiry banner
// follow, and it asks every query about Parts again too, since an added
// Offer can move a Part onto Missing specifications and changes a search's
// `offerId` (the spec's query keys). They are asked again as the result is
// shown, not waited for.
export function useUploadOfferSheet(vendorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerSheet: File) =>
      dataOf(apiClient.uploadOfferSheet({ path: { vendorId }, body: { offerSheet } })),
    onSuccess: (result, offerSheet) => {
      keepTheResult(vendorId, result, offerSheet.name);
      void askAgainAfterAChangeToTheOffers(queryClient, vendorId);
      void queryClient.invalidateQueries({ queryKey: partsKey });
    },
  });
}
