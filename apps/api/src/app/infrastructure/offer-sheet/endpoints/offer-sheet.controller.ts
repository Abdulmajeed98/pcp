import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
} from '@nestjs/swagger';
import { CallerResolver, ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import { DownloadOfferSheetQuery } from '~/domain/offer-sheet/DownloadOfferSheetQuery';
import { largestOfferSheetBytes } from '~/domain/offer-sheet/offer-sheet-layout';
import {
  UploadOfferSheetCommand,
  UploadOfferSheetCommandInput,
} from '~/domain/offer-sheet/UploadOfferSheetCommand';
import { UploadErrorsInterceptor } from '~/infrastructure/upload/upload-errors.interceptor';

import { attachmentNamed } from './attachment-named';
import { DownloadOfferSheetRequest } from './DownloadOfferSheetRequest';
import { OfferSheetResultResponse } from './OfferSheetResultResponse';

// The type of an .xlsx file.
const xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// A Vendor's Offer sheet: the Vendor downloads it and uploads it, or the
// Admin does for any Vendor, by the rule for which Vendor a request acts
// for. Its address is a resource of its own, `offer-sheet`, so that it
// never meets an Offer's, `offers/{offerId}`.
@Controller()
export class OfferSheetController {
  constructor(
    private readonly downloadOfferSheetQuery: DownloadOfferSheetQuery,
    private readonly uploadOfferSheetCommand: UploadOfferSheetCommand,
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
    const offerSheet = result.pipe(Either.getOrThrowWith(ErrorStructureException.of));

    // The dashboard, at another origin, saves the file under its name, which
    // a browser lets it read only when the answer says so.
    response.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(offerSheet.getFile(), {
      type: xlsx,
      disposition: attachmentNamed(
        offerSheet.getFileName(),
        offerSheet.getFileNameInEnglish(),
      ),
    });
  }

  @ApiOperation({
    summary:
      "Upload a Vendor's Offer sheet: each row matched to a Part by its part number changes or adds the Vendor's Offer for it, all in one transaction, a Confirmation at the upload's moment; a row with a problem is skipped. Answers the upload's result. For the Vendor's own Login, or the Admin acting for any Vendor",
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['offerSheet'],
      properties: {
        offerSheet: {
          type: 'string',
          format: 'binary',
          description:
            "The Offer sheet, an .xlsx file of up to 5 MB in the platform's own layout, as its download writes it.",
        },
      },
    },
  })
  @ApiOkResponse({ type: OfferSheetResultResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @HttpCode(HttpStatus.OK)
  @Post('v1/vendors/:vendorId/offer-sheet')
  // A file somewhat over the largest is still received, so that the use case
  // refuses it naming the field. One far over it is refused as it arrives,
  // before it fills the API's memory, as a Part's photo is.
  @UseInterceptors(
    UploadErrorsInterceptor('offerSheet'),
    FileInterceptor('offerSheet', {
      limits: { fileSize: largestOfferSheetBytes + 2 * 1024 * 1024 },
    }),
  )
  async uploadOfferSheet(
    @Param('vendorId') vendorId: string,
    // The file as Multer receives it, kept in memory. Only its bytes are used.
    @UploadedFile() offerSheet: { buffer: Buffer } | undefined,
  ): Promise<OfferSheetResultResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.uploadOfferSheetCommand.execute(
      new UploadOfferSheetCommandInput(
        caller.getId(),
        caller.getRoles(),
        vendorId,
        offerSheet?.buffer,
      ),
    );

    return result.pipe(
      Either.map(OfferSheetResultResponse.of),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}
