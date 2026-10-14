import { PageableAttributes } from './PageableAttributes';

// Where a page stands in the whole list: its number and size, and how many
// items and pages there are in all.
export class PageAttributes {
  private constructor(
    private readonly pageNumber: number,
    private readonly pageSize: number,
    private readonly totalElements: number,
  ) {}

  static of(pageable: PageableAttributes, totalElements: number): PageAttributes {
    return new PageAttributes(pageable.getPage(), pageable.getSize(), totalElements);
  }

  getPageNumber(): number {
    return this.pageNumber;
  }

  getPageSize(): number {
    return this.pageSize;
  }

  getTotalElements(): number {
    return this.totalElements;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize);
  }

  isFirst(): boolean {
    return this.pageNumber === 0;
  }

  // A page past the end is the last one too.
  isLast(): boolean {
    return this.pageNumber + 1 >= this.getTotalPages();
  }
}
