/**
 * Bill payment operations for the Paga Engine API.
 *
 * Covers the **Make payments → Bill payment (VAS)** section of Paga's
 * documentation.
 */

import {
  BILL_PAYMENT_HASH_FIELDS,
  MERCHANT_ACCOUNT_DETAILS_HASH_FIELDS,
  MERCHANT_SERVICES_HASH_FIELDS,
  MERCHANTS_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type {
  MerchantAccountDetailsResponse,
  MerchantPaymentResponse,
  MerchantsResponse,
  MerchantServicesResponse,
} from "./types.js";

export function BillPaymentOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class BillPaymentMixin extends Base {
    /**
     * List every biller you can pay.
     *
     * Operation: Bill payment - Find the biller.
     */
    async getMerchants(args: { referenceNumber: string }): Promise<MerchantsResponse> {
      return this.request<MerchantsResponse>(
        "POST",
        "/getMerchants",
        { referenceNumber: args.referenceNumber },
        {
          useHash: true,
          useBasic: false,
          baseUrl: this.businessBaseUrl,
          hashFields: MERCHANTS_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * List what a biller can be paid for.
     *
     * Operation: Bill payment - Pick the service.
     */
    async getMerchantServices(args: {
      referenceNumber: string;
      merchantPublicId: string;
    }): Promise<MerchantServicesResponse> {
      return this.request<MerchantServicesResponse>(
        "POST",
        "/getMerchantServices",
        {
          referenceNumber: args.referenceNumber,
          merchantPublicId: args.merchantPublicId,
        },
        {
          useHash: true,
          useBasic: false,
          baseUrl: this.businessBaseUrl,
          hashFields: MERCHANT_SERVICES_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * Validate a customer's meter, smart card or account number.
     *
     * Operation: Bill payment - Validate the customer.
     *
     * `merchantServiceProductCode` takes part in the hash even when the
     * customer chose no service — send `""` in that case.
     */
    async getMerchantAccountDetails(args: {
      referenceNumber: string;
      merchantAccount: string;
      merchantReferenceNumber: string;
      merchantServiceProductCode?: string;
    }): Promise<MerchantAccountDetailsResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        merchantAccount: args.merchantAccount,
        merchantReferenceNumber: args.merchantReferenceNumber,
        merchantServiceProductCode: args.merchantServiceProductCode ?? "",
      };
      return this.request<MerchantAccountDetailsResponse>(
        "POST",
        "/getMerchantAccountDetails",
        payload,
        {
          useHash: true,
          useBasic: false,
          baseUrl: this.businessBaseUrl,
          hashFields: MERCHANT_ACCOUNT_DETAILS_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * Pay a bill from the business balance.
     *
     * Operation: Bill payment - Pay the bill.
     */
    async payBill(args: {
      referenceNumber: string;
      amount: number;
      merchantAccount: string;
      merchantReferenceNumber: string;
      merchantService?: string[];
      currency?: string;
      paymentChannel?: string;
      locale?: string;
      merchantServiceProductCode?: string;
    }): Promise<MerchantPaymentResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        amount: args.amount,
        merchantAccount: args.merchantAccount,
        merchantReferenceNumber: args.merchantReferenceNumber,
        currency: args.currency ?? "NGN",
      };
      if (args.merchantService !== undefined) payload.merchantService = args.merchantService;
      if (args.paymentChannel !== undefined) payload.paymentChannel = args.paymentChannel;
      if (args.locale !== undefined) payload.locale = args.locale;
      if (args.merchantServiceProductCode !== undefined) {
        payload.merchantServiceProductCode = args.merchantServiceProductCode;
      }

      return this.request<MerchantPaymentResponse>("POST", "/merchantPayment", payload, {
        useHash: true,
        useBasic: false,
        baseUrl: this.businessBaseUrl,
        hashFields: BILL_PAYMENT_HASH_FIELDS,
        raiseOnError: false,
      });
    }
  }

  return BillPaymentMixin;
}

export type BillPaymentClient = ReturnType<typeof BillPaymentOperations>;
