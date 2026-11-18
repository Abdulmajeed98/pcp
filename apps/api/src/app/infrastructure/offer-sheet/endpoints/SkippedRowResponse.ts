import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  offerSheetRowFields,
  offerSheetRowRefusals,
} from '~/domain/offer-sheet/offer-sheet-row';
import type {
  OfferSheetRowField,
  OfferSheetRowRefusal,
} from '~/domain/offer-sheet/offer-sheet-row';
import {
  RowOfTheSamePart,
  RowWithNoPart,
  RowWithSeveralParts,
  SkippedRow,
} from '~/domain/offer-sheet/OfferSheetResult';
import { usdPriceTextOf } from '~/infrastructure/offer/endpoints/OfferResponse';
import { PartSummaryResponse } from '~/infrastructure/part/endpoints/PartSummaryResponse';

// The four reasons a row is skipped.
const problems = ['noPart', 'severalParts', 'samePart', 'notValid'] as const;
type Problem = (typeof problems)[number];

// A row an upload skipped, which changed nothing, and why: its part number
// matched no Part; it matched several; another row matched the same Part;
// or a cell does not fit. Each problem gives what it holds, and a field a
// problem does not hold is left out, not null.
export class SkippedRowResponse {
  @ApiProperty({
    description: "The row's number in the file, as the spreadsheet numbers it.",
    type: 'integer',
    example: 23,
  })
  readonly row: number;

  @ApiProperty({
    description:
      "The row's part number, in Western digits, without invisible marks and without the space around it; as written when its own cell was the problem, cut to its first 100 code points, the longest a part number may be.",
    example: '11348-03-20G',
  })
  readonly partNumber: string;

  @ApiProperty({
    description:
      'Why the row was skipped: its part number matched no Part, matched several Parts, or another row matched the same Part; or one of its cells does not fit.',
    enum: problems,
    example: 'noPart',
  })
  readonly problem: Problem;

  @ApiPropertyOptional({
    description:
      "The Part's name as the row writes it, cut to its first 300 code points, the longest a Part Request takes, or null when it gives none. Left out unless the row matched no Part.",
    type: String,
    nullable: true,
    example: 'Sapphire Pulse Radeon RX 9070 XT 16GB',
  })
  readonly name?: string | null;

  @ApiPropertyOptional({
    description:
      'The Quoted Price in USD the row states, as a decimal number with two decimal places, or null when it quotes none. Left out unless the row matched no Part.',
    type: String,
    nullable: true,
    example: '649.99',
  })
  readonly usdPrice?: string | null;

  @ApiPropertyOptional({
    description:
      'The Quoted Price in IQD the row states, in whole dinars, or null when it quotes none. Left out unless the row matched no Part.',
    type: Number,
    nullable: true,
    example: 950000,
  })
  readonly iqdPrice?: number | null;

  @ApiPropertyOptional({
    description:
      'Whether the row says the Part is in stock. Left out unless the row matched no Part.',
    example: true,
  })
  readonly inStock?: boolean;

  @ApiPropertyOptional({
    description:
      'The warranty the row states, in whole months, or null when it states none. Left out unless the row matched no Part.',
    type: Number,
    nullable: true,
    example: 24,
  })
  readonly warrantyMonths?: number | null;

  @ApiPropertyOptional({
    description:
      "Whether the Vendor has an open Part Request whose part number is the row's, compared whatever the case of its letters. Left out unless the row matched no Part.",
    example: false,
  })
  readonly partRequestOpen?: boolean;

  @ApiPropertyOptional({
    description:
      "Every Part that holds the row's part number, in the catalog's order. Left out unless the row matched several Parts.",
    type: [PartSummaryResponse],
  })
  readonly parts?: PartSummaryResponse[];

  @ApiPropertyOptional({
    description:
      'The Part the row and other rows matched. Left out unless another row matched the same Part.',
    type: PartSummaryResponse,
  })
  readonly part?: PartSummaryResponse;

  @ApiPropertyOptional({
    description:
      'The numbers of the first other rows that matched the same Part, in order, at most 10. Left out unless another row matched the same Part.',
    type: 'integer',
    isArray: true,
    example: [31],
  })
  readonly rows?: number[];

  @ApiPropertyOptional({
    description:
      'How many other rows matched the same Part, every one of them, those `rows` names among them. Left out unless another row matched the same Part.',
    type: 'integer',
    example: 1,
  })
  readonly otherRows?: number;

  @ApiPropertyOptional({
    description:
      "The column of the row's first cell that does not fit, in the columns' order. Left out unless a cell does not fit.",
    enum: offerSheetRowFields,
    example: 'usdPrice',
  })
  readonly field?: OfferSheetRowField;

  @ApiPropertyOptional({
    description:
      "Why the cell does not fit: the part number's own reasons as a Part Request's, the Offer's as an Offer's details are refused, a word that is neither yes nor no, or a cell that cannot be read, such as an error. Left out unless a cell does not fit.",
    enum: offerSheetRowRefusals,
    example: 'missing',
  })
  readonly reason?: OfferSheetRowRefusal;

  private constructor(skipped: SkippedRow) {
    this.row = skipped.getRow();
    this.partNumber = skipped.getPartNumber();

    if (skipped instanceof RowWithNoPart) {
      const details = skipped.getDetails();
      this.problem = 'noPart';
      this.name = skipped.getName();
      this.usdPrice = usdPriceTextOf(details.getUsdPriceCents());
      this.iqdPrice = details.getIqdPrice();
      this.inStock = details.isInStock();
      this.warrantyMonths = details.getWarrantyMonths();
      this.partRequestOpen = skipped.isPartRequestOpen();
    } else if (skipped instanceof RowWithSeveralParts) {
      this.problem = 'severalParts';
      this.parts = skipped.getParts().map((part) => PartSummaryResponse.of(part));
    } else if (skipped instanceof RowOfTheSamePart) {
      this.problem = 'samePart';
      this.part = PartSummaryResponse.of(skipped.getPart());
      this.rows = [...skipped.getOtherRows()];
      this.otherRows = skipped.getOtherRowCount();
    } else {
      this.problem = 'notValid';
      this.field = skipped.getField();
      this.reason = skipped.getReason();
    }
  }

  static of(skipped: SkippedRow): SkippedRowResponse {
    return new SkippedRowResponse(skipped);
  }
}
