/**
 * Checkout operations for the Paga Engine API.
 *
 * Covers the **Accept payments → Checkout** section of Paga's documentation.
 *
 * Checkout takes a card or bank payment on a Paga-hosted page. The customer
 * redirects to Paga, pays, and Paga notifies your server.
 */

import type { Constructor, PagaTransport } from "./base.js";
import type { CheckoutVerifyChargeResponse } from "./types.js";

export function CheckoutOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class CheckoutMixin extends Base {
    /**
     * Verify a checkout charge.
     *
     * Operation: Checkout - Verify a charge.
     *
     * `status_code` `0` means paid, `2` means pending. Uses HTTP Basic only.
     *
     * The response is returned rather than thrown: a pending charge is a
     * legitimate answer, so branch on `status_code`.
     */
    async verifyCharge(args: {
      paymentReference: string;
      publicKey: string;
      amount: number;
      currency?: string;
    }): Promise<CheckoutVerifyChargeResponse> {
      return this.request<CheckoutVerifyChargeResponse>(
        "POST",
        "/checkout/transaction/verify",
        {
          paymentReference: args.paymentReference,
          publicKey: args.publicKey,
          amount: args.amount,
          currency: args.currency ?? "NGN",
        },
        {
          useHash: false,
          useBasic: true,
          baseUrl: this.checkoutBaseUrl,
          raiseOnError: false,
        },
      );
    }
  }

  return CheckoutMixin;
}

export type CheckoutClient = ReturnType<typeof CheckoutOperations>;
