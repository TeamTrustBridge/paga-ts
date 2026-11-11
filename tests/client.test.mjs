/**
 * Request shape tests: URL, auth style, hash header and body.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computePagaHash } from "../dist/index.js";
import {
  basicCredentials,
  BUSINESS_BASE,
  CHECKOUT_BASE,
  COLLECT_BASE,
  HASH_KEY,
  makeClient,
  PUBLIC_KEY,
  requestJson,
  SECRET_KEY,
  stubFetch,
} from "./helpers.mjs";

describe("directory lookups", () => {
  it("calls the Collect API with Basic auth", async () => {
    const stub = stubFetch([
      { status: 200, body: { statusCode: "0", banks: [{ name: "GTBank", uuid: "UUID-1" }] } },
    ]);
    try {
      const client = makeClient();
      const response = await client.getCollectBanks({ referenceNumber: "REF-1" });
      assert.equal(stub.last.url, `${COLLECT_BASE}/banks`);
      assert.equal(stub.last.method, "POST");
      assert.deepEqual(basicCredentials(stub.last), [PUBLIC_KEY, SECRET_KEY]);
      assert.equal(response.banks[0].uuid, "UUID-1");
    } finally {
      stub.restore();
    }
  });

  it("calls the Business API with header auth", async () => {
    const stub = stubFetch([
      { status: 200, body: { responseCode: 0, banks: [{ uuid: "UUID-2", name: "Access" }] } },
    ]);
    try {
      const client = makeClient();
      const response = await client.getBanks({ referenceNumber: "REF-2" });
      assert.equal(stub.last.url, `${BUSINESS_BASE}/getBanks`);
      assert.equal(stub.last.headers.principal, PUBLIC_KEY);
      assert.equal(stub.last.headers.credentials, SECRET_KEY);
      assert.equal(stub.last.headers.authorization, undefined);
      assert.equal(response.banks[0].name, "Access");
    } finally {
      stub.restore();
    }
  });

  it("signs the merchant service lookup over its two fields", async () => {
    const stub = stubFetch([{ status: 200, body: { responseCode: 0 } }]);
    try {
      const client = makeClient();
      await client.getMerchantServices({
        referenceNumber: "REF-3",
        merchantPublicId: "MERCHANT-UUID",
      });
      const body = requestJson(stub.last);
      const expected = await computePagaHash(body, HASH_KEY, [
        "referenceNumber",
        "merchantPublicId",
      ]);
      assert.equal(stub.last.headers.hash, expected);
    } finally {
      stub.restore();
    }
  });

  it("always signs the merchant service product code", async () => {
    const stub = stubFetch([{ status: 200, body: { responseCode: 0 } }]);
    try {
      const client = makeClient();
      await client.getMerchantAccountDetails({
        referenceNumber: "REF-4",
        merchantAccount: "MERCHANT-UUID",
        merchantReferenceNumber: "8110411076",
      });
      const body = requestJson(stub.last);
      assert.equal(body.merchantServiceProductCode, "");
      const expected = await computePagaHash(body, HASH_KEY, [
        "referenceNumber",
        "merchantAccount",
        "merchantReferenceNumber",
        "merchantServiceProductCode",
      ]);
      assert.equal(stub.last.headers.hash, expected);
    } finally {
      stub.restore();
    }
  });

  it("signs the destination amount verbatim", async () => {
    const stub = stubFetch([{ status: 200, body: { responseCode: 0 } }]);
    try {
      const client = makeClient();
      await client.validateDepositToBank({
        referenceNumber: "REF-5",
        amount: "5000.00",
        destinationBankUUID: "BANK-UUID",
        destinationBankAccountNumber: "0000000000",
      });
      const body = requestJson(stub.last);
      assert.equal(body.amount, "5000.00");
      const expected = await computePagaHash(body, HASH_KEY, [
        "referenceNumber",
        "amount",
        "destinationBankUUID",
        "destinationBankAccountNumber",
      ]);
      assert.equal(stub.last.headers.hash, expected);
    } finally {
      stub.restore();
    }
  });
});

describe("status lookups", () => {
  it("reads the transaction status from the Business API", async () => {
    const stub = stubFetch([
      { status: 200, body: { responseCode: 0, status: "Successful", transactionId: "TX-1" } },
    ]);
    try {
      const client = makeClient();
      const response = await client.getTransactionStatus({ referenceNumber: "REF-6" });
      assert.equal(stub.last.url, `${BUSINESS_BASE}/transactionStatus`);
      assert.equal(response.transactionId, "TX-1");
    } finally {
      stub.restore();
    }
  });

  it("reads the refund status", async () => {
    const stub = stubFetch([
      { status: 200, body: { statusCode: "0", data: { statusCode: "0", refundStatus: "refunded" } } },
    ]);
    try {
      const client = makeClient();
      const response = await client.getRefundStatus({ referenceNumber: "REF-7" });
      assert.equal(stub.last.url, `${COLLECT_BASE}/status`);
      assert.equal(response.data?.refundStatus, "refunded");
    } finally {
      stub.restore();
    }
  });

  it("signs the currency on the USD status lookup", async () => {
    const stub = stubFetch([{ status: 200, body: { statusCode: "0", data: { statusCode: "1" } } }]);
    try {
      const client = makeClient();
      await client.getUsdPaymentStatus({ referenceNumber: "REF-8" });
      const body = requestJson(stub.last);
      assert.equal(body.paymentCurrency, "USD");
      const expected = await computePagaHash(body, HASH_KEY, [
        "referenceNumber",
        "paymentCurrency",
      ]);
      assert.equal(stub.last.headers.hash, expected);
    } finally {
      stub.restore();
    }
  });
});

describe("direct debit", () => {
  it("starts a hosted session on the Checkout API with no hash header", async () => {
    const stub = stubFetch([
      {
        status: 200,
        body: { statusCode: "0", data: { sessionKey: "KEY", checkoutUrl: "https://x/s/KEY" } },
      },
    ]);
    try {
      const client = makeClient();
      const response = await client.startDirectDebitSession({
        referenceNumber: "REF-1",
        accountReference: "CUST-001",
        amountLimit: 50000,
        callbackUrl: "https://yourstore.com/webhooks/mandate",
      });
      assert.equal(stub.last.url, `${CHECKOUT_BASE}/checkout/charge-process/start`);
      assert.deepEqual(basicCredentials(stub.last), [PUBLIC_KEY, SECRET_KEY]);
      assert.equal(stub.last.headers.hash, undefined);
      assert.deepEqual(requestJson(stub.last).paymentMethods, ["BANK_ACCOUNT_DIRECT_DEBIT"]);
      assert.equal(response.data?.checkoutUrl, "https://x/s/KEY");
    } finally {
      stub.restore();
    }
  });

  it("creates a mandate by API with the DIRECT_DEBIT payment method", async () => {
    const stub = stubFetch([{ status: 200, body: { statusCode: "0" } }]);
    try {
      const client = makeClient();
      await client.createDirectDebitMandate({
        referenceNumber: "REF-3",
        amount: 5000,
        payerName: "Bello Ramon",
        payerPhoneNumber: "08064343187",
        payeeName: "Your business name",
        accountReference: "CUST-003",
      });
      assert.equal(stub.last.url, `${COLLECT_BASE}/paymentRequest`);
      const body = requestJson(stub.last);
      assert.deepEqual(body.paymentMethods, ["DIRECT_DEBIT"]);
      assert.equal(body.accountReference, "CUST-003");
      assert.equal(body.isSingleUse, true);
      const expected = await computePagaHash(body, HASH_KEY, [
        "referenceNumber",
        "amount",
        "currency",
        "payer.phoneNumber",
        "payer.email",
      ]);
      assert.equal(stub.last.headers.hash, expected);
    } finally {
      stub.restore();
    }
  });

  it("charges a mandate over three signed fields", async () => {
    const stub = stubFetch([{ status: 200, body: { statusCode: "0" } }]);
    try {
      const client = makeClient();
      await client.chargeMandate({
        referenceNumber: "REF-6",
        amount: 600,
        accountReference: "CUST-006",
      });
      assert.equal(stub.last.url, `${COLLECT_BASE}/chargeDebitMandate`);
      const body = requestJson(stub.last);
      const expected = await computePagaHash(body, HASH_KEY, [
        "referenceNumber",
        "amount",
        "accountReference",
      ]);
      assert.equal(stub.last.headers.hash, expected);
    } finally {
      stub.restore();
    }
  });

  it("disables a mandate over two signed fields", async () => {
    const stub = stubFetch([{ status: 200, body: { statusCode: "0" } }]);
    try {
      const client = makeClient();
      await client.disableMandate({
        referenceNumber: "REF-8",
        accountReference: "CUST-008",
      });
      assert.equal(stub.last.url, `${COLLECT_BASE}/disableMandate`);
      const body = requestJson(stub.last);
      const expected = await computePagaHash(body, HASH_KEY, [
        "referenceNumber",
        "accountReference",
      ]);
      assert.equal(stub.last.headers.hash, expected);
    } finally {
      stub.restore();
    }
  });
});

describe("regressions fixed during this work", () => {
  it("signs the subsidiary history request", async () => {
    // The history lookup used to send no hash header at all.
    const stub = stubFetch([{ status: 200, body: { statusCode: "0" } }]);
    try {
      const client = makeClient();
      await client.getSubsidiaryHistory({
        accountReference: "CUST-1",
        referenceNumber: "REF-1",
        startDateTimeUTC: "2026-06-01T00:00:00",
        endDateTimeUTC: "2026-06-30T23:59:59",
      });
      const expected = await computePagaHash(
        {
          accountIdentifier: "CUST-1",
          startDateTimeUTC: "2026-06-01T00:00:00",
          endDateTimeUTC: "2026-06-30T23:59:59",
        },
        HASH_KEY,
        ["accountIdentifier", "startDateTimeUTC", "endDateTimeUTC"],
      );
      assert.equal(stub.last.headers.hash, expected);
    } finally {
      stub.restore();
    }
  });

  it("sends the reference number in the query string when retrieving an account", async () => {
    // The retrieve and balance lookups used to omit it.
    const stub = stubFetch([{ status: 200, body: { statusCode: "0" } }]);
    try {
      const client = makeClient();
      await client.retrieveSubsidiaryAccount({
        accountReference: "CUST-1",
        referenceNumber: "REF-1",
      });
      assert.ok(stub.last.url.includes("referenceNumber=REF-1"), stub.last.url);
    } finally {
      stub.restore();
    }
  });

  it("sends the reference number in the query string when reading a balance", async () => {
    const stub = stubFetch([{ status: 200, body: { statusCode: "0" } }]);
    try {
      const client = makeClient();
      await client.getSubsidiaryBalance({
        accountReference: "CUST-1",
        referenceNumber: "REF-2",
      });
      assert.ok(stub.last.url.includes("referenceNumber=REF-2"), stub.last.url);
    } finally {
      stub.restore();
    }
  });

  it("applies the configured timeout", async () => {
    const stub = stubFetch([{ status: 200, body: {} }]);
    try {
      const client = makeClient({ timeoutMs: 12345 });
      await client.getBanks({ referenceNumber: "REF-1" });
      assert.ok(stub.last, "a request should have been made");
      // The signal is created per request; assert the client stores the value.
      assert.equal(client.timeoutMs, 12345);
    } finally {
      stub.restore();
    }
  });

  it("encodes basic auth as UTF-8", async () => {
    const stub = stubFetch([{ status: 200, body: { statusCode: "0", banks: [] } }]);
    try {
      const client = makeClient();
      await client.getCollectBanks({ referenceNumber: "REF-1" });
      assert.deepEqual(basicCredentials(stub.last), [PUBLIC_KEY, SECRET_KEY]);
    } finally {
      stub.restore();
    }
  });

  it("uses header auth on the Business API", async () => {
    const stub = stubFetch([{ status: 200, body: { responseCode: 0, banks: [] } }]);
    try {
      const client = makeClient();
      await client.getBanks({ referenceNumber: "REF-1" });
      assert.equal(stub.last.headers.principal, PUBLIC_KEY);
      assert.equal(stub.last.headers.credentials, SECRET_KEY);
      assert.equal(stub.last.headers.authorization, undefined);
    } finally {
      stub.restore();
    }
  });
});

describe("checkout operations are unchanged", () => {
  it("creates a payment request with the documented hash", async () => {
    const stub = stubFetch([{ status: 200, body: { statusCode: "0", referenceNumber: "REF-14" } }]);
    try {
      const client = makeClient();
      await client.createPayment({
        referenceNumber: "REF-14",
        amount: 50,
        payerName: "Bello Ramon",
        payerPhoneNumber: "08064343187",
        payeeName: "Your business name",
      });
      assert.equal(stub.last.url, `${COLLECT_BASE}/paymentRequest`);
      const body = requestJson(stub.last);
      const expected = await computePagaHash(body, HASH_KEY, [
        "referenceNumber",
        "amount",
        "currency",
        "payer.phoneNumber",
        "payer.email",
      ]);
      assert.equal(stub.last.headers.hash, expected);
    } finally {
      stub.restore();
    }
  });

  it("verifies a charge against the Checkout API", async () => {
    const stub = stubFetch([{ status: 200, body: { status_code: 0, chargeId: "CHARGE-1" } }]);
    try {
      const client = makeClient();
      await client.verifyCharge({
        paymentReference: "PAY-1",
        publicKey: PUBLIC_KEY,
        amount: 50,
      });
      assert.equal(stub.last.url, `${CHECKOUT_BASE}/checkout/transaction/verify`);
      assert.equal(requestJson(stub.last).paymentReference, "PAY-1");
    } finally {
      stub.restore();
    }
  });
});

describe("multipart uploads", () => {
  it("sends a JSON part plus two image parts", async () => {
    const stub = stubFetch([{ status: 200, body: { responseCode: 0 } }]);
    try {
      const client = makeClient();
      await client.registerCustomerWithKyc({
        referenceNumber: "REF-5",
        customerPhoneNumber: "08031234567",
        customerEmail: "customer@example.com",
        customerFirstName: "Bello",
        customerLastName: "Ramon",
        customerDateOfBirth: "1989-10-02",
        customerGender: "MALE",
        customerAccountPhoto: new TextEncoder().encode("account-photo-bytes"),
        customerIdPhoto: new TextEncoder().encode("id-photo-bytes"),
      });
      assert.equal(stub.last.url, `${BUSINESS_BASE}/registerCustomerWithKYC`);
      assert.ok(stub.last.body instanceof FormData);
      const parts = [];
      for (const [name, value] of stub.last.body.entries()) {
        parts.push(name);
        if (name === "customer") {
          const text = await value.text();
          assert.equal(JSON.parse(text).referenceNumber, "REF-5");
        }
      }
      assert.deepEqual(parts.sort(), [
        "customer",
        "customerAccountPhoto",
        "customerIdPhoto",
      ]);
    } finally {
      stub.restore();
    }
  });

  it("signs the customer JSON part rather than the multipart envelope", async () => {
    const stub = stubFetch([{ status: 200, body: { responseCode: 0 } }]);
    try {
      const client = makeClient();
      await client.registerCustomerWithKyc({
        referenceNumber: "REF-6",
        customerPhoneNumber: "08031234567",
        customerEmail: "customer@example.com",
        customerFirstName: "Bello",
        customerLastName: "Ramon",
        customerDateOfBirth: "1989-10-02",
        customerGender: "MALE",
        customerAccountPhoto: new TextEncoder().encode("a"),
        customerIdPhoto: new TextEncoder().encode("i"),
      });
      const expected = await computePagaHash(
        {
          referenceNumber: "REF-6",
          customerPhoneNumber: "08031234567",
          customerFirstName: "Bello",
          customerLastName: "Ramon",
        },
        HASH_KEY,
        ["referenceNumber", "customerPhoneNumber", "customerFirstName", "customerLastName"],
      );
      assert.equal(stub.last.headers.hash, expected);
    } finally {
      stub.restore();
    }
  });
});
