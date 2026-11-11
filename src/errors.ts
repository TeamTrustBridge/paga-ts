/** Error types for the Paga Engine API SDK. */

import { resolveBusinessCode, resolveCollectStatus } from "./codes.js";
import { classify, OperationOutcome } from "./outcome.js";
import type { PagaCode } from "./codes.js";

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
  /** The resolved Collect status or Business error code, when the body carried one. */
  readonly code?: PagaCode;
  /** The classified outcome of the operation. */
  readonly outcome: OperationOutcome;

  constructor(
    message: string,
    init?: { statusCode?: number; responseCode?: number; payload?: unknown; code?: PagaCode },
  ) {
    super(message);
    this.name = "PagaAPIError";
    this.statusCode = init?.statusCode;
    this.responseCode = init?.responseCode;
    this.payload = init?.payload;
    this.code = init?.code ?? resolveCollectStatus(init?.payload) ?? resolveBusinessCode(init?.payload);
    this.outcome = classify(init?.payload);
  }

  /**
   * Whether the outcome is undetermined.
   *
   * When this is true, check the transaction status using the original
   * reference number. Do not resend with a new reference.
   */
  get isUnknownOutcome(): boolean {
    return this.outcome === OperationOutcome.UNKNOWN;
  }
}

export class PagaRateLimitError extends PagaAPIError {}
