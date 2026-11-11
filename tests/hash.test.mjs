/**
 * Hash signing tests.
 *
 * The digests in `fixtures/hash_vectors.json` are generated outside the SDK
 * (`printf '%s' "$message" | sha512sum`), so these tests pin the SDK's
 * byte-level behaviour rather than merely confirming it agrees with itself.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import {
  AIRTIME_HASH_FIELDS,
  BILL_PAYMENT_HASH_FIELDS,
  CHARGE_CALLBACK_HASH_FIELDS,
  CHARGE_MANDATE_HASH_FIELDS,
  computePagaHash,
  DISABLE_MANDATE_HASH_FIELDS,
  MANDATE_CALLBACK_HASH_FIELDS,
  MONEY_TRANSFER_HASH_FIELDS,
  PAYMENT_CALLBACK_HASH_FIELDS,
  PAYMENT_REQUEST_HASH_FIELDS,
  REFUND_HASH_FIELDS,
  SUBSIDIARY_OPERATION_HASH_FIELDS,
  verifyChargeCallback,
  verifyMandateCallback,
} from "../dist/index.js";
import { HASH_KEY, loadHashVectors } from "./helpers.mjs";

function resolve(payload, path) {
  let node = payload;
  for (const key of path.split(".")) {
    node = node && typeof node === "object" ? node[key] : undefined;
  }
  if (node === null || node === undefined) return "";
  if (typeof node === "number" && path.endsWith("Balance")) return node.toFixed(2);
  return String(node);
}

describe("hash signing", () => {
  const vectors = loadHashVectors();

  it("signs every shared vector to its recorded digest", async () => {
    for (const vector of vectors.vectors) {
      const digest = await computePagaHash(vector.payload, vectors.hashKey, vector.fields);
      assert.equal(digest, vector.digest, vector.name);
    }
  });

  it("concatenates every shared vector exactly", () => {
    for (const vector of vectors.vectors) {
      const message =
        vector.fields.map((field) => resolve(vector.payload, field)).join("") + vectors.hashKey;
      assert.equal(message, vector.message, vector.name);
      assert.equal(createHash("sha512").update(message, "utf8").digest("hex"), vector.digest);
    }
  });

  it("produces a lowercase hex SHA-512 digest", async () => {
    const vector = vectors.vectors[0];
    const digest = await computePagaHash(vector.payload, vectors.hashKey, vector.fields);
    assert.equal(digest.length, 128);
    assert.equal(digest, digest.toLowerCase());
    assert.match(digest, /^[0-9a-f]{128}$/);
  });

  it("signs a missing field as an empty string", async () => {
    const digest = await computePagaHash(
      { referenceNumber: "REF-1", amount: 100 },
      HASH_KEY,
      ["referenceNumber", "amount", "currency"],
    );
    const expected = createHash("sha512")
      .update(`REF-1100${HASH_KEY}`, "utf8")
      .digest("hex");
    assert.equal(digest, expected);
  });

  it("resolves nested field paths", async () => {
    const digest = await computePagaHash(
      { referenceNumber: "REF-1", payer: { phoneNumber: "08031234567" } },
      HASH_KEY,
      ["referenceNumber", "payer.phoneNumber"],
    );
    const expected = createHash("sha512")
      .update(`REF-108031234567${HASH_KEY}`, "utf8")
      .digest("hex");
    assert.equal(digest, expected);
  });

  it("formats a balance field to two decimals", async () => {
    const digest = await computePagaHash(
      { outstandingBalance: 1000 },
      HASH_KEY,
      ["outstandingBalance"],
    );
    const expected = createHash("sha512")
      .update(`1000.00${HASH_KEY}`, "utf8")
      .digest("hex");
    assert.equal(digest, expected);
  });

  it("signs a string amount verbatim", async () => {
    const digest = await computePagaHash({ amount: "1,000.00" }, HASH_KEY, ["amount"]);
    const expected = createHash("sha512")
      .update(`1,000.00${HASH_KEY}`, "utf8")
      .digest("hex");
    assert.equal(digest, expected);
  });

  it("changes the digest when the field order changes", async () => {
    const payload = { referenceNumber: "REF-1", amount: 100 };
    const forward = await computePagaHash(payload, HASH_KEY, ["referenceNumber", "amount"]);
    const backward = await computePagaHash(payload, HASH_KEY, ["amount", "referenceNumber"]);
    assert.notEqual(forward, backward);
  });

  it("keeps the documented hash field orders", () => {
    assert.deepEqual(PAYMENT_REQUEST_HASH_FIELDS.slice(0, 2), ["referenceNumber", "amount"]);
    assert.deepEqual(BILL_PAYMENT_HASH_FIELDS.slice(0, 3), [
      "referenceNumber",
      "amount",
      "merchantAccount",
    ]);
    assert.deepEqual(AIRTIME_HASH_FIELDS, [
      "referenceNumber",
      "amount",
      "destinationPhoneNumber",
    ]);
    assert.deepEqual(MONEY_TRANSFER_HASH_FIELDS, [
      "referenceNumber",
      "amount",
      "destinationBankUUID",
      "destinationBankAccountNumber",
    ]);
    assert.deepEqual(REFUND_HASH_FIELDS, ["referenceNumber", "refundAmount"]);
    assert.deepEqual(PAYMENT_CALLBACK_HASH_FIELDS, [
      "notificationId",
      "statusCode",
      "externalReferenceNumber",
      "state",
      "outstandingBalance",
    ]);
    assert.deepEqual(SUBSIDIARY_OPERATION_HASH_FIELDS, [
      "externalReferenceNumber",
      "transactionDate",
      "amount",
      "accountNumber",
    ]);
    assert.deepEqual(CHARGE_MANDATE_HASH_FIELDS, [
      "referenceNumber",
      "amount",
      "accountReference",
    ]);
    assert.deepEqual(DISABLE_MANDATE_HASH_FIELDS, ["referenceNumber", "accountReference"]);
  });
});

describe("direct debit callbacks", () => {
  it("verifies a mandate callback", async () => {
    const payload = {
      event: "Tokenization",
      notificationId: "NOTIF-1",
      statusCode: "004",
      statusMessage: "verified",
      mandateStatus: "VERIFIED",
      referenceNumber: "REF-9",
      accountReference: "CUST-009",
      bankName: "GTBank",
      accountNumber: "12345678901",
      timeStamp: "2026-11-03T11:02:25.123456789Z",
    };
    const digest = await computePagaHash(payload, HASH_KEY, MANDATE_CALLBACK_HASH_FIELDS);
    assert.equal(await verifyMandateCallback(payload, digest, HASH_KEY), true);
    assert.equal(await verifyMandateCallback(payload, "deadbeef", HASH_KEY), false);
  });

  it("verifies a charge callback", async () => {
    const payload = {
      event: "Charge_Complete",
      notificationId: "NOTIF-2",
      statusCode: "0",
      processStatusId: "COMPLETED",
      referenceNumber: "REF-10",
      accountReference: "CUST-010",
      amount: "600.00",
      currency: "NGN",
    };
    const digest = await computePagaHash(payload, HASH_KEY, CHARGE_CALLBACK_HASH_FIELDS);
    assert.equal(await verifyChargeCallback(payload, digest, HASH_KEY), true);
    assert.equal(await verifyChargeCallback(payload, "deadbeef", HASH_KEY), false);
  });

  it("signs the charge callback amount string verbatim", async () => {
    const payload = {
      statusCode: "0",
      referenceNumber: "REF-11",
      accountReference: "CUST-011",
      amount: "50000.00",
    };
    const digest = await computePagaHash(payload, HASH_KEY, CHARGE_CALLBACK_HASH_FIELDS);
    assert.equal(await verifyChargeCallback(payload, digest, HASH_KEY), true);
  });
});
