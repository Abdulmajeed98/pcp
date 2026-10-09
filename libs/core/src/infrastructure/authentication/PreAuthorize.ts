import { Reflector } from '@nestjs/core';

import { Role } from '../../domain/caller/Role';

// States who may call an endpoint: a caller that holds any one of the roles.
export const PreAuthorize = Reflector.createDecorator<Role[]>();
