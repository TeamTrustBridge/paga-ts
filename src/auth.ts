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

/* -------------------------------------------------------------------------- */
/* Directory lookups                                                          */
/* -------------------------------------------------------------------------- */

/** Bank USSD - Get the customer's bank. */
export const COLLECT_BANKS_HASH_FIELDS = ["referenceNumber"];

/** Money transfer - Get the bank's UUID. */
export const BANKS_HASH_FIELDS = ["referenceNumber"];

/** Airtime and data - Get the mobile operator. */
export const MOBILE_OPERATORS_HASH_FIELDS = ["referenceNumber"];

/** Airtime and data - For data, pick a bundle. */
export const DATA_BUNDLE_HASH_FIELDS = ["referenceNumber", "operatorPublicId"];

/** Bill payment - Find the biller. */
export const MERCHANTS_HASH_FIELDS = ["referenceNumber"];

/** Bill payment - Pick the service. */
export const MERCHANT_SERVICES_HASH_FIELDS = ["referenceNumber", "merchantPublicId"];

/** Bill payment - Validate the customer. */
export const MERCHANT_ACCOUNT_DETAILS_HASH_FIELDS = [
  "referenceNumber",
  "merchantAccount",
  "merchantReferenceNumber",
  "merchantServiceProductCode",
];

/** Money transfer - Validate the account. */
export const VALIDATE_DEPOSIT_TO_BANK_HASH_FIELDS = [
  "referenceNumber",
  "amount",
  "destinationBankUUID",
  "destinationBankAccountNumber",
];

/* -------------------------------------------------------------------------- */
/* Status lookups                                                             */
/* -------------------------------------------------------------------------- */

/** Money transfer / Airtime / Bill payment - Check the transaction status. */
export const TRANSACTION_STATUS_HASH_FIELDS = ["referenceNumber"];

/** Your business account - Get your recent transactions. */
export const RECENT_TRANSACTION_HISTORY_HASH_FIELDS = ["referenceNumber"];

/** USD bank transfer - Check payment status. Signs the currency too. */
export const USD_PAYMENT_STATUS_HASH_FIELDS = ["referenceNumber", "paymentCurrency"];

/* -------------------------------------------------------------------------- */
/* Direct Debit                                                               */
/* -------------------------------------------------------------------------- */

/** Direct Debit - Charge the mandate. */
export const CHARGE_MANDATE_HASH_FIELDS = ["referenceNumber", "amount", "accountReference"];

/** Direct Debit - Disable a mandate. */
export const DISABLE_MANDATE_HASH_FIELDS = ["referenceNumber", "accountReference"];

/** Direct Debit - Check charge status. */
export const CHARGE_MANDATE_STATUS_HASH_FIELDS = ["referenceNumber"];

/** Direct Debit - Check mandate status. */
export const MANDATE_STATUS_HASH_FIELDS = ["referenceNumber"];

/** Direct Debit mandate callback. The timeStamp keeps its nanoseconds. */
export const MANDATE_CALLBACK_HASH_FIELDS = [
  "statusCode",
  "timeStamp",
  "accountNumber",
  "bankName",
  "referenceNumber",
  "mandateStatus",
];

/** Direct Debit charge callback. The amount keeps two decimals, no commas. */
export const CHARGE_CALLBACK_HASH_FIELDS = [
  "statusCode",
  "referenceNumber",
  "accountReference",
  "amount",
];

/* -------------------------------------------------------------------------- */
/* Persistent payment accounts                                                */
/* -------------------------------------------------------------------------- */

/** Collect API - Register a persistent payment account. */
export const REGISTER_PERSISTENT_ACCOUNT_HASH_FIELDS = [
  "referenceNumber",
  "accountReference",
  "financialIdentificationNumber",
  "creditBankId",
  "creditBankAccountNumber",
  "callbackUrl",
];

/** Collect API - Delete a persistent payment account. */
export const DELETE_PERSISTENT_ACCOUNT_HASH_FIELDS = ["referenceNumber", "accountIdentifier"];

/** Collect API - Update a persistent payment account. */
export const UPDATE_PERSISTENT_ACCOUNT_HASH_FIELDS = [
  "referenceNumber",
  "accountIdentifier",
  "financialIdentificationNumber",
  "creditBankId",
  "creditBankAccountNumber",
  "callbackUrl",
];

/** Collect API - Get a persistent payment account. */
export const GET_PERSISTENT_ACCOUNT_HASH_FIELDS = ["referenceNumber", "accountIdentifier"];

/** Collect API - Payment request history. */
export const HISTORY_HASH_FIELDS = ["referenceNumber"];

/* -------------------------------------------------------------------------- */
/* Customer registration                                                       */
/* -------------------------------------------------------------------------- */

/** Business API - Register a customer. */
export const CUSTOMER_HASH_FIELDS = [
  "referenceNumber",
  "customerPhoneNumber",
  "customerFirstName",
  "customerLastName",
];

/** Business API - Register a customer account photo. */
export const CUSTOMER_ACCOUNT_PHOTO_HASH_FIELDS = ["referenceNumber", "customerPhoneNumber"];

/** Business API - Register a customer identification. */
export const CUSTOMER_IDENTIFICATION_HASH_FIELDS = [
  "referenceNumber",
  "customerPhoneNumber",
  "customerIdType",
  "customerIdNumber",
  "customerIdExpirationDate",
];

/* -------------------------------------------------------------------------- */
/* Additional Business API operations                                         */
/* -------------------------------------------------------------------------- */

/** Business API - Money transfer to a Paga wallet. */
export const PAGA_WALLET_TRANSFER_HASH_FIELDS = ["referenceNumber", "amount", "destinationAccount"];

/** Business API - Validate a money transfer. */
export const VALIDATE_MONEY_TRANSFER_HASH_FIELDS = [
  "referenceNumber",
  "amount",
  "destinationAccount",
];

/**
 * Business API - Bulk money transfer.
 *
 * The hash covers the first item's fields plus the total number of items.
 */
export const MONEY_TRANSFER_BULK_HASH_FIELDS = [
  "referenceNumber",
  "amount",
  "destinationAccount",
  "itemCount",
];

/** Business API - Get an operation's status. */
export const GET_OPERATION_STATUS_HASH_FIELDS = ["referenceNumber"];

/** Business API - Onboard a merchant. */
export const ONBOARD_MERCHANT_HASH_FIELDS = [
  "referenceNumber",
  "merchantExternalId",
  "name",
  "phone",
  "email",
];

/** Business API - Dispense cash. */
export const DISPENSE_CASH_HASH_FIELDS = [
  "referenceNumber",
  "customerPhoneNumber",
  "amount",
  "withdrawalCode",
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
  if (typeof node === "number") {
    // Money fields carried as numbers are signed with two decimals and no
    // separators, matching Paga's "#.00" formatting.
    if (path.endsWith("Balance")) return node.toFixed(2);
    return String(node);
  }
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
