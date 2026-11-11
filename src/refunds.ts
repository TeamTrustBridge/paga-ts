/**
 * Refund operations for the Paga Engine API.
 *
 * Covers the **Accept payments → Refunds** section of Paga's documentation.
 */

import { PAYMENT_STATUS_HASH_FIELDS, REFUND_HASH_FIELDS } from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type { RefundResponse, RefundStatusResponse } from "./types.js";

export function RefundOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class RefundMixin extends Base {
    /**
     * Refund or cancel a payment request.
     *
     * Operation: Refunds - Refund or cancel a payment request.
     *
     * Refunds a paid payment request in full or in part, or cancels one that
     * has not been paid. Send one request per partial refund, each with its
     * own `referenceNumber`. Reusing a `referenceNumber` returns status code
     * `102` and never refunds twice.
     */
    async refundPayment(args: {
      referenceNumber: string;
      paymentRequestReference: string;
      refundAmount: number;
      currency?: string;
      reason?: string;
    }): Promise<RefundResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        paymentRequestReference: args.paymentRequestReference,
        refundAmount: args.refundAmount,
        currency: args.currency ?? "NGN",
      };
      if (args.reason !== undefined) payload.reason = args.reason;
      return this.request<RefundResponse>("POST", "/refund/v2", payload, {
        useHash: true,
        useBasic: true,
        hashFields: REFUND_HASH_FIELDS,
      });
    }

    /**
     * Check whether a payment request was refunded.
     *
     * Operation: Refunds - Check refund status.
     *
     * Call with the original payment request's `referenceNumber`.
     */
    async getRefundStatus(args: { referenceNumber: string }): Promise<RefundStatusResponse> {
      return this.request<RefundStatusResponse>(
        "POST",
        "/status",
        { referenceNumber: args.referenceNumber },
        {
          useHash: true,
          useBasic: true,
          hashFields: PAYMENT_STATUS_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }
  }

  return RefundMixin;
}

export type RefundClient = ReturnType<typeof RefundOperations>;
