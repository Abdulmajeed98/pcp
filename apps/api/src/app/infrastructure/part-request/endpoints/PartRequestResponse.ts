import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Category } from '~/domain/part/Category';
import { PartRequestAndOffer } from '~/domain/part-request/PartRequest';
import type { PartRequestState } from '~/domain/part-request/PartRequest';
import { usdPriceTextOf } from '~/infrastructure/offer/endpoints/OfferResponse';
import { PartSummaryResponse } from '~/infrastructure/part/endpoints/PartSummaryResponse';

const states: PartRequestState[] = ['open', 'fulfilled', 'rejected'];

// A Part Request: what the Vendor sent, when, where it stands, and, once
// resolved, how. The day it was sent, the days since, and whether its Offer
// would be expired are answered at the moment it was read, so that no
// frontend counts days or holds the 14 days.
export class PartRequestResponse {
  @ApiProperty({
    description: "The Part Request's identifier on the platform.",
    example: '5d4c3b2a-1f0e-4d9c-8b7a-6f5e4d3c2b1a',
  })
  readonly id: string;

  @ApiProperty({
    description: "The Part's Category, as the Vendor gave it.",
    enum: Category.keys(),
    example: 'gpu',
  })
  readonly category: string;

  @ApiProperty({
    description: "The Part's name, as the Vendor wrote it.",
    example: 'Sapphire Pulse Radeon RX 9070 XT 16GB',
  })
  readonly name: string;

  @ApiProperty({
    description:
      "The manufacturer's part number, without invisible marks and without the space around it.",
    example: '11348-03-20G',
  })
  readonly partNumber: string;

  @ApiProperty({
    description:
      'The Quoted Price in USD the Vendor would offer, as a decimal number with two decimal places, or null when it quotes none.',
    type: String,
    nullable: true,
    example: '649.99',
  })
  readonly usdPrice: string | null;

  @ApiProperty({
    description:
      'The Quoted Price in IQD the Vendor would offer, in whole dinars, or null when it quotes none.',
    type: Number,
    nullable: true,
    example: 950000,
  })
  readonly iqdPrice: number | null;

  @ApiProperty({ description: 'Whether the Vendor has the Part in stock.' })
  readonly inStock: boolean;

  @ApiProperty({
    description: 'The warranty, in whole months, or null when the Vendor states none.',
    type: Number,
    nullable: true,
    example: 24,
  })
  readonly warrantyMonths: number | null;

  @ApiProperty({
    description: "When the Vendor sent it, by the API's clock.",
    format: 'date-time',
  })
  readonly sentAt: string;

  @ApiProperty({
    description:
      "The day it was sent, in Iraq's time (`Asia/Baghdad`), where everyone using the platform is, as a date.",
    format: 'date',
    example: '2026-11-16',
  })
  readonly sentOn: string;

  @ApiProperty({
    description:
      "The calendar days, in Iraq's time, from the day it was sent to today, by the API's clock: 0 on the day it was sent and 1 on the next, whatever the hours between, so that the count always agrees with `sentOn`.",
    type: 'integer',
    minimum: 0,
    example: 3,
  })
  readonly daysSinceSent: number;

  @ApiProperty({
    description:
      'Where it stands: open until the Admin resolves it, fulfilled once matched to a Part, or rejected with a reason.',
    enum: states,
    example: 'open',
  })
  readonly state: PartRequestState;

  @ApiProperty({
    description:
      "Whether the Offer a fulfilment makes, confirmed at the moment the request was sent, would be an Expired Offer today, by the API's clock: more than 14 days after it was sent. It is then listed as expired until the Vendor confirms it.",
    example: false,
  })
  readonly offerWouldBeExpired: boolean;

  @ApiPropertyOptional({
    description:
      'The Part that fulfilled it, as the catalog holds it, of any Category. Left out unless it is fulfilled.',
    type: PartSummaryResponse,
  })
  readonly part?: PartSummaryResponse;

  @ApiPropertyOptional({
    description:
      "The identifier of the Vendor's Offer for that Part now, or null once the Vendor has removed it. Left out unless it is fulfilled.",
    type: String,
    nullable: true,
    example: '8e1f2a3b-4c5d-4e6f-8a7b-9c0d1e2f3a4b',
  })
  readonly offerId?: string | null;

  @ApiPropertyOptional({
    description:
      "The Admin's reason for rejecting it, as the Admin wrote it. Left out unless it is rejected.",
    example: 'This is the same Part as the Sapphire Pulse RX 9070 XT already listed.',
  })
  readonly reason?: string;

  @ApiPropertyOptional({
    description:
      "When the Admin resolved it, by the API's clock. Left out while it is open.",
    format: 'date-time',
  })
  readonly resolvedAt?: string;

  protected constructor(answered: PartRequestAndOffer, readAt: Date) {
    const partRequest = answered.getPartRequest();
    const details = partRequest.getOfferDetails();
    this.id = partRequest.getId();
    this.category = partRequest.getCategory().getKey();
    this.name = partRequest.getName();
    this.partNumber = partRequest.getPartNumber();
    this.usdPrice = usdPriceTextOf(details.getUsdPriceCents());
    this.iqdPrice = details.getIqdPrice();
    this.inStock = details.isInStock();
    this.warrantyMonths = details.getWarrantyMonths();
    this.sentAt = partRequest.getSentAt().toISOString();
    this.sentOn = partRequest.getSentOn();
    this.daysSinceSent = partRequest.getDaysSinceSent(readAt);
    this.state = partRequest.getState();
    this.offerWouldBeExpired = partRequest.offerWouldBeExpired(readAt);

    const part = partRequest.getPart();
    if (part !== null) {
      this.part = PartSummaryResponse.of(part);
      this.offerId = answered.getOfferId();
    }
    const reason = partRequest.getReason();
    if (reason !== null) this.reason = reason;
    const resolvedAt = partRequest.getResolvedAt();
    if (resolvedAt !== null) this.resolvedAt = resolvedAt.toISOString();
  }

  static of(answered: PartRequestAndOffer, readAt: Date): PartRequestResponse {
    return new PartRequestResponse(answered, readAt);
  }
}
