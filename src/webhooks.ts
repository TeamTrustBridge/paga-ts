/**
 * Helpers for verifying and parsing Paga payment callbacks (webhooks).
 */

import {
  DEFAULT_HASH_ALGORITHM,
  PAYMENT_CALLBACK_HASH_FIELDS,
  SUBSIDIARY_FUNDING_HASH_FIELDS,
  SUBSIDIARY_OPERATION_HASH_FIELDS,
  verifyPagaHash,
} from "./auth";
import type { PagaPaymentCallback } from "./types";

export const CHECKOUT_NOTIFICATION_HASH_FIELDS = ["amount", "timeStamp", "paymentReference"];

export async function verifyHash(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
  fields?: string[],
): Promise<boolean> {
  return verifyPagaHash(payload, receivedHash, hashKey, fields);
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

export async function parsePaymentCallback(payload: Record<string, unknown> | null): Promise<PagaPaymentCallback> {
  // Response models with nested objects are validated server-side; for the
  // client SDK we keep the raw payload and let the host app narrow it.
  return (payload ?? {}) as PagaPaymentCallback;
}
