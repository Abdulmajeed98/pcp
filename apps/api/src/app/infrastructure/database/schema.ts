import * as partSchema from '~/infrastructure/part/part.schema';

// Every table the API stores data in, for the database client.
export const schema = { ...partSchema };

export type Schema = typeof schema;
