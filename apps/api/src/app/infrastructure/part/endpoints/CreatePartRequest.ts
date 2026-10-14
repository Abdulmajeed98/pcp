import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { Category } from '~/domain/part/Category';
import { CreatePartCommandInput } from '~/domain/part/CreatePartCommand';

import { PartFieldsRequest } from './PartFieldsRequest';

export class CreatePartRequest extends PartFieldsRequest {
  @ApiProperty({
    description: "The Part's Category, which never changes afterwards.",
    enum: Category.keys(),
    example: 'cpu',
  })
  @IsIn(Category.keys())
  readonly category!: string;

  toCommandInput(): CreatePartCommandInput {
    return new CreatePartCommandInput(
      Category.withKey(this.category) as Category,
      this.name,
      this.manufacturer,
      this.partNumbers,
      this.specifications,
    );
  }
}
