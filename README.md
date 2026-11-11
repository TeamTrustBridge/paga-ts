# paga-ts

**Async TypeScript SDK for the [Paga Engine API](https://developer-docs.paga.com/).**

> **This is an unofficial SDK.** It is not built, endorsed, supported or
> published by Paga. It is community-maintained and follows Paga's published
> API reference. Paga's own documentation is the source of truth — if this
> documentation and Paga's disagree, Paga's is right.

> **Documentation:** <https://teamtrustbridge.github.io/paga-ts-docs/> — the full
> TypeScript API reference, organised like Paga's own documentation. Source:
> [TeamTrustBridge/paga-ts-docs](https://github.com/TeamTrustBridge/paga-ts-docs).

`paga-ts` makes the Paga developer workflow easy for page and integration
developers building checkout and payment experiences. It wraps the Paga Engine
API — payments, refunds, money transfers, airtime, bill payments, Direct Debit,
subsidiary accounts and business account operations — behind a single, fully
async client.

The Python (`paga-python`) and Rust (`paga-rs`) counterparts live in the same
organisation and track the same operation set.

## Features

- **Async all the way through** — native `async`/`await` methods built on the
  Fetch API.
- **Simple interface** — every operation takes plain typed parameters; no raw JSON
  payloads needed.
- **Built-in Paga hash signing** — SHA-512 request hashing with the same hash field
  order as the other SDKs, plus webhook signature verification helpers.
- **Typed responses** — response types for every endpoint.
- **Typed errors** — `PagaError`, `PagaAuthenticationError`, `PagaAPIError`,
  `PagaRateLimitError`.
- **Typed status codes** — `CollectStatusCode` and `BusinessErrorCode` enums, plus
  `classify()` to turn a response into a `SUCCESS` / `PENDING` / `PARTIAL` /
  `FAILED` / `UNKNOWN` outcome.
- **Unknown-outcome detection** — Paga's `-1`, `105` and `135` mean *unknown*, not
  *failed*. `PagaAPIError.isUnknownOutcome` tells you when to check the transaction
  status instead of resending.

> Paga requires your server's IP address to be whitelisted before any call will
> succeed. A 403 usually means the IP is not on the list.

## Installation

```bash
npm install paga-ts
```

The package is published as `paga-ts`. To import it as `paga`, alias it in
your `package.json`:

```json
{
  "dependencies": {
    "paga": "npm:paga-ts@^0.1.0"
  }
}
```

Then import it by the short name:

```ts
import { PagaClient } from "paga";
```

Requires Node.js 20+.

## Quick start

```ts
import { PagaClient } from "paga";

const client = new PagaClient(
  process.env.PAGA_PUBLIC_KEY!,
  process.env.PAGA_SECRET_KEY!,
  process.env.PAGA_HASH_KEY!,
  { environment: "test" }, // or "live"
);

const payment = await client.createPayment({
  referenceNumber: "ORD-2026-0187",
  amount: 50,
  payerName: "Bello Ramon",
  payerPhoneNumber: "08064343187",
  payeeName: "Your business name",
  callBackUrl: "https://yourstore.com/webhooks/paga",
  paymentMethods: ["BANK_TRANSFER"],
});

const status = await client.getPaymentStatus({ referenceNumber: "ORD-2026-0187" });
// status.data?.statusCode -> "0" means paid
```

## Supported operations

| Area | Operation | Method | Endpoint |
|---|---|---|---|
| Checkout | Create payment request | `createPayment` | `POST /paymentRequest` |
| Checkout | Check payment status | `getPaymentStatus` | `POST /status` |
| Checkout | Verify charge | `verifyCharge` | `POST /checkout/transaction/verify` |
| Refunds | Refund / cancel | `refundPayment` | `POST /refund/v2` |
| Refunds | Check refund status | `getRefundStatus` | `POST /status` |
| Bank USSD | List customer's banks | `getCollectBanks` | `POST /banks` |
| Direct Debit | Start hosted set-up session | `startDirectDebitSession` | `POST /checkout/charge-process/start` |
| Direct Debit | Set up a mandate by API | `createDirectDebitMandate` | `POST /paymentRequest` |
| Direct Debit | Check mandate status | `getMandateStatus` | `POST /status` |
| Direct Debit | Charge the mandate | `chargeMandate` | `POST /chargeDebitMandate` |
| Direct Debit | Check charge status | `getChargeMandateStatus` | `POST /getChargeMandateStatus` |
| Direct Debit | Disable a mandate | `disableMandate` | `POST /disableMandate` |
| USD collection | Check payment status | `getUsdPaymentStatus` | `POST /status` |
| Money transfer | List institutions | `getBanks` | `POST /getBanks` |
| Money transfer | Validate the account | `validateDepositToBank` | `POST /validateDepositToBank` |
| Money transfer | Send money to a bank account | `sendMoney` | `POST /depositToBank` |
| Money transfer | Send money to a Paga wallet | `transferToPagaWallet` | `POST /moneyTransfer` |
| Money transfer | Validate a Paga wallet transfer | `validateMoneyTransfer` | `POST /validateMoneyTransfer` |
| Money transfer | Bulk money transfer | `sendBulkMoneyTransfer` | `POST /moneyTransferBulk` |
| Money transfer | Check transaction status | `getTransactionStatus` | `POST /transactionStatus` |
| Airtime & data | List operators | `getMobileOperators` | `POST /getMobileOperators` |
| Airtime & data | List data bundles | `getDataBundles` | `POST /getDataBundleByOperator` |
| Airtime & data | Buy airtime / data | `buyAirtime` | `POST /airtimePurchase` |
| Bill payment | List billers | `getMerchants` | `POST /getMerchants` |
| Bill payment | List a biller's services | `getMerchantServices` | `POST /getMerchantServices` |
| Bill payment | Validate the customer | `getMerchantAccountDetails` | `POST /getMerchantAccountDetails` |
| Bill payment | Pay bill | `payBill` | `POST /merchantPayment` |
| Business | Check balance | `getBusinessBalance` | `POST /accountBalance` |
| Business | Transaction history | `getBusinessTransactions` | `POST /transactionHistory` |
| Business | Recent transactions | `getRecentTransactions` | `POST /recentTransactionHistory` |
| Business | Operation status | `getOperationStatus` | `POST /getOperationStatus` |
| Business | Onboard a merchant | `onboardMerchant` | `POST /onboardMerchant` |
| Business | Dispense cash | `dispenseCash` | `POST /dispenseCash` |
| Subsidiary accounts | Create account | `createSubsidiaryAccount` | `POST /subsidiary-accounts` |
| Subsidiary accounts | Charge account | `chargeSubsidiaryAccount` | `POST /subsidiary-accounts/{accountReference}/charge` |
| Subsidiary accounts | Top up account | `topUpSubsidiaryAccount` | `POST /subsidiary-accounts/{accountReference}/topup` |
| Subsidiary accounts | Transfer between accounts | `transferBetweenSubsidiaryAccounts` | `POST /subsidiary-accounts/transfer` |
| Subsidiary accounts | Retrieve account | `retrieveSubsidiaryAccount` | `GET /subsidiary-accounts/{accountReference}` |
| Subsidiary accounts | Update account | `updateSubsidiaryAccount` | `PUT /subsidiary-accounts/{accountReference}` |
| Subsidiary accounts | Get balance | `getSubsidiaryBalance` | `GET /subsidiary-accounts/{accountReference}/balance` |
| Subsidiary accounts | History | `getSubsidiaryHistory` | `GET /subsidiary-accounts/{accountReference}/history` |
| Persistent accounts | Register | `registerPersistentPaymentAccount` | `POST /registerPersistentPaymentAccount` |
| Persistent accounts | Update | `updatePersistentPaymentAccount` | `POST /updatePersistentPaymentAccount` |
| Persistent accounts | Get | `getPersistentPaymentAccount` | `POST /getPersistentPaymentAccount` |
| Persistent accounts | Delete | `deletePersistentPaymentAccount` | `POST /deletePersistentPaymentAccount` |
| Payment history | Request history | `getPaymentRequestHistory` | `POST /history` |
| Customers | Register | `registerCustomer` | `POST /registerCustomer` |
| Customers | Register with KYC | `registerCustomerWithKyc` | `POST /registerCustomerWithKYC` |
| Customers | Upload account photo | `registerCustomerAccountPhoto` | `POST /registerCustomerAccountPhoto` |
| Customers | Upload identification | `registerCustomerIdentification` | `POST /registerCustomerIdentification` |

## Usage

All operations take simple typed parameters — no raw JSON payloads needed.

### Create a payment request

```ts
const payment = await client.createPayment({
  referenceNumber: "ORD-2026-0187",
  amount: 50,
  payerName: "Bello Ramon",
  payerPhoneNumber: "08064343187",
  payeeName: "Your business name",
  callBackUrl: "https://yourstore.com/webhooks/paga",
  paymentMethods: ["BANK_TRANSFER"],
});
```

### Check payment status

```ts
const status = await client.getPaymentStatus({ referenceNumber: "ORD-2026-0187" });
// status.data?.statusCode -> "0" means paid
```

### Refund / cancel a payment request

```ts
const refund = await client.refundPayment({
  referenceNumber: "RFD-2026-0031",
  paymentRequestReference: "ORD-2026-0187",
  refundAmount: 1000,
  currency: "NGN",
  reason: "Item out of stock",
});
// refund.statusCode -> "102" means duplicate reference (no double refund)
```

## Webhook verification

```ts
import {
  parseUsdPaymentWebhook,
  verifyChargeCallback,
  verifyCheckoutNotification,
  verifyFundingNotification,
  verifyMandateCallback,
  verifyMoneyTransferNotification,
  verifyPaymentCallback,
  verifyPersistentPaymentAccountCallback,
  verifySubsidiaryOperation,
} from "paga";

// Checkout notification: hash = amount + timeStamp + paymentReference + hashKey
const ok = await verifyCheckoutNotification(payload, receivedHash, hashKey);

// Dynamic virtual account callback: hash = notificationId + statusCode + externalReferenceNumber + state + outstandingBalance + hashKey
const ok2 = await verifyPaymentCallback(payload, receivedHash, hashKey);

// Subsidiary funding notification: hash = transactionReference + transactionDate + amount + accountNumber + timestamp + hashKey
const ok3 = await verifyFundingNotification(payload, receivedHash, hashKey);

// Subsidiary charge / top-up / transfer callback: hash = externalReferenceNumber + transactionDate + amount + accountNumber + hashKey
const ok4 = await verifySubsidiaryOperation(payload, receivedHash, hashKey);

// Money transfer notification: the digest arrives in the x-paga-hash HEADER,
// not the body. hash = referenceNumber + transactionDate + transactionId + amount + sessionId
const ok5 = await verifyMoneyTransferNotification(payload, request.headers["x-paga-hash"], hashKey);

// Direct Debit mandate callback: hash = statusCode + timeStamp + accountNumber + bankName + referenceNumber + mandateStatus
const ok6 = await verifyMandateCallback(payload, payload.hash, hashKey);

// Direct Debit charge callback: hash = statusCode + referenceNumber + accountReference + amount
const ok7 = await verifyChargeCallback(payload, payload.hash, hashKey);

// Persistent payment account callback: hash = statusCode + accountNumber + amount + clearingFeeAmount + transferFeeAmount
const ok8 = await verifyPersistentPaymentAccountCallback(payload, payload.hash, hashKey);
```

The USD (ACH, Wire and Swift) webhook carries **no signature at all**, so there
is nothing to verify — parse it and de-duplicate on `referenceNumber` plus
`paymentId`:

```ts
const webhook = parseUsdPaymentWebhook(payload);
if (webhook.event === "CAPTURED") { /* fulfil */ }
```

## Error handling

```ts
import { PagaError, PagaAuthenticationError, PagaRateLimitError, PagaAPIError } from "paga";

try {
  const payment = await client.createPayment({ ... });
} catch (err) {
  if (err instanceof PagaAuthenticationError) {
    // invalid credentials, or a non-whitelisted IP
  } else if (err instanceof PagaRateLimitError) {
    // 429 from Paga
  } else if (err instanceof PagaAPIError) {
    // err.statusCode, err.responseCode, err.code, err.outcome
  } else if (err instanceof PagaError) {
    // unknown
  }
}
```

A 200 response does not mean the money moved. Read the code in the body:

```ts
import { classify, isUnknownOutcome, OperationOutcome } from "paga";

const status = await client.getTransactionStatus({ referenceNumber: "PAY-2026-0311" });
if (classify(status) === OperationOutcome.SUCCESS) {
  // settled
}
```

When the outcome is **unknown** — Paga's `-1`, `105` and `135`, a timeout or a
504 — do not send again. Check the transaction status with the *original*
reference number:

```ts
if (isUnknownOutcome(body)) {
  const final = await client.getTransactionStatus({ referenceNumber: originalReference });
}
```

## License

GPL-3.0 — see [LICENSE](LICENSE).
