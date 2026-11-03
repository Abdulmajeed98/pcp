import { Currency } from '../currency/currency';
import { Filter, FilterValue } from '../specification/filters';

// One of a Category's filters with the values its Visible Parts hold, in
// their order: numbers by size, text alphabetically.
export class FilterValues {
  constructor(
    private readonly filter: Filter,
    private readonly values: readonly FilterValue[],
  ) {}

  getFilter(): Filter {
    return this.filter;
  }

  getValues(): readonly FilterValue[] {
    return this.values;
  }
}

// What a Shopper may narrow a Category's list of Visible Parts by (BRW-2),
// from the Visible Parts themselves, before any filter or search is applied,
// so that the choices never shift as the Shopper chooses: the manufacturers,
// alphabetically; each filter that some Visible Part holds a value of, with
// its values; and the lowest and highest Lowest Price in the chosen
// currency, in its unit, or none when no Visible Part has one.
export class VisiblePartsFilters {
  constructor(
    private readonly manufacturers: readonly string[],
    private readonly filters: readonly FilterValues[],
    private readonly currency: Currency,
    private readonly lowestPrice: number | null,
    private readonly highestPrice: number | null,
  ) {}

  getManufacturers(): readonly string[] {
    return this.manufacturers;
  }

  getFilters(): readonly FilterValues[] {
    return this.filters;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  getLowestPrice(): number | null {
    return this.lowestPrice;
  }

  getHighestPrice(): number | null {
    return this.highestPrice;
  }
}
