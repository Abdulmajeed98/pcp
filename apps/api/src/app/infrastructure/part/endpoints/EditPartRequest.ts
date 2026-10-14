import { EditPartCommandInput } from '~/domain/part/EditPartCommand';

import { PartFieldsRequest } from './PartFieldsRequest';

// An edit replaces everything it holds, and a specification it leaves out is
// cleared. It has no Category: a Category sent with it is refused.
export class EditPartRequest extends PartFieldsRequest {
  toCommandInput(partId: string): EditPartCommandInput {
    return new EditPartCommandInput(
      partId,
      this.name,
      this.manufacturer,
      this.partNumbers,
      this.specifications,
    );
  }
}
