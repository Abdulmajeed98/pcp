// Which page of a list a caller asks for: its number, counted from 0, and how
// many items a page holds.
export class PageableAttributes {
  constructor(
    private readonly page: number,
    private readonly size: number,
  ) {}

  getPage(): number {
    return this.page;
  }

  getSize(): number {
    return this.size;
  }

  // How many items to read, and how many to pass over first.
  getLimit(): number {
    return this.size;
  }

  getOffset(): number {
    return this.page * this.size;
  }
}
