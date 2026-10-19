import * as offerSchema from '~/infrastructure/offer/offer.schema';
import * as partSchema from '~/infrastructure/part/part.schema';
import * as photoSchema from '~/infrastructure/photo/photo.schema';
import * as vendorSchema from '~/infrastructure/vendor/vendor.schema';

// Every table the API stores data in, for the database client.
export const schema = { ...offerSchema, ...partSchema, ...photoSchema, ...vendorSchema };

export type Schema = typeof schema;
