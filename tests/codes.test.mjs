/**
 * Status code and outcome classification tests.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BusinessErrorCode,
  ChargeStatusCode,
  classify,
  CollectStatusCode,
  isUnknownOutcome,
  MandateProcessStatus,
  MandateStatusCode,
  OperationOutcome,
  PagaAPIError,
  resolveBusinessCode,
  resolveCollectStatus,
} from "../dist/index.js";

describe("code resolution", () => {
  it("resolves the Collect status codes", () => {
    assert.equal(resolveCollectStatus({ statusCode: "0" }), CollectStatusCode.SUCCESS);
    assert.equal(resolveCollectStatus({ statusCode: "1" }), CollectStatusCode.IN_PROCESS);
    assert.equal(resolveCollectStatus({ statusCode: "2" }), CollectStatusCode.PARTIAL_PAYMENT);
    assert.equal(resolveCollectStatus({ statusCode: "-1" }), CollectStatusCode.SYSTEM_ERROR);
    assert.equal(resolveCollectStatus({ statusCode: "-2" }), CollectStatusCode.REQUEST_EXPIRED);
    assert.equal(resolveCollectStatus({ statusCode: "-3" }), CollectStatusCode.REQUEST_CANCELLED);
    assert.equal(resolveCollectStatus({ statusCode: "114" }), CollectStatusCode.FAILED);
    assert.equal(resolveCollectStatus({ statusCode: "115" }), CollectStatusCode.FAILED_NON_REFUNDABLE);
    assert.equal(resolveCollectStatus({ statusCode: "121" }), CollectStatusCode.NOT_FOUND);
  });

  it("accepts an integer status code", () => {
    assert.equal(resolveCollectStatus({ statusCode: 0 }), CollectStatusCode.SUCCESS);
  });

  it("returns undefined for an unrecognised status code", () => {
    assert.equal(resolveCollectStatus({ statusCode: "999" }), undefined);
  });

  it("resolves the Business error codes", () => {
    assert.equal(resolveBusinessCode({ responseCode: 0 }), BusinessErrorCode.SUCCESS);
    assert.equal(resolveBusinessCode({ responseCode: 3 }), BusinessErrorCode.PENDING);
    assert.equal(resolveBusinessCode({ responseCode: -1 }), BusinessErrorCode.UNKNOWN_ERROR);
    assert.equal(resolveBusinessCode({ responseCode: 105 }), BusinessErrorCode.DUPLICATE_REFERENCE);
    assert.equal(resolveBusinessCode({ responseCode: 135 }), BusinessErrorCode.UNKNOWN_REFERENCE_NUMBER);
    assert.equal(resolveBusinessCode({ responseCode: 139 }), BusinessErrorCode.INSUFFICIENT_BALANCE);
  });
});

describe("outcome classification", () => {
  const cases = [
    [{ statusCode: "0" }, OperationOutcome.SUCCESS],
    [{ statusCode: "1" }, OperationOutcome.PENDING],
    [{ statusCode: "2" }, OperationOutcome.PARTIAL],
    [{ statusCode: "-1" }, OperationOutcome.UNKNOWN],
    [{ statusCode: "-2" }, OperationOutcome.FAILED],
    [{ statusCode: "-3" }, OperationOutcome.FAILED],
    [{ statusCode: "114" }, OperationOutcome.FAILED],
    [{ statusCode: "121" }, OperationOutcome.FAILED],
    [{ responseCode: 0 }, OperationOutcome.SUCCESS],
    [{ responseCode: 1 }, OperationOutcome.SUCCESS],
    [{ responseCode: 3 }, OperationOutcome.PENDING],
    [{ responseCode: -1 }, OperationOutcome.UNKNOWN],
    [{ responseCode: 105 }, OperationOutcome.UNKNOWN],
    [{ responseCode: 135 }, OperationOutcome.UNKNOWN],
    [{ responseCode: 2 }, OperationOutcome.FAILED],
    [{ responseCode: 139 }, OperationOutcome.FAILED],
    [{ responseCode: -2 }, OperationOutcome.FAILED],
  ];

  for (const [body, expected] of cases) {
    it(`classifies ${JSON.stringify(body)} as ${expected}`, () => {
      assert.equal(classify(body), expected);
    });
  }

  it("treats a body with no code as unknown", () => {
    assert.equal(classify({ message: "ok" }), OperationOutcome.UNKNOWN);
    assert.equal(classify(undefined), OperationOutcome.UNKNOWN);
  });

  it("classifies the snake_case checkout verify envelope", () => {
    // The Checkout API spells its code `status_code`, unlike the rest of
    // Paga's camelCase envelopes.
    assert.equal(classify({ status_code: 0 }), OperationOutcome.SUCCESS);
    assert.equal(classify({ status_code: 2 }), OperationOutcome.PENDING);
    assert.equal(classify({ status_code: 1 }), OperationOutcome.FAILED);
  });

  it("flags the unknown outcome codes", () => {
    assert.equal(isUnknownOutcome({ responseCode: -1 }), true);
    assert.equal(isUnknownOutcome({ responseCode: 105 }), true);
    assert.equal(isUnknownOutcome({ responseCode: 135 }), true);
    assert.equal(isUnknownOutcome({ responseCode: 139 }), false);
  });
});

describe("errors", () => {
  it("carries the resolved code and the outcome", () => {
    const error = new PagaAPIError("Duplicate reference", {
      responseCode: 105,
      payload: { responseCode: 105, message: "Duplicate reference" },
    });
    assert.equal(error.code, BusinessErrorCode.DUPLICATE_REFERENCE);
    assert.equal(error.outcome, OperationOutcome.UNKNOWN);
    assert.equal(error.isUnknownOutcome, true);
  });

  it("still constructs without a payload", () => {
    const error = new PagaAPIError("boom");
    assert.equal(error.code, undefined);
    assert.equal(error.outcome, OperationOutcome.UNKNOWN);
  });
});

describe("direct debit vocabularies", () => {
  it("exposes the documented values", () => {
    assert.equal(MandateStatusCode.APPROVED, "0");
    assert.equal(MandateStatusCode.VERIFIED, "004");
    assert.equal(MandateProcessStatus.APPROVED, "APPROVED");
    assert.equal(ChargeStatusCode.CHARGED, 0);
    assert.equal(ChargeStatusCode.INVALID, -1);
    assert.equal(ChargeStatusCode.UNKNOWN, -4);
  });
});
