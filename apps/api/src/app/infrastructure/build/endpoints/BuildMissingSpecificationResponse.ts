import { ApiProperty } from '@nestjs/swagger';

import { MissingInABuild } from '~/domain/build/judgment';

// A needed specification that a Part of a Build lacks, named so that a
// Shopper reads it in English in every language (LANG-3).
export class BuildMissingSpecificationResponse {
  @ApiProperty({
    description: 'The Part that lacks it, by its identifier.',
    example: '3b8f0c52-6a1e-4f3d-9c27-5e8a1d4b7f60',
  })
  readonly part: string;

  @ApiProperty({
    description:
      "Its path in the Part's specifications, in OpenDB's field names and nesting, as its Category's specification list names it; for a field of a row, the list's path, the row's place from 0 and the field's name.",
    example: 'pcie_slots.0.lanes',
  })
  readonly path: string;

  @ApiProperty({
    description:
      "Its English label, from the Part's specification list; for a field of a row, the list's.",
    example: 'PCIe slots',
  })
  readonly label: string;

  @ApiProperty({
    description:
      "For a field of a row, such as a PCIe slot's lanes, the field's English label; null otherwise.",
    type: String,
    nullable: true,
    example: 'Lanes',
  })
  readonly fieldLabel: string | null;

  private constructor(missing: MissingInABuild) {
    this.part = missing.getPartId();
    this.path = missing.getPath();
    this.label = missing.getLabel();
    this.fieldLabel = missing.getFieldLabel() ?? null;
  }

  static of(missing: MissingInABuild): BuildMissingSpecificationResponse {
    return new BuildMissingSpecificationResponse(missing);
  }
}
