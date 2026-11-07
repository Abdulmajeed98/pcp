import type {
  M2SlotKey,
  MotherboardFormFactor,
  PowerSupplyFormFactor,
  RamType,
  Socket,
  StorageFormFactor,
  StorageInterface,
} from './fixed-sets';

// A Build as the Compatibility Rules read it: at most one each of CPU, CPU
// cooler, motherboard, GPU, case and PSU, and any number of RAM kits and
// drives, each with its quantity (BLD-1). An unfinished Build lacks some, and
// an empty one holds none.
export type Build = {
  readonly cpu?: Part<CpuSpecifications>;
  readonly cpuCooler?: Part<CpuCoolerSpecifications>;
  readonly motherboard?: Part<MotherboardSpecifications>;
  readonly ram?: readonly PartAndQuantity<RamSpecifications>[];
  readonly storage?: readonly PartAndQuantity<StorageSpecifications>[];
  readonly gpu?: Part<GpuSpecifications>;
  readonly case?: Part<CaseSpecifications>;
  readonly psu?: Part<PsuSpecifications>;
};

// A Category's key, the one the API and `i18n` name it by, such as `cpu` or
// `cpuCooler`: a key of a Build.
export type CategoryKey = keyof Build;

// The specifications a Part of a Category holds: those of a RAM kit or a
// drive for the two Categories a Build holds a list of.
export type SpecificationsOf<C extends CategoryKey> =
  NonNullable<Build[C]> extends readonly (infer Held)[]
    ? Held extends Part<infer Specifications>
      ? Specifications
      : never
    : NonNullable<Build[C]> extends Part<infer Specifications>
      ? Specifications
      : never;

// A Part of a Build. Its identifier is the caller's, its Part's identifier,
// and the outcomes name the Part by it. Its specifications are its needed
// specifications, in OpenDB's names and nesting, as the catalog holds them
// (ADR-0005), with each one the catalog counts as missing left out: the
// library holds no copy of the catalog's rule for what is missing. A value it
// is given is known, and a value it is not given is missing.
export type Part<Specifications> = {
  readonly id: string;
  readonly specifications: Specifications;
};

// A RAM kit or a drive, with how many of it the Build holds: at least one.
export type PartAndQuantity<Specifications> = Part<Specifications> & {
  readonly quantity: number;
};

// Each Category's needed specifications, the ones the Compatibility Rules
// read. A length is in millimetres, a capacity in GB and a power in W.
export type CpuSpecifications = {
  readonly socket?: Socket;
  readonly specifications?: {
    readonly tdp?: number;
    readonly memory?: { readonly types?: readonly RamType[] };
  };
};

export type CpuCoolerSpecifications = {
  readonly cpu_sockets?: readonly Socket[];
  readonly water_cooled?: boolean;
  readonly height?: number;
};

export type MotherboardSpecifications = {
  readonly socket?: Socket;
  readonly form_factor?: MotherboardFormFactor;
  readonly memory?: {
    readonly ram_type?: RamType;
    readonly slots?: number;
    readonly max?: number;
  };
  readonly pcie_slots?: readonly PcieSlots[];
  readonly m2_slots?: readonly M2Slot[];
  readonly storage_devices?: {
    readonly sata_6_gb_s?: number;
    readonly sata_3_gb_s?: number;
  };
  readonly power_connectors?: { readonly cpu_power?: readonly string[] };
  readonly back_connect_connectors?: boolean;
};

// A row of a motherboard's PCIe slots: how many slots of one kind it has.
export type PcieSlots = {
  readonly gen?: string;
  readonly quantity?: number;
  readonly lanes?: number;
};

export type M2Slot = {
  readonly size?: string;
  readonly key?: M2SlotKey;
  readonly interface?: string;
};

export type RamSpecifications = {
  readonly ram_type?: RamType;
  readonly modules?: {
    readonly quantity?: number;
    readonly capacity_gb?: number;
  };
};

export type StorageSpecifications = {
  readonly interface?: StorageInterface;
  readonly form_factor?: StorageFormFactor;
};

export type GpuSpecifications = {
  readonly tdp?: number;
  readonly length?: number;
  readonly total_slot_width?: number;
  readonly power_connectors?: {
    readonly pcie_6_pin?: number;
    readonly pcie_8_pin?: number;
    readonly pcie_12VHPWR?: number;
    readonly pcie_12V_2x6?: number;
  };
};

export type CaseSpecifications = {
  readonly supported_motherboard_form_factors?: readonly MotherboardFormFactor[];
  readonly max_video_card_length?: number;
  readonly expansion_slots?: number;
  readonly max_cpu_cooler_height?: number;
  readonly internal_3_5_bays?: number;
  readonly internal_2_5_bays?: number;
  readonly supported_power_supply_form_factors?: readonly PowerSupplyFormFactor[];
  readonly max_psu_length?: number;
  readonly supports_rear_connecting_motherboard?: boolean;
};

export type PsuSpecifications = {
  readonly wattage?: number;
  readonly form_factor?: PowerSupplyFormFactor;
  readonly length?: number;
  readonly connectors?: {
    readonly eps_8_pin?: number;
    readonly pcie_6_plus_2_pin?: number;
    readonly pcie_12vhpwr?: number;
    readonly sata?: number;
  };
};
