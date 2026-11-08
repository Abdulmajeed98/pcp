import { TransformFnParams } from 'class-transformer';

// A parameter given once is read as a list of one, and one repeated as the
// list of its values, as the address's query gives them. Written once, for
// every parameter a Shopper's request may repeat.
export function asAList({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? [value] : value;
}
