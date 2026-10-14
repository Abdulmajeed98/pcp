import * as partSchema from '~/infrastructure/part/part.schema';
import * as photoSchema from '~/infrastructure/photo/photo.schema';

// Every table the API stores data in, for the database client.
export const schema = { ...partSchema, ...photoSchema };

export type Schema = typeof schema;
