import { Module } from '@nestjs/common';

import { CreateVendorCommand } from '~/domain/vendor/CreateVendorCommand';
import { DeactivateVendorCommand } from '~/domain/vendor/DeactivateVendorCommand';
import { EditContactDetailsCommand } from '~/domain/vendor/EditContactDetailsCommand';
import { ListVendorsQuery } from '~/domain/vendor/ListVendorsQuery';
import { ReactivateVendorCommand } from '~/domain/vendor/ReactivateVendorCommand';
import { ReadCallersVendorQuery } from '~/domain/vendor/ReadCallersVendorQuery';
import { ReadVendorQuery } from '~/domain/vendor/ReadVendorQuery';
import { ResetVendorPasswordCommand } from '~/domain/vendor/ResetVendorPasswordCommand';
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
    DeactivateVendorCommand,
    ReactivateVendorCommand,
    ListVendorsQuery,
    ReadVendorQuery,
    ReadCallersVendorQuery,
    ResetVendorPasswordCommand,
    VendorAccessRule,
  ],
})
export class VendorModule {}
