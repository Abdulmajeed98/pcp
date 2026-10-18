import { Module } from '@nestjs/common';

import { CreateVendorCommand } from '~/domain/vendor/CreateVendorCommand';
import { EditContactDetailsCommand } from '~/domain/vendor/EditContactDetailsCommand';
import { ListVendorsQuery } from '~/domain/vendor/ListVendorsQuery';
import { ReadCallersVendorQuery } from '~/domain/vendor/ReadCallersVendorQuery';
import { ReadVendorQuery } from '~/domain/vendor/ReadVendorQuery';
import { VendorAccessRule } from '~/domain/vendor/VendorAccessRule';
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
    EditContactDetailsCommand,
    ListVendorsQuery,
    ReadVendorQuery,
    ReadCallersVendorQuery,
    VendorAccessRule,
  ],
})
export class VendorModule {}
