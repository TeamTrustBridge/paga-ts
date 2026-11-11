/**
 * Directory lookups and transaction status checks.
 *
 * These are the read-only operations that resolve the identifiers the write
 * endpoints need — bank UUIDs, operator codes, bundle ids, biller UUIDs —
 * plus the status checks that tell you what happened to a transaction you
 * already sent.
 */

import {
  BANKS_HASH_FIELDS,
  COLLECT_BANKS_HASH_FIELDS,
  DATA_BUNDLE_HASH_FIELDS,
  MERCHANT_ACCOUNT_DETAILS_HASH_FIELDS,
  MERCHANT_SERVICES_HASH_FIELDS,
  MERCHANTS_HASH_FIELDS,
  MOBILE_OPERATORS_HASH_FIELDS,
  RECENT_TRANSACTION_HISTORY_HASH_FIELDS,
  TRANSACTION_STATUS_HASH_FIELDS,
  USD_PAYMENT_STATUS_HASH_FIELDS,
  VALIDATE_DEPOSIT_TO_BANK_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type {
  BanksResponse,
  CollectBanksResponse,
  DataBundlesResponse,
  MerchantsResponse,
  MerchantAccountDetailsResponse,
  MerchantServicesResponse,
  MobileOperatorsResponse,
  PagaResponse,
  RecentTransactionsResponse,
  RefundStatusResponse,
  TransactionStatusResponse,
  ValidateDepositToBankResponse,
} from "./types.js";

export function DirectoryOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class DirectoryMixin extends Base {
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
     * List every institution you can pay.
     *
     * Operation: Money transfer - Get the bank's UUID.
     *
     * Send the `uuid` as `destinationBankUUID`. Paga's own UUID is
     * `AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA` (send to a Paga wallet).
     */
    async getBanks(args: { referenceNumber: string }): Promise<BanksResponse> {
      return this.request<BanksResponse>(
        "POST",
        "/getBanks",
        { referenceNumber: args.referenceNumber },
        {
          useHash: true,
          useBasic: false,
          baseUrl: this.businessBaseUrl,
          hashFields: BANKS_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * Validate a destination account before sending money to it.
     *
     * Operation: Money transfer - Validate the account.
     *
     * Send `amount` exactly as you will send it later: `"5000.00"` and
     * `"5000"` sign differently.
     */
    async validateDepositToBank(args: {
      referenceNumber: string;
      amount: string;
      destinationBankUUID: string;
      destinationBankAccountNumber: string;
      currency?: string;
      recipientName?: string;
      recipientPhoneNumber?: string;
      recipientMobileOperatorCode?: string;
      recipientEmail?: string;
      locale?: string;
    }): Promise<ValidateDepositToBankResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        amount: args.amount,
        currency: args.currency ?? "NGN",
        destinationBankUUID: args.destinationBankUUID,
        destinationBankAccountNumber: args.destinationBankAccountNumber,
      };
      if (args.recipientName !== undefined) payload.recipientName = args.recipientName;
      if (args.recipientPhoneNumber !== undefined) payload.recipientPhoneNumber = args.recipientPhoneNumber;
      if (args.recipientMobileOperatorCode !== undefined) {
        payload.recipientMobileOperatorCode = args.recipientMobileOperatorCode;
      }
      if (args.recipientEmail !== undefined) payload.recipientEmail = args.recipientEmail;
      if (args.locale !== undefined) payload.locale = args.locale;

      return this.request<ValidateDepositToBankResponse>(
        "POST",
        "/validateDepositToBank",
        payload,
        {
          useHash: true,
          useBasic: false,
          baseUrl: this.businessBaseUrl,
          hashFields: VALIDATE_DEPOSIT_TO_BANK_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

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

    /**
     * Get the last five transactions on the business account.
     *
     * Operation: Your business account - Get your recent transactions.
     */
    async getRecentTransactions(args: {
      referenceNumber: string;
      locale?: string;
      accountPrincipal?: string;
      accountCredentials?: string;
    }): Promise<RecentTransactionsResponse> {
      const payload: Record<string, unknown> = { referenceNumber: args.referenceNumber };
      if (args.locale !== undefined) payload.locale = args.locale;
      if (args.accountPrincipal !== undefined) payload.accountPrincipal = args.accountPrincipal;
      if (args.accountCredentials !== undefined) payload.accountCredentials = args.accountCredentials;
      return this.request<RecentTransactionsResponse>(
        "POST",
        "/recentTransactionHistory",
        payload,
        {
          useHash: true,
          useBasic: false,
          baseUrl: this.businessBaseUrl,
          hashFields: RECENT_TRANSACTION_HISTORY_HASH_FIELDS,
          raiseOnError: false,
        },
      );
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
          hashFields: ["referenceNumber"],
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
  }

  return DirectoryMixin;
}

export type DirectoryClient = ReturnType<typeof DirectoryOperations>;
