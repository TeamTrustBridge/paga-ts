# paga-ts

**Async TypeScript SDK for the [Paga Engine API](https://developer-docs.paga.com/).**

`paga-ts` makes the Paga developer workflow easy for page and integration
developers building checkout and payment experiences. It wraps every Paga Engine
endpoint — payments, refunds, money transfers, airtime, bill payments, subsidiary
accounts, and business account operations — behind a single, fully async client.

The Python (`paga-python`) and Rust (`paga-rs`) counterparts are in the pipeline.

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

## Installation

```bash
npm install paga-ts
```

Requires Node.js 20+.

## Quick start

```ts
import { PagaClient } from "paga-ts";

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
| Money transfer | Send money | `sendMoney` | `POST /depositToBank` |
| Airtime & data | Buy airtime / data | `buyAirtime` | `POST /airtimePurchase` |
| Bill payment | Pay bill | `payBill` | `POST /merchantPayment` |
| Business | Check balance | `getBusinessBalance` | `POST /accountBalance` |
| Business | Transaction history | `getBusinessTransactions` | `POST /transactionHistory` |
| Subsidiary accounts | Create account | `createSubsidiaryAccount` | `POST /subsidiary-accounts` |
| Subsidiary accounts | Charge account | `chargeSubsidiaryAccount` | `POST /subsidiary-accounts/{accountReference}/charge` |
| Subsidiary accounts | Top up account | `topUpSubsidiaryAccount` | `POST /subsidiary-accounts/{accountReference}/topup` |
| Subsidiary accounts | Transfer between accounts | `transferBetweenSubsidiaryAccounts` | `POST /subsidiary-accounts/transfer` |
| Subsidiary accounts | Retrieve account | `retrieveSubsidiaryAccount` | `GET /subsidiary-accounts/{accountReference}` |
| Subsidiary accounts | Update account | `updateSubsidiaryAccount` | `PUT /subsidiary-accounts/{accountReference}` |
| Subsidiary accounts | Get balance | `getSubsidiaryBalance` | `GET /subsidiary-accounts/{accountReference}/balance` |
| Subsidiary accounts | History | `getSubsidiaryHistory` | `GET /subsidiary-accounts/{accountReference}/history` |

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
import { verifyCheckoutNotification, verifyPaymentCallback, verifyFundingNotification, verifySubsidiaryOperation } from "paga-ts";

// Checkout notification: hash = amount + timeStamp + paymentReference + hashKey
const ok = await verifyCheckoutNotification(payload, receivedHash, hashKey);

// Dynamic virtual account callback: hash = notificationId + statusCode + externalReferenceNumber + state + outstandingBalance + hashKey
const ok2 = await verifyPaymentCallback(payload, receivedHash, hashKey);

// Subsidiary funding notification: hash = transactionReference + transactionDate + amount + accountNumber + timestamp + hashKey
const ok3 = await verifyFundingNotification(payload, receivedHash, hashKey);

// Subsidiary charge / top-up / transfer callback: hash = externalReferenceNumber + transactionDate + amount + accountNumber + hashKey
const ok4 = await verifySubsidiaryOperation(payload, receivedHash, hashKey);
```

## Error handling

```ts
import { PagaError, PagaAuthenticationError, PagaRateLimitError, PagaAPIError } from "paga-ts";

try {
  const payment = await client.createPayment({ ... });
} catch (err) {
  if (err instanceof PagaAuthenticationError) {
    // invalid credentials
  } else if (err instanceof PagaRateLimitError) {
    // 429 from Paga
  } else if (err instanceof PagaAPIError) {
    // err.statusCode, err.responseCode, err.message
  } else if (err instanceof PagaError) {
    // unknown
  }
}
```

## License

GPL-3.0 — see [LICENSE](LICENSE).
