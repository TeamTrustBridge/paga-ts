/** Checkout operations for the Paga Engine API. */

import { PAYMENT_REQUEST_HASH_FIELDS, PAYMENT_STATUS_HASH_FIELDS } from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type {
  CheckoutVerifyChargeResponse,
  CollectPaymentRequestResponse,
  PaymentStatusResponse,
  PagaResponse,
} from "./types.js";

export function CheckoutOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class CheckoutMixin extends Base {
    /**
     * Create a Paga payment request.
     *
     * Operation: Dynamic virtual account - Create a payment request.
     */
    async createPayment(args: {
      referenceNumber: string;
      amount: number;
      payerName: string;
      payerPhoneNumber: string;
      payeeName: string;
      currency?: string;
      payerEmail?: string;
      callBackUrl?: string;
      paymentMethods?: string[];
      expiryDateTimeUTC?: string;
      isSuppressMessages?: boolean;
      payerCollectionFeeShare?: number;
      payeeCollectionFeeShare?: number;
      payerAddress?: string;
      payerBankId?: string;
      payerBankAccountNumber?: string;
      payerCurrency?: string;
      payeeAccountNumber?: string;
      payeePhoneNumber?: string;
      payeeBankId?: string;
      payeeBankAccountNumber?: string;
      isSingleUse?: boolean;
      isAllowPartialPayments?: boolean;
      isAllowOverPayments?: boolean;
      narration?: string;
      redirectUrl?: string;
      /** Override the hash field order. */
      hashFields?: string[];
    }): Promise<CollectPaymentRequestResponse> {
      const payer: Record<string, unknown> = {
        name: args.payerName,
        phoneNumber: args.payerPhoneNumber,
      };
      if (args.payerEmail !== undefined) payer.email = args.payerEmail;
      if (args.payerAddress !== undefined) payer.address = args.payerAddress;
      if (args.payerBankId !== undefined) payer.bankId = args.payerBankId;
      if (args.payerBankAccountNumber !== undefined) payer.bankAccountNumber = args.payerBankAccountNumber;
      if (args.payerCurrency !== undefined) payer.currency = args.payerCurrency;

      const payee: Record<string, unknown> = { name: args.payeeName };
      if (args.payeeAccountNumber !== undefined) payee.accountNumber = args.payeeAccountNumber;
      if (args.payeePhoneNumber !== undefined) payee.phoneNumber = args.payeePhoneNumber;
      if (args.payeeBankId !== undefined) payee.bankId = args.payeeBankId;
      if (args.payeeBankAccountNumber !== undefined) payee.bankAccountNumber = args.payeeBankAccountNumber;

      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        amount: args.amount,
        currency: args.currency ?? "NGN",
        payer,
        payee,
        payerCollectionFeeShare: args.payerCollectionFeeShare ?? 1,
        payeeCollectionFeeShare: args.payeeCollectionFeeShare ?? 0,
        paymentMethods: args.paymentMethods ?? ["BANK_TRANSFER"],
      };
      if (args.callBackUrl !== undefined) payload.callBackUrl = args.callBackUrl;
      if (args.expiryDateTimeUTC !== undefined) payload.expiryDateTimeUTC = args.expiryDateTimeUTC;
      if (args.isSuppressMessages) payload.isSuppressMessages = true;
      if (args.isSingleUse !== undefined) payload.isSingleUse = args.isSingleUse;
      if (args.isAllowPartialPayments !== undefined) payload.isAllowPartialPayments = args.isAllowPartialPayments;
      if (args.isAllowOverPayments !== undefined) payload.isAllowOverPayments = args.isAllowOverPayments;
      if (args.narration !== undefined) payload.narration = args.narration;
      if (args.redirectUrl !== undefined) payload.redirectUrl = args.redirectUrl;

      return this.request<CollectPaymentRequestResponse>(
        "POST",
        "/paymentRequest",
        payload,
        {
          useHash: true,
          useBasic: true,
          hashFields: args.hashFields ?? PAYMENT_REQUEST_HASH_FIELDS,
        },
      );
    }

    /**
     * Check the status of a payment request.
     *
     * Operation: Dynamic virtual account - Check payment status.
     *
     * The outer `statusCode` only says whether the status request worked; the
     * payment's own status is in `data.statusCode`.
     */
    async getPaymentStatus(args: { referenceNumber: string }): Promise<PaymentStatusResponse> {
      return this.request<PaymentStatusResponse>(
        "POST",
        "/status",
        { referenceNumber: args.referenceNumber },
        { useHash: true, useBasic: true, hashFields: PAYMENT_STATUS_HASH_FIELDS },
      );
    }

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
export type { PagaResponse };
