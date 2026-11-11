/**
 * Paga status and error codes.
 *
 * Paga exposes two different code vocabularies:
 *
 * - The **Collect API** (payments, refunds, subsidiary accounts, Direct
 *   Debit) reports a `statusCode` **string**. `"0"` means success.
 * - The **Business API** (money transfer, airtime, bill payment, business
 *   account) reports a `responseCode` **integer**. `0` means success.
 *
 * They are modelled separately because the same numeric value means different
 * things in each family: `114` is `FAILED` on Collect but `INVALID_ACCOUNT`
 * on Business.
 */

/** `statusCode` values returned by the Collect API. */
export enum CollectStatusCode {
  SUCCESS = "0",
  IN_PROCESS = "1",
  PARTIAL_PAYMENT = "2",
  SYSTEM_ERROR = "-1",
  REQUEST_EXPIRED = "-2",
  REQUEST_CANCELLED = "-3",
  FAILED = "114",
  FAILED_NON_REFUNDABLE = "115",
  NOT_FOUND = "121",
}

/** `responseCode` values returned by the Business API. */
export enum BusinessErrorCode {
  SUCCESS = 0,
  BULK_PARTIAL_SUCCESS = 1,
  BULK_ALL_FAILED = 2,
  PENDING = 3,

  UNKNOWN_ERROR = -1,
  UNSUPPORTED_OPERATION = -2,

  INVALID_ACCOUNT_NUMBER = 4,

  INVALID_BANK = 101,
  DISABLED_ACCOUNT = 103,
  INVALID_PRINCIPAL = 104,
  DUPLICATE_REFERENCE = 105,
  INVALID_RECIPIENT_ACCOUNT = 107,
  INVALID_ORGANISATION_USER = 108,
  AIRTIME_ERROR = 109,
  INVALID_ORGANISATION = 110,
  INVALID_CUSTOMER = 111,
  INVALID_BILLER = 112,
  INVALID_USER = 113,
  INVALID_ACCOUNT = 114,
  INVALID_BANK_ACCOUNT = 115,
  INVALID_AMOUNT = 116,
  MISSING_PARAMETER = 117,
  INVALID_USER_IDENTIFIER = 118,
  INVALID_PROCESS = 119,
  PHOTO_ALREADY_SET = 120,
  INVALID_IMAGE_TYPE = 121,
  INVALID_IDENTIFICATION_DETAILS = 122,
  INVALID_PHONE_NUMBER = 123,
  INVALID_FIRST_NAME = 124,
  INVALID_LAST_NAME = 125,
  INVALID_USERNAME = 126,
  INVALID_EMAIL = 127,
  EMAIL_ALREADY_EXISTS = 128,
  LOCKED_USER_ACCOUNT = 129,
  INVALID_NAME = 130,
  INVALID_MERCHANT = 131,
  INVALID_PROCESS_CHANNEL = 132,
  DESTINATION_BANK_NOT_FOUND = 133,
  INVALID_DATE_OF_BIRTH = 134,
  UNKNOWN_REFERENCE_NUMBER = 135,
  EXCEEDS_TRANSACTION_LIMIT = 136,
  BELOW_MINIMUM = 137,
  EXCEEDS_ACCOUNT_LIMIT = 138,
  INSUFFICIENT_BALANCE = 139,
  REFERENCE_NUMBER_TOO_LONG = 140,
}

/** `statusCode` values on a Direct Debit mandate callback. */
export enum MandateStatusCode {
  PENDING = "003",
  VERIFIED = "004",
  APPROVED = "0",
  REJECTED = "005",
  UNKNOWN = "006",
  NOT_FOUND = "007",
}

/**
 * `ProcessStatusId` values on a mandate.
 *
 * This is the field to branch on. A mandate's `data.statusCode` stays
 * `"1"` / `"pending"` forever, so it tells you nothing.
 */
export enum MandateProcessStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

/** `data.statusCode` values returned by `/getChargeMandateStatus`. */
export enum ChargeStatusCode {
  CHARGED = 0,
  PENDING = 1,
  INVALID = -1,
  UNKNOWN = -4,
}

/** States a payment request moves through. */
export enum PaymentRequestState {
  PENDING = "PENDING",
  CHARGEABLE = "CHARGEABLE",
  CONSUMED = "CONSUMED",
  EXPIRED = "EXPIRED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

/**
 * `status_code` values returned by the Checkout verify endpoint.
 *
 * The Checkout API uses snake_case here, unlike the rest of Paga's
 * camelCase envelopes.
 */
export enum CheckoutVerifyStatusCode {
  PAID = 0,
  PENDING = 2,
}

/**
 * Coerce a response body into a plain object.
 *
 * Accepts a plain object, or anything exposing `model_dump()`.
 */
export function asRecord(body: unknown): Record<string, unknown> | undefined {
  if (body === null || body === undefined) return undefined;
  if (typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  if (record && typeof record.model_dump === "function") {
    try {
      const dumped = (record.model_dump as () => unknown)();
      if (dumped && typeof dumped === "object") {
        return dumped as Record<string, unknown>;
      }
    } catch {
      return undefined;
    }
  }
  return record;
}

/** Return the `CollectStatusCode` carried by a body, if any. */
export function resolveCollectStatus(body: unknown): CollectStatusCode | undefined {
  const record = asRecord(body);
  if (!record) return undefined;
  const raw = record.statusCode;
  if (raw === null || raw === undefined) return undefined;
  const value = String(raw);
  return Object.values(CollectStatusCode).includes(value as CollectStatusCode)
    ? (value as CollectStatusCode)
    : undefined;
}

/** Return the `BusinessErrorCode` carried by a body, if any. */
export function resolveBusinessCode(body: unknown): BusinessErrorCode | undefined {
  const record = asRecord(body);
  if (!record) return undefined;
  const raw = record.responseCode;
  if (raw === null || raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) return undefined;
  return Object.values(BusinessErrorCode).includes(value as BusinessErrorCode)
    ? (value as BusinessErrorCode)
    : undefined;
}

/**
 * Return the Checkout verify `status_code` carried by a body, if any.
 *
 * The Checkout API spells this field in snake_case, unlike the camelCase
 * `statusCode` the Collect API uses. The raw number is returned so an
 * unrecognised code can still be classified as a failure.
 */
export function resolveCheckoutVerifyStatus(body: unknown): number | undefined {
  const record = asRecord(body);
  if (!record) return undefined;
  const raw = record.status_code;
  if (raw === null || raw === undefined) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/** Either of Paga's code families. */
export type PagaCode = CollectStatusCode | BusinessErrorCode;
