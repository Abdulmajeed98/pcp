// Next's own declarations come first. They declare a CSS module, which the
// declaration below also matches, and TypeScript takes the first of two that
// match equally.
/// <reference types="next" />

// TypeScript 6 refuses an import for its side effect when it cannot find what
// is imported, and the installed Next, 16.1.7, declares CSS modules only. Next
// declares a plain stylesheet itself, in these words, from a later release of
// version 16. Delete this file when Next is upgraded to one that does.
declare module '*.css' {}
