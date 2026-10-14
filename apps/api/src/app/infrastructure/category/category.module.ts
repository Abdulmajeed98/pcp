import { Module } from '@nestjs/common';

import { CategoryController } from './endpoints/category.controller';

@Module({
  controllers: [CategoryController],
})
export class CategoryModule {}
