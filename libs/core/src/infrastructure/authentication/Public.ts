import { Reflector } from '@nestjs/core';

// States that anyone may call an endpoint. The guard then checks nothing, so
// the endpoint answers the same with a good token, a bad one or none.
export const Public = Reflector.createDecorator<void, boolean>({ transform: () => true });
