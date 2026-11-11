/** Error types for the Paga Engine API SDK. */

export class PagaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PagaError";
  }
}

export class PagaAuthenticationError extends PagaError {}

export class PagaAPIError extends PagaError {
  readonly statusCode?: number;
  readonly responseCode?: number;
  readonly payload?: unknown;

  constructor(message: string, init?: { statusCode?: number; responseCode?: number; payload?: unknown }) {
    super(message);
    this.name = "PagaAPIError";
    this.statusCode = init?.statusCode;
    this.responseCode = init?.responseCode;
    this.payload = init?.payload;
  }
}

export class PagaRateLimitError extends PagaAPIError {}
