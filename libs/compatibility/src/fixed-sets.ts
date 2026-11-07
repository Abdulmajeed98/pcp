// The fixed sets of values that the Compatibility Rules compare or read by
// value. The API's specification lists take them from here, so the values the
// Admin's forms offer are the values the rules know. A new value, such as the
// socket of a CPU released later, is added here, in code, once for the forms
// and the rules alike.

// The sockets, the RAM types and both kinds of form factor are used by more
// than one Category's list, because a Compatibility Rule compares one Part's
// value with another's: a CPU's socket with a motherboard's and a cooler's, a
// RAM type with a CPU's and a motherboard's, a motherboard's form factor with
// a case's, and a PSU's form factor with a case's. Each holds every value the
// Categories involved use in OpenDB at the commit the catalog is imported
// from.

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

// Each set's values as a type, so that a rule naming a value it compares,
// such as "Mini-ITX", fails the type check when the value is misspelt.
export type Socket = (typeof sockets)[number];

export const ramTypes = ['DDR1', 'DDR2', 'DDR3', 'DDR4', 'DDR5'] as const;

export type RamType = (typeof ramTypes)[number];

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

export type MotherboardFormFactor = (typeof motherboardFormFactors)[number];

export const powerSupplyFormFactors = [
  'ATX',
  'ATX/EPS',
  'Flex ATX',
  'Mini-ITX',
  'SFX',
  'SFX-L',
  'TFX',
] as const;

export type PowerSupplyFormFactor = (typeof powerSupplyFormFactors)[number];

// The values OpenDB's drives use at the commit the catalog is imported from.
// Compatibility Rules count drives by these: SATA drives against SATA ports,
// M.2 drives against M.2 slots, 3.5-inch and 2.5-inch drives against bays.
export const storageFormFactors = [
  '2.5"',
  '3.5"',
  'M.2-2230',
  'M.2-2242',
  'M.2-2260',
  'M.2-2280',
  'M.2-22110',
  'mSATA',
  'PCIe',
] as const;

export type StorageFormFactor = (typeof storageFormFactors)[number];

export const storageInterfaces = [
  'M.2 PCIe 2.0 x4',
  'M.2 PCIe 3.0 x2',
  'M.2 PCIe 3.0 x4',
  'M.2 PCIe 3.0 x8',
  'M.2 PCIe 3.0 x16',
  'M.2 PCIe 4.0 x4',
  'M.2 PCIe 4.0 x8',
  'M.2 PCIe 5.0 x2',
  'M.2 PCIe 5.0 x4',
  'M.2 PCIe x1',
  'M.2 PCIe x2',
  'M.2 SATA',
  'mSATA',
  'PATA 100',
  'SAS 3.0 Gb/s',
  'SAS 6.0 Gb/s',
  'SAS 12.0 Gb/s',
  'SATA 1.5 Gb/s',
  'SATA 3.0 Gb/s',
  'SATA 6.0 Gb/s',
  'U.2',
] as const;

export type StorageInterface = (typeof storageInterfaces)[number];

// The keys of a motherboard's M.2 slot. A slot keyed M takes any M.2 drive,
// and one keyed B only an M.2 SATA drive. Slots keyed E are for wireless
// cards.
export const m2SlotKeys = ['B', 'E', 'M'] as const;

export type M2SlotKey = (typeof m2SlotKeys)[number];
