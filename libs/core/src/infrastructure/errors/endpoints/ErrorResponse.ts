// One thing that went wrong. `title` and `detail` are keys for the frontends
// to turn into text, and never text written for a person.
export class SubErrorResponse {
  constructor(
    readonly code: string,
    readonly title: string,
    readonly detail: string,
  ) {}
}

// The body of every error the API answers.
export class ErrorResponse {
  constructor(readonly errors: SubErrorResponse[]) {}
}
