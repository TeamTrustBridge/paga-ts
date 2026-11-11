/**
 * Classify a Paga response into an outcome.
 *
 * Paga's error handling is two-layered: the HTTP status says whether Paga
 * accepted the request, and the body code says what happened to the
 * *transaction*. A 200 response can still mean the money never moved.
 *
 * Three of the Business API codes are **unknown outcomes** rather than
 * failures: `-1` (unknown error), `105` (duplicate reference) and `135`
 * (unknown reference number). The correct response to those is to check the
 * transaction status with the *original* reference number, never to resend
 * with a new reference.
 */

import {
  BusinessErrorCode,
  CheckoutVerifyStatusCode,
  CollectStatusCode,
  resolveBusinessCode,
  resolveCheckoutVerifyStatus,
  resolveCollectStatus,
} from "./codes.js";

/** The outcome of a Paga operation. */
export enum OperationOutcome {
  /** The operation completed. Money moved, or the request was created. */
  SUCCESS = "success",
  /** Accepted and still in flight. Poll the status endpoint or await the callback. */
  PENDING = "pending",
  /** Partially fulfilled: some of the money arrived. More may still come. */
  PARTIAL = "partial",
  /** The operation was rejected. Safe to retry with a new reference. */
  FAILED = "failed",
  /** The outcome is undetermined. Check status with the original reference. */
  UNKNOWN = "unknown",
}

/** Business API codes that mean "unknown outcome", not "failed". */
export const UNKNOWN_OUTCOME_BUSINESS_CODES: ReadonlySet<BusinessErrorCode> = new Set([
  BusinessErrorCode.UNKNOWN_ERROR,
  BusinessErrorCode.DUPLICATE_REFERENCE,
  BusinessErrorCode.UNKNOWN_REFERENCE_NUMBER,
]);

const COLLECT_PENDING: ReadonlySet<CollectStatusCode> = new Set([
  CollectStatusCode.IN_PROCESS,
]);

const COLLECT_PARTIAL: ReadonlySet<CollectStatusCode> = new Set([
  CollectStatusCode.PARTIAL_PAYMENT,
]);

const COLLECT_UNKNOWN: ReadonlySet<CollectStatusCode> = new Set([
  CollectStatusCode.SYSTEM_ERROR,
]);

/**
 * Classify a Paga response body into an {@link OperationOutcome}.
 *
 * The Collect API is detected by the presence of `statusCode` and the
 * Business API by `responseCode`. A body carrying neither is treated as
 * `UNKNOWN`, since there is nothing to conclude from.
 */
export function classify(body: unknown): OperationOutcome {
  const collectStatus = resolveCollectStatus(body);
  if (collectStatus !== undefined) {
    if (collectStatus === CollectStatusCode.SUCCESS) return OperationOutcome.SUCCESS;
    if (COLLECT_PENDING.has(collectStatus)) return OperationOutcome.PENDING;
    if (COLLECT_PARTIAL.has(collectStatus)) return OperationOutcome.PARTIAL;
    if (COLLECT_UNKNOWN.has(collectStatus)) return OperationOutcome.UNKNOWN;
    return OperationOutcome.FAILED;
  }

  const businessCode = resolveBusinessCode(body);
  if (businessCode !== undefined) {
    if (
      businessCode === BusinessErrorCode.SUCCESS ||
      businessCode === BusinessErrorCode.BULK_PARTIAL_SUCCESS
    ) {
      return OperationOutcome.SUCCESS;
    }
    if (businessCode === BusinessErrorCode.PENDING) return OperationOutcome.PENDING;
    if (UNKNOWN_OUTCOME_BUSINESS_CODES.has(businessCode)) return OperationOutcome.UNKNOWN;
    return OperationOutcome.FAILED;
  }

  // The Checkout verify endpoint spells its code in snake_case.
  const checkoutStatus = resolveCheckoutVerifyStatus(body);
  if (checkoutStatus !== undefined) {
    if (checkoutStatus === CheckoutVerifyStatusCode.PAID) return OperationOutcome.SUCCESS;
    if (checkoutStatus === CheckoutVerifyStatusCode.PENDING) return OperationOutcome.PENDING;
    return OperationOutcome.FAILED;
  }

  return OperationOutcome.UNKNOWN;
}

/**
 * Whether the outcome of a body is undetermined.
 *
 * An unknown outcome means you must check the transaction status using the
 * original reference number. Retrying with a fresh reference risks moving
 * money twice.
 */
export function isUnknownOutcome(body: unknown): boolean {
  return classify(body) === OperationOutcome.UNKNOWN;
}
