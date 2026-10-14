// OpenDB records at the pinned commit that copy a complete record without
// sharing a part number with it, so that no rule can tell. The import leaves
// each out and names it. Both name no manufacturer, and were found on 15
// October 2026, when the import began to take a missing manufacturer from a
// record's name. The owner chose to list them rather than import them,
// because nothing deletes a Part once it is in the catalog.
export const knownCopies: ReadonlySet<string> = new Set([
  // "ASRock X370 Killer SLI AM4", which carries an MSI board's part number by
  // mistake, copies dc63ff42-506f-4d82-b2f8-a16ab0c167a7, "ASRock X370 Killer
  // SLI DDR4 ATX AM4".
  '7bd359b2-5558-49cd-b2b3-414941925720',
  // "DeepCool MATREXX 70 RGB" copies e73fac02-4b42-4fc6-8496-699cdd026b16,
  // "Deepcool MATREXX 70 ADD-RGB 3F ATX Mid Tower Black Tempered Glass".
  'b668e577-4caf-4106-bdd0-af4f3785ebe8',
]);
