// What the platform takes from BuildCores OpenDB, written in one place for
// the API's import and the Shopper app's credit.

// Where OpenDB is kept.
export const openDbRepository = 'https://github.com/buildcores/buildcores-open-db';

// The one commit of OpenDB the platform reads: the last released under ODC-By
// 1.0, of 5 October 2026. OpenDB's later data is under CC BY-NC-SA 4.0, which
// does not allow a business to use it, and ADR-0001 says that nothing newer is
// used without the owner's agreement.
export const pinnedOpenDbCommit = 'ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf';
