/**
 * Helpers for verifying and parsing Paga payment callbacks (webhooks).
 */

import {
  CHARGE_CALLBACK_HASH_FIELDS,
  DEFAULT_HASH_ALGORITHM,
  MANDATE_CALLBACK_HASH_FIELDS,
  PAYMENT_CALLBACK_HASH_FIELDS,
  SUBSIDIARY_FUNDING_HASH_FIELDS,
  SUBSIDIARY_OPERATION_HASH_FIELDS,
  computePagaHash,
  verifyPagaHash,
} from "./auth.js";
import type {
  MoneyTransferNotification,
  PagaPaymentCallback,
  UsdPaymentWebhook,
} from "./types.js";

export const CHECKOUT_NOTIFICATION_HASH_FIELDS = ["amount", "timeStamp", "paymentReference"];

/**
 * Money transfer notification.
 *
 * Paga sends the digest in the `x-paga-hash` header and the field order in
 * `x-paga-hash-parameters`.
 */
export const MONEY_TRANSFER_NOTIFICATION_HASH_FIELDS = [
  "referenceNumber",
  "transactionDate",
  "transactionId",
  "amount",
  "sessionId",
];

/** Persistent payment account callback, as signed into the body's `hash`. */
export const PERSISTENT_PAYMENT_ACCOUNT_HASH_FIELDS = [
  "statusCode",
  "accountNumber",
  "amount",
  "clearingFeeAmount",
  "transferFeeAmount",
];

/** Persistent payment account callback, as signed into the `x-paga-hash` header. */
export const PERSISTENT_PAYMENT_ACCOUNT_HEADER_HASH_FIELDS = [
  "transactionReference",
  "accountNumber",
  "amount",
];

/**
 * Parse Paga's `x-paga-hash-parameters` header.
 *
 * The header names the fields Paga signed, in order. A trailing `hashKey`
 * entry is dropped, because the SDK appends the key itself.
 */
export function parseHashParameters(raw: string | null | undefined): string[] | undefined {
  if (!raw) return undefined;
  const parts = raw
    .replace(/;/g, ",")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) return undefined;
  const cleaned = parts.filter((part) => part.toLowerCase() !== "hashkey");
  return cleaned.length > 0 ? cleaned : undefined;
}

export async function verifyHash(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
  fields?: string[],
): Promise<boolean> {
  return verifyPagaHash(payload, receivedHash, hashKey, fields);
}

/**
 * Verify a Paga hash that arrived in a header rather than the body.
 *
 * When `x-paga-hash-parameters` is present it wins over the caller's default
 * field order.
 */
export async function verifyHashHeader(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
  fields?: string[],
  hashParameters?: string[] | null,
): Promise<boolean> {
  const order =
    hashParameters && hashParameters.length > 0 ? hashParameters : fields ?? PAYMENT_CALLBACK_HASH_FIELDS;
  return verifyPagaHash(payload, receivedHash, hashKey, order);
}

export async function verifyPaymentCallback(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
): Promise<boolean> {
  return verifyHash(payload, receivedHash, hashKey, PAYMENT_CALLBACK_HASH_FIELDS);
}

export async function verifyCheckoutNotification(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
): Promise<boolean> {
  return verifyHash(payload, receivedHash, hashKey, CHECKOUT_NOTIFICATION_HASH_FIELDS);
}

export async function verifyFundingNotification(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
): Promise<boolean> {
  return verifyHash(payload, receivedHash, hashKey, SUBSIDIARY_FUNDING_HASH_FIELDS);
}

export async function verifySubsidiaryOperation(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
): Promise<boolean> {
  return verifyHash(payload, receivedHash, hashKey, SUBSIDIARY_OPERATION_HASH_FIELDS);
}

/**
 * Verify the hash of a money transfer notification.
 *
 * The digest travels in the `x-paga-hash` header, not the body. Answer HTTP
 * 200 with `{"status": "SUCCESS"}` once you have accepted it; Paga retries
 * until it gets that.
 */
export async function verifyMoneyTransferNotification(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
  hashParameters?: string[] | null,
): Promise<boolean> {
  return verifyHashHeader(
    payload,
    receivedHash,
    hashKey,
    MONEY_TRANSFER_NOTIFICATION_HASH_FIELDS,
    hashParameters,
  );
}

/** Parse a money transfer notification payload. */
export function parseMoneyTransferNotification(
  payload: Record<string, unknown> | null,
): MoneyTransferNotification {
  return (payload ?? {}) as MoneyTransferNotification;
}

/**
 * Verify the hash of a persistent payment account callback.
 *
 * Paga signs two digests over the same callback: the body's `hash` field
 * covers `statusCode + accountNumber + amount + clearingFeeAmount +
 * transferFeeAmount`, and the `x-paga-hash` header covers
 * `transactionReference + accountNumber + amount`.
 */
export async function verifyPersistentPaymentAccountCallback(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
  hashParameters?: string[] | null,
): Promise<boolean> {
  return verifyHashHeader(
    payload,
    receivedHash,
    hashKey,
    PERSISTENT_PAYMENT_ACCOUNT_HASH_FIELDS,
    hashParameters,
  );
}

/**
 * Parse a USD (ACH, Wire, Swift) payment webhook.
 *
 * This webhook carries no signature, so there is nothing to verify.
 * De-duplicate on `referenceNumber` plus `paymentId`.
 */
export function parseUsdPaymentWebhook(payload: Record<string, unknown> | null): UsdPaymentWebhook {
  return (payload ?? {}) as UsdPaymentWebhook;
}

/**
 * Verify the hash of a Direct Debit mandate callback.
 *
 * The `timeStamp` carries nanosecond precision and must be hashed exactly as
 * received.
 */
export async function verifyMandateCallback(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
): Promise<boolean> {
  return verifyHash(payload, receivedHash, hashKey, MANDATE_CALLBACK_HASH_FIELDS);
}

/**
 * Verify the hash of a Direct Debit charge callback.
 *
 * The amount is a string with two decimals and no commas, such as `"600.00"`.
 */
export async function verifyChargeCallback(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
): Promise<boolean> {
  return verifyHash(payload, receivedHash, hashKey, CHARGE_CALLBACK_HASH_FIELDS);
}

export async function parsePaymentCallback(
  payload: Record<string, unknown> | null,
): Promise<PagaPaymentCallback> {
  // Response models with nested objects are validated server-side; for the
  // client SDK we keep the raw payload and let the host app narrow it.
  return (payload ?? {}) as PagaPaymentCallback;
}
