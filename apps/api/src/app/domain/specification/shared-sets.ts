// The fixed sets that more than one Category's list uses, because a
// Compatibility Rule compares one Part's value with another's: a CPU's socket
// with a motherboard's and a cooler's, a RAM type with a CPU's and a
// motherboard's, a motherboard's form factor with a case's, and a PSU's form
// factor with a case's. Each holds every value the Categories involved use in
// OpenDB at the commit the catalog is imported from. A new value, such as the
// socket of a CPU released later, is added here, in code, once for all of them.

// Three spellings OpenDB uses for coolers and motherboards are left out as
// mistakes or variants of a value already here: "LGA 1151v2" (LGA 1151),
// "LGA 115" and "LGA 1121". Creating a Part that names one is refused, and
// the import leaves the value out and counts it.
export const sockets = [
  '2 x G34',
  '2 x LGA 1366',
  '2 x LGA 2011',
  '2 x LGA 2011-3',
  '2 x LGA 2011-3 Narrow',
  'AM1',
  'AM2',
  'AM2+',
  'AM3',
  'AM3+',
  'AM4',
  'AM5',
  'FM1',
  'FM2',
  'FM2+',
  'G34',
  'Integrated AMD',
  'Integrated Atom',
  'Integrated Pentium',
  'Integrated Xeon D',
  'LGA 775',
  'LGA 1150',
  'LGA 1151',
  'LGA 1155',
  'LGA 1156',
  'LGA 1200',
  'LGA 1356',
  'LGA 1366',
  'LGA 1700',
  'LGA 1851',
  'LGA 1954',
  'LGA 2011',
  'LGA 2011-3',
  'LGA 2011-3 Narrow',
  'LGA 2066',
  'LGA 3647',
  'LGA 4677',
  'LGA 4710',
  'SP3',
  'SP5',
  'SP6',
  'sTR4',
  'sTR5',
  'sTRX4',
  'sWRX8',
  'TR4',
] as const;

export const ramTypes = ['DDR1', 'DDR2', 'DDR3', 'DDR4', 'DDR5'] as const;

export const motherboardFormFactors = [
  'ATX',
  'DTX',
  'EATX',
  'Flex ATX',
  'HPTX',
  'Micro ATX',
  'Mini DTX',
  'Mini-ITX',
  'SSI CEB',
  'SSI EEB',
  'Thin Mini-ITX',
  'XL ATX',
] as const;

export const powerSupplyFormFactors = [
  'ATX',
  'ATX/EPS',
  'Flex ATX',
  'Mini-ITX',
  'SFX',
  'SFX-L',
  'TFX',
] as const;
