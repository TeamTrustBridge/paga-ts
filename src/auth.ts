/**
 * Paga hash signing helpers (SHA-512, lowercase hex) and hash field constants.
 */

export const DEFAULT_HASH_ALGORITHM = "sha512";

export const PAYMENT_REQUEST_HASH_FIELDS = [
  "referenceNumber",
  "amount",
  "currency",
  "payer.phoneNumber",
  "payer.email",
];

export const BILL_PAYMENT_HASH_FIELDS = [
  "referenceNumber",
  "amount",
  "merchantAccount",
  "merchantReferenceNumber",
];

export const AIRTIME_HASH_FIELDS = ["referenceNumber", "amount", "destinationPhoneNumber"];

export const MONEY_TRANSFER_HASH_FIELDS = [
  "referenceNumber",
  "amount",
  "destinationBankUUID",
  "destinationBankAccountNumber",
];

export const ACCOUNT_BALANCE_HASH_FIELDS = ["referenceNumber"];

export const PAYMENT_STATUS_HASH_FIELDS = ["referenceNumber"];

export const TRANSACTION_HISTORY_HASH_FIELDS = ["referenceNumber"];

export const REFUND_HASH_FIELDS = ["referenceNumber", "refundAmount"];

export const PAYMENT_CALLBACK_HASH_FIELDS = [
  "notificationId",
  "statusCode",
  "externalReferenceNumber",
  "state",
  "outstandingBalance",
];

export const SUBSIDIARY_ACCOUNT_HASH_FIELDS = [
  "referenceNumber",
  "accountReference",
  "iifiNumber",
  "autoSweep.bankPublicId",
  "autoSweep.destination",
  "autoSweep.accountNumber",
  "callbackUrl",
];

export const SUBSIDIARY_CHARGE_HASH_FIELDS = ["referenceNumber", "amount", "currency", "narration"];

export const SUBSIDIARY_TOPUP_HASH_FIELDS = ["referenceNumber", "amount", "currency", "narration"];

export const SUBSIDIARY_TRANSFER_HASH_FIELDS = [
  "referenceNumber",
  "sourceAccountIdentifier",
  "destinationAccountIdentifier",
  "amount",
  "currency",
  "narration",
];

export const SUBSIDIARY_RETRIEVE_HASH_FIELDS = ["referenceNumber", "accountIdentifier"];

export const SUBSIDIARY_UPDATE_HASH_FIELDS = [
  "referenceNumber",
  "accountIdentifier",
  "iifiNumber",
  "autoSweep.destination",
  "autoSweep.bankPublicId",
  "autoSweep.accountNumber",
  "callbackUrl",
];

export const SUBSIDIARY_BALANCE_HASH_FIELDS = ["referenceNumber", "accountIdentifier"];

export const SUBSIDIARY_HISTORY_HASH_FIELDS = [
  "accountIdentifier",
  "startDateTimeUTC",
  "endDateTimeUTC",
];

export const SUBSIDIARY_FUNDING_HASH_FIELDS = [
  "transactionReference",
  "transactionDate",
  "amount",
  "accountNumber",
  "timestamp",
];

export const SUBSIDIARY_OPERATION_HASH_FIELDS = [
  "externalReferenceNumber",
  "transactionDate",
  "amount",
  "accountNumber",
];

function resolveHashFieldValue(
  payload: Record<string, unknown> | null,
  path: string,
): string {
  let node: unknown = payload;
  for (const key of path.split(".")) {
    if (node === null || node === undefined) return "";
    node = (node as Record<string, unknown>)[key];
  }
  if (node === null || node === undefined) return "";
  if (typeof node === "number") return String(node);
  return String(node);
}

async function sha512Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-512", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, "0");
  }
  return hex;
}

export async function computePagaHash(
  payload: Record<string, unknown> | null,
  hashKey: string,
  fields: readonly string[] = PAYMENT_REQUEST_HASH_FIELDS,
): Promise<string> {
  const text = `${fields.map((f) => resolveHashFieldValue(payload, f)).join("")}${hashKey}`;
  return sha512Hex(text);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyPagaHash(
  payload: Record<string, unknown> | null,
  receivedHash: string | null | undefined,
  hashKey: string,
  fields?: readonly string[],
): Promise<boolean> {
  const computed = await computePagaHash(payload, hashKey, fields);
  const received = (receivedHash ?? "").toLowerCase();
  if (computed.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return diff === 0;
}
