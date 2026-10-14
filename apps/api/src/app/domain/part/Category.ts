// The kind of a Part. There are exactly eight (CAT-1). Each is named by the
// same key that the shared terms in `i18n` translate it by.
export class Category {
  static readonly CPU = new Category('cpu');
  static readonly CPU_COOLER = new Category('cpuCooler');
  static readonly MOTHERBOARD = new Category('motherboard');
  static readonly RAM = new Category('ram');
  static readonly STORAGE = new Category('storage');
  static readonly GPU = new Category('gpu');
  static readonly CASE = new Category('case');
  static readonly PSU = new Category('psu');

  private constructor(private readonly key: string) {}

  getKey(): string {
    return this.key;
  }

  static values(): Category[] {
    return [
      Category.CPU,
      Category.CPU_COOLER,
      Category.MOTHERBOARD,
      Category.RAM,
      Category.STORAGE,
      Category.GPU,
      Category.CASE,
      Category.PSU,
    ];
  }

  static keys(): string[] {
    return Category.values().map((category) => category.key);
  }

  // The Category a key names, when it names one. Keys are compared exactly.
  static withKey(key: string): Category | undefined {
    return Category.values().find((category) => category.key === key);
  }
}
