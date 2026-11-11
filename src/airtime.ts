/**
 * Airtime and data purchase operations for the Paga Engine API.
 *
 * Covers the **Make payments → Airtime and data** section of Paga's
 * documentation.
 */

import {
  AIRTIME_HASH_FIELDS,
  DATA_BUNDLE_HASH_FIELDS,
  MOBILE_OPERATORS_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type { DataBundlesResponse, MobileOperatorsResponse, PurchaseResponse } from "./types.js";

export function AirtimeOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class AirtimeMixin extends Base {
    /**
     * List the mobile networks you can top up.
     *
     * Operation: Airtime and data - Get the mobile operator.
     */
    async getMobileOperators(args: {
      referenceNumber: string;
      locale?: string;
    }): Promise<MobileOperatorsResponse> {
      const payload: Record<string, unknown> = { referenceNumber: args.referenceNumber };
      if (args.locale !== undefined) payload.locale = args.locale;
      return this.request<MobileOperatorsResponse>(
        "POST",
        "/getMobileOperators",
        payload,
        {
          useHash: true,
          useBasic: false,
          baseUrl: this.businessBaseUrl,
          hashFields: MOBILE_OPERATORS_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * List a network's data bundles.
     *
     * Operation: Airtime and data - For data, pick a bundle.
     *
     * Send a bundle's `serviceId` as `mobileOperatorServiceId` and exactly
     * its `servicePrice` as `amount`.
     */
    async getDataBundles(args: {
      referenceNumber: string;
      operatorPublicId: string;
    }): Promise<DataBundlesResponse> {
      return this.request<DataBundlesResponse>(
        "POST",
        "/getDataBundleByOperator",
        {
          referenceNumber: args.referenceNumber,
          operatorPublicId: args.operatorPublicId,
        },
        {
          useHash: true,
          useBasic: false,
          baseUrl: this.businessBaseUrl,
          hashFields: DATA_BUNDLE_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * Buy airtime or data.
     *
     * Operation: Airtime and data - Buy the airtime or data.
     *
     * For a data bundle, `amount` must be exactly the bundle's
     * `servicePrice`.
     */
    async buyAirtime(args: {
      referenceNumber: string;
      amount: string;
      destinationPhoneNumber: string;
      mobileOperatorPublicId: string;
      currency?: string;
      isDataBundle?: boolean;
      mobileOperatorServiceId?: string;
      isSuppressRecipientMessages?: boolean;
    }): Promise<PurchaseResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        amount: args.amount,
        destinationPhoneNumber: args.destinationPhoneNumber,
        mobileOperatorPublicId: args.mobileOperatorPublicId,
        currency: args.currency ?? "NGN",
        isDataBundle: args.isDataBundle ?? false,
      };
      if (args.mobileOperatorServiceId !== undefined) {
        payload.mobileOperatorServiceId = args.mobileOperatorServiceId;
      }
      if (args.isSuppressRecipientMessages) payload.isSuppressRecipientMessages = true;

      return this.request<PurchaseResponse>("POST", "/airtimePurchase", payload, {
        useHash: true,
        useBasic: false,
        baseUrl: this.businessBaseUrl,
        hashFields: AIRTIME_HASH_FIELDS,
        raiseOnError: false,
      });
    }
  }

  return AirtimeMixin;
}

export type AirtimeClient = ReturnType<typeof AirtimeOperations>;
