import { Injectable } from '@nestjs/common';
import { ClsService, ClsStore } from 'nestjs-cls';

import { Caller } from '../../domain/caller/Caller';

interface CallerStore extends ClsStore {
  caller: Caller;
}

// Answers who the caller of the request in hand is. The guard fills it only
// after every check has passed. It is read in the infrastructure layer only:
// a controller hands plain values to a use case, and never the caller itself.
@Injectable()
export class CallerResolver {
  constructor(private readonly clsService: ClsService<CallerStore>) {}

  getCaller(): Caller {
    const caller = this.clsService.get('caller');
    if (caller === undefined) {
      throw new Error('No caller is set: the guard has not let this request through');
    }

    return caller;
  }

  setCaller(caller: Caller): void {
    this.clsService.set('caller', caller);
  }
}
