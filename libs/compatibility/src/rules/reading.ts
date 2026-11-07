// One value a rule reads: a Part's value at a specification's path, or none
// when the Part was not given it, which makes it missing.
export type Reading<Value> = {
  readonly part: string;
  readonly path: string;
  readonly value: Value | undefined;
};
