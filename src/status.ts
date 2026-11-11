/**
 * Shared transaction status operations for the Paga Engine API.
 *
 * Covers the **Check the transaction status** operation that Paga documents
 * under money transfer, airtime and bill payment alike.
 */

import { TRANSACTION_STATUS_HASH_FIELDS } from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type { TransactionStatusResponse } from "./types.js";

export function StatusOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class StatusMixin extends Base {
    /**
     * Check what happened to a transaction you already sent.
     *
     * Operation: Money transfer / Airtime / Bill payment - Check the
     * transaction status.
     *
     * Covers the last 48 hours only. Branch on `responseCode`, not on the
     * human-readable `status`.
     */
    async getTransactionStatus(args: {
      referenceNumber: string;
      locale?: string;
    }): Promise<TransactionStatusResponse> {
      const payload: Record<string, unknown> = { referenceNumber: args.referenceNumber };
      if (args.locale !== undefined) payload.locale = args.locale;
      return this.request<TransactionStatusResponse>(
        "POST",
        "/transactionStatus",
        payload,
        {
          useHash: true,
          useBasic: false,
          baseUrl: this.businessBaseUrl,
          hashFields: TRANSACTION_STATUS_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }
  }

  return StatusMixin;
}

export type StatusClient = ReturnType<typeof StatusOperations>;
