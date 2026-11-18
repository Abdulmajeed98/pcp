import { Controller, Get, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { CallerResolver, ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import { DownloadOfferSheetQuery } from '~/domain/offer-sheet/DownloadOfferSheetQuery';

import { attachmentNamed } from './attachment-named';
import { DownloadOfferSheetRequest } from './DownloadOfferSheetRequest';

// The type of an .xlsx file.
const xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// A Vendor's Offer sheet: the Vendor downloads it, or the Admin does for any
// Vendor, by the rule for which Vendor a request acts for. Its address is a
// resource of its own, `offer-sheet`, so that it never meets an Offer's,
// `offers/{offerId}`.
@Controller()
export class OfferSheetController {
  constructor(
    private readonly downloadOfferSheetQuery: DownloadOfferSheetQuery,
    private readonly callerResolver: CallerResolver,
  ) {}

  @ApiOperation({
    summary:
      "A Vendor's Offer sheet, an .xlsx file with one row for each of its Offers, Expired Offers among them, in the language asked for, its name in Content-Disposition. For the Vendor's own Login, or the Admin acting for any Vendor",
  })
  @ApiProduces(xlsx)
  @ApiOkResponse({
    schema: { type: 'string', format: 'binary' },
    headers: {
      'Content-Disposition': {
        description:
          "The file's name in the language asked for, with the day in Iraq, as `filename*`, and in English as `filename`.",
        schema: { type: 'string' },
      },
    },
  })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Get('v1/vendors/:vendorId/offer-sheet')
  async downloadOfferSheet(
    @Param('vendorId') vendorId: string,
    @Query() request: DownloadOfferSheetRequest,
    // Express's response, of which only its headers are set here.
    @Res({ passthrough: true }) response: { setHeader(name: string, value: string): void },
  ): Promise<StreamableFile> {
    const caller = this.callerResolver.getCaller();
    const result = await this.downloadOfferSheetQuery.execute(
      request.toQueryInput(caller.getId(), caller.getRoles(), vendorId),
    );
    const sheet = result.pipe(Either.getOrThrowWith(ErrorStructureException.of));

    // The dashboard, at another origin, saves the file under its name, which
    // a browser lets it read only when the answer says so.
    response.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(sheet.getFile(), {
      type: xlsx,
      disposition: attachmentNamed(sheet.getFileName(), sheet.getFileNameInEnglish()),
    });
  }
}
