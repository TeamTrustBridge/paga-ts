/**
 * Payment collection operations for the Paga Engine API.
 *
 * Covers the **Accept payments** sections of Paga's documentation that
 * collect money from a customer:
 *
 * - **Dynamic virtual account** — create a payment request, check its status.
 * - **Bank USSD** — list the banks a customer can pay from.
 * - **Paga wallet** — the same payment request, with `paymentMethods` set to
 *   `["PAGA_WALLET"]`.
 * - **Bank transfer (ACH, Wire and Swift)** — the same payment request in USD,
 *   plus its own status check.
 *
 * The payment request itself is shared by all four, so it lives here once.
 */

import {
  COLLECT_BANKS_HASH_FIELDS,
  HISTORY_HASH_FIELDS,
  PAYMENT_REQUEST_HASH_FIELDS,
  PAYMENT_STATUS_HASH_FIELDS,
  USD_PAYMENT_STATUS_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type {
  CollectBanksResponse,
  CollectPaymentRequestResponse,
  PagaResponse,
  PaymentStatusResponse,
} from "./types.js";

export function CollectionOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class CollectionMixin extends Base {
    /**
     * Create a payment request.
     *
     * Operation: Dynamic virtual account - Create a payment request.
     *
     * The customer pays via the payment methods supplied (e.g. bank transfer
     * with a one-time Paga virtual account number). Paga sends a callback to
     * the configured `callBackUrl` when the payment completes.
     *
     * The same operation serves the Bank USSD, Paga wallet and USD bank
     * transfer flows — pick the flow with `paymentMethods`.
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
     * List the banks a customer can pay from.
     *
     * Operation: Bank USSD - Get the customer's bank.
     *
     * Send the bank's `uuid` as `payer.bankId` when creating a payment
     * request, or as `autoSweep.bankPublicId` for subsidiary accounts.
     */
    async getCollectBanks(args: { referenceNumber: string }): Promise<CollectBanksResponse> {
      return this.request<CollectBanksResponse>(
        "POST",
        "/banks",
        { referenceNumber: args.referenceNumber },
        {
          useHash: true,
          useBasic: true,
          hashFields: COLLECT_BANKS_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * Check the status of a USD (ACH, Wire, Swift) payment request.
     *
     * Operation: Bank transfer (ACH, Wire and Swift) - Check payment status.
     *
     * Unlike the other status operations, this one signs the currency too.
     */
    async getUsdPaymentStatus(args: {
      referenceNumber: string;
      paymentCurrency?: string;
    }): Promise<PagaResponse> {
      return this.request<PagaResponse>(
        "POST",
        "/status",
        {
          referenceNumber: args.referenceNumber,
          paymentCurrency: args.paymentCurrency ?? "USD",
        },
        {
          useHash: true,
          useBasic: true,
          hashFields: USD_PAYMENT_STATUS_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * Get the history of your payment requests.
     *
     * Operation: Collect API - Payment request history.
     */
    async getPaymentRequestHistory(args: { referenceNumber: string }): Promise<PagaResponse> {
      return this.request<PagaResponse>(
        "POST",
        "/history",
        { referenceNumber: args.referenceNumber },
        { useHash: true, useBasic: true, hashFields: HISTORY_HASH_FIELDS, raiseOnError: false },
      );
    }
  }

  return CollectionMixin;
}

export type CollectionClient = ReturnType<typeof CollectionOperations>;
