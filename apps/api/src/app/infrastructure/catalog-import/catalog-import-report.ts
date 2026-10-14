import { CategoryImport } from '~/domain/catalog-import/CategoryImport';
import { ImportCatalogCommandOutput } from '~/domain/catalog-import/ImportCatalogCommand';
import { RecordLeftOutReason } from '~/domain/catalog-import/opendb-record';
import { SpecificationProblemReason } from '~/domain/specification/Specification';

const recordReasons: Record<RecordLeftOutReason, string> = {
  notARecord: 'it holds no JSON record',
  noOpenDbId: 'it has no OpenDB ID that is a UUID',
  openDbIdNotTheFileName: 'its OpenDB ID is not its file name',
  openDbIdTaken: 'another record has its OpenDB ID',
  noName: 'it has no name',
  noManufacturer: 'it has no manufacturer',
  copiesAnotherRecord: 'it has no manufacturer, and another record has its part number',
};

const valueReasons: Record<SpecificationProblemReason, string> = {
  notAWholeNumber: 'not a whole number',
  notANumber: 'not a number',
  negative: 'below 0',
  zeroMeansMissing: '0, where 0 cannot be true',
  notText: 'not text',
  notYesOrNo: 'not yes or no',
  notInTheSet: 'not one of its values',
  notAList: 'not a list',
  notARow: 'not a row',
  notAGroup: 'not a group of values',
  unknown: 'not on the list',
};

const columns = ['Imported', 'Already there', 'Records left out', 'Values left out'];
const firstColumnWidth = 12;

function tableRow(name: string, counts: readonly number[]): string {
  return [
    name.padEnd(firstColumnWidth),
    ...counts.map((count, index) =>
      count.toLocaleString('en-US').padStart(columns[index].length),
    ),
  ].join('   ');
}

function countsOf(category: CategoryImport): number[] {
  return [
    category.getImported(),
    category.getAlreadyThere(),
    category.getRecordsLeftOut().length,
    category.getValuesLeftOutCount(),
  ];
}

// What the import did, as the owner reads it: the commit, a table of the
// counts for each Category and in total, every record left out and why, each
// Part whose manufacturer was taken from its name, and the values left out,
// counted for each specification and reason.
export function reportOf(output: ImportCatalogCommandOutput): string[] {
  const categories = output.getCategories();
  const totals = categories
    .map(countsOf)
    .reduce((sums, counts) => sums.map((sum, index) => sum + counts[index]), [0, 0, 0, 0]);

  const recordsLeftOut = categories.flatMap((category) =>
    category
      .getRecordsLeftOut()
      .map((record) => `  ${record.getFile()}: ${recordReasons[record.getReason()]}`),
  );
  const manufacturersFromNames = categories.flatMap((category) =>
    category
      .getManufacturersFromNames()
      .map((taken) => `  ${taken.getFile()}: ${taken.getManufacturer()}`),
  );
  const valuesLeftOut = categories.flatMap((category) =>
    category
      .getValuesLeftOut()
      .map(
        (values) =>
          `  ${category.getCategory().getKey()}, ${values.getSpecification()}, ${valueReasons[values.getReason()]}: ${values.getCount().toLocaleString('en-US')}`,
      ),
  );

  return [
    `Read OpenDB at commit ${output.getCommit()}.`,
    '',
    ['Category'.padEnd(firstColumnWidth), ...columns].join('   '),
    ...categories.map((category) =>
      tableRow(category.getCategory().getKey(), countsOf(category)),
    ),
    tableRow('Total', totals),
    '',
    recordsLeftOut.length === 0 ? 'No record was left out.' : 'Records left out:',
    ...recordsLeftOut,
    '',
    manufacturersFromNames.length === 0
      ? 'No manufacturer was taken from a name.'
      : 'Manufacturers taken from the name:',
    ...manufacturersFromNames,
    '',
    valuesLeftOut.length === 0 ? 'No value was left out.' : 'Values left out:',
    ...valuesLeftOut,
  ];
}
