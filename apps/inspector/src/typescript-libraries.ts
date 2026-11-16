import { registerHooks } from 'node:module';

// Lets Node run the workspace's libraries as they are written: in
// TypeScript whose relative imports name no extension, as the API's and the
// Shopper app's bundlers take them. A relative import from a library's file
// that Node does not find is looked for again as a `.ts` file, and nothing
// else changes. The reading of the catalog asks `@pcp/compatibility` for
// the needed specifications (`catalog-parts.ts`), and the stand-in API judges
// Builds with it, so that neither copies a rule (`stand-in-api.ts`).
//
// `pnpm shopper:inspect` and `pnpm dashboard:inspect`, whose shop reads the
// catalog the same way, load this file with Node's `--import`, before the
// command's own: every import of a module is found before any of them runs.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const notFound = (error as { code?: unknown }).code === 'ERR_MODULE_NOT_FOUND';
      const fromALibrary = context.parentURL?.includes('/libs/') ?? false;
      if (!notFound || !fromALibrary || !specifier.startsWith('.')) throw error;
      return nextResolve(`${specifier}.ts`, context);
    }
  },
});
