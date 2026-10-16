// The city a Vendor is in. The set is fixed in code and holds Erbil only, so
// a second city is a change to it. Each is named by a key, which the shared
// terms in `i18n` will translate it by.
export class City {
  static readonly ERBIL = new City('erbil');

  private constructor(private readonly key: string) {}

  getKey(): string {
    return this.key;
  }

  static values(): City[] {
    return [City.ERBIL];
  }

  static keys(): string[] {
    return City.values().map((city) => city.key);
  }

  // The city a key names, when it names one. Keys are compared exactly.
  static withKey(key: string): City | undefined {
    return City.values().find((city) => city.key === key);
  }
}
