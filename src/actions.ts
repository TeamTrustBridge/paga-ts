/** Action operations for the Paga Engine API: transfers, airtime and bills. */

import {
  AIRTIME_HASH_FIELDS,
  BILL_PAYMENT_HASH_FIELDS,
  MONEY_TRANSFER_HASH_FIELDS,
  REFUND_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type {
  DepositToBankResponse,
  MerchantPaymentResponse,
  PurchaseResponse,
  RefundResponse,
} from "./types.js";

export function ActionOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class ActionMixin extends Base {
    /**
     * Send money from the business balance to a bank account or Paga wallet.
     *
     * Operation: Money transfer - Send the money.
     *
     * Send `amount` as a string (e.g. `"5000.00"`): it is signed verbatim.
     */
    async sendMoney(args: {
      referenceNumber: string;
      amount: string;
      destinationBankUUID: string;
      destinationBankAccountNumber: string;
      currency?: string;
      remarks?: string;
      statusCallbackUrl?: string;
      recipientName?: string;
      recipientPhoneNumber?: string;
      recipientMobileOperatorCode?: string;
      recipientEmail?: string;
      transferReference?: string;
      suppressRecipientMessage?: boolean;
      alternateSenderName?: string;
    }): Promise<DepositToBankResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        amount: args.amount,
        currency: args.currency ?? "NGN",
        destinationBankUUID: args.destinationBankUUID,
        destinationBankAccountNumber: args.destinationBankAccountNumber,
      };
      if (args.remarks !== undefined) payload.remarks = args.remarks;
      if (args.statusCallbackUrl !== undefined) payload.statusCallbackUrl = args.statusCallbackUrl;
      if (args.recipientName !== undefined) payload.recipientName = args.recipientName;
      if (args.recipientPhoneNumber !== undefined) payload.recipientPhoneNumber = args.recipientPhoneNumber;
      if (args.recipientMobileOperatorCode !== undefined) {
        payload.recipientMobileOperatorCode = args.recipientMobileOperatorCode;
      }
      if (args.recipientEmail !== undefined) payload.recipientEmail = args.recipientEmail;
      if (args.transferReference !== undefined) payload.transferReference = args.transferReference;
      if (args.suppressRecipientMessage !== undefined) {
        payload.suppressRecipientMessage = args.suppressRecipientMessage;
      }
      if (args.alternateSenderName !== undefined) payload.alternateSenderName = args.alternateSenderName;

      return this.request<DepositToBankResponse>("POST", "/depositToBank", payload, {
        useHash: true,
        useBasic: false,
        baseUrl: this.businessBaseUrl,
        hashFields: MONEY_TRANSFER_HASH_FIELDS,
        raiseOnError: false,
      });
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

    /**
     * Refund or cancel a payment request.
     *
     * Operation: Refunds - Refund or cancel a payment request.
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
  }

  return ActionMixin;
}

export type ActionClient = ReturnType<typeof ActionOperations>;
