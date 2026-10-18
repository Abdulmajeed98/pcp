import { Module } from '@nestjs/common';

import { CreateVendorCommand } from '~/domain/vendor/CreateVendorCommand';
import { ListVendorsQuery } from '~/domain/vendor/ListVendorsQuery';
import { ReadVendorQuery } from '~/domain/vendor/ReadVendorQuery';
import { VendorStore } from '~/domain/vendor/VendorStore';
import { LoginModule } from '~/infrastructure/login/login.module';

import { VendorController } from './endpoints/vendor.controller';
import { DatabaseVendorStore } from './store/DatabaseVendorStore';

@Module({
  imports: [LoginModule],
  controllers: [VendorController],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: VendorStore, useClass: DatabaseVendorStore },
    CreateVendorCommand,
    ListVendorsQuery,
    ReadVendorQuery,
  ],
})
export class VendorModule {}
