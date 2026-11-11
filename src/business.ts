/**
 * Business account operations for the Paga Engine API.
 *
 * Covers the **Manage accounts → Your business account** section of Paga's
 * documentation, plus the Business API operations that act on the account
 * itself.
 */

import {
  ACCOUNT_BALANCE_HASH_FIELDS,
  DISPENSE_CASH_HASH_FIELDS,
  GET_OPERATION_STATUS_HASH_FIELDS,
  ONBOARD_MERCHANT_HASH_FIELDS,
  RECENT_TRANSACTION_HISTORY_HASH_FIELDS,
  TRANSACTION_HISTORY_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type {
  AccountBalanceResponse,
  DispenseCashResponse,
  OnboardMerchantResponse,
  OperationStatusResponse,
  RecentTransactionsResponse,
  TransactionHistoryResponse,
} from "./types.js";

export function BusinessOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class BusinessMixin extends Base {
    /**
     * Check the business account balance.
     *
     * Operation: Your business account - Check your balance.
     *
     * Check `availableBalance`, not `totalBalance`, before a payout run.
     */
    async getBusinessBalance(args: { referenceNumber: string }): Promise<AccountBalanceResponse> {
      return this.request<AccountBalanceResponse>(
        "POST",
        "/accountBalance",
        { referenceNumber: args.referenceNumber },
        {
          useHash: true,
          useBasic: false,
          baseUrl: this.businessBaseUrl,
          hashFields: ACCOUNT_BALANCE_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * Get the business transaction history.
     *
     * Operation: Your business account - Get your transaction history.
     *
     * Up to 10,000 transactions at a time.
     */
    async getBusinessTransactions(args: {
      referenceNumber: string;
      startDateUTC: string;
      endDateUTC: string;
      locale?: string;
    }): Promise<TransactionHistoryResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        startDateUTC: args.startDateUTC,
        endDateUTC: args.endDateUTC,
      };
      if (args.locale !== undefined) payload.locale = args.locale;
      return this.request<TransactionHistoryResponse>("POST", "/transactionHistory", payload, {
        useHash: true,
        useBasic: false,
        baseUrl: this.businessBaseUrl,
        hashFields: TRANSACTION_HISTORY_HASH_FIELDS,
      });
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
     * Check an operation's status.
     *
     * Operation: Business API - Get an operation status.
     *
     * The status is in `transactionStatus`, not `status`.
     */
    async getOperationStatus(args: {
      referenceNumber: string;
      locale?: string;
    }): Promise<OperationStatusResponse> {
      const payload: Record<string, unknown> = { referenceNumber: args.referenceNumber };
      if (args.locale !== undefined) payload.locale = args.locale;
      return this.request<OperationStatusResponse>("POST", "/getOperationStatus", payload, {
        useHash: true,
        useBasic: false,
        baseUrl: this.businessBaseUrl,
        hashFields: GET_OPERATION_STATUS_HASH_FIELDS,
        raiseOnError: false,
      });
    }

    /**
     * Onboard a merchant.
     *
     * Operation: Business API - Onboard a merchant.
     *
     * For aggregators only.
     */
    async onboardMerchant(args: {
      reference: string;
      merchantExternalId: string;
      legalEntity: Record<string, unknown>;
      legalEntityRepresentative: Record<string, unknown>;
      integration: Record<string, unknown>;
      additionalParameters?: Record<string, unknown>;
    }): Promise<OnboardMerchantResponse> {
      const payload: Record<string, unknown> = {
        reference: args.reference,
        merchantExternalId: args.merchantExternalId,
        merchantInfo: {
          legalEntity: args.legalEntity,
          legalEntityRepresentative: args.legalEntityRepresentative,
          additionalParameters: args.additionalParameters ?? {},
        },
        integration: args.integration,
      };
      const hashPayload = {
        referenceNumber: args.reference,
        merchantExternalId: args.merchantExternalId,
        name: args.legalEntity?.name,
        phone: args.legalEntityRepresentative?.phone,
        email: args.legalEntityRepresentative?.email,
      };
      return this.request<OnboardMerchantResponse>("POST", "/onboardMerchant", payload, {
        useHash: true,
        useBasic: false,
        baseUrl: this.businessBaseUrl,
        hashFields: ONBOARD_MERCHANT_HASH_FIELDS,
        hashPayload,
        raiseOnError: false,
      });
    }

    /**
     * Dispense cash against a customer's withdrawal code.
     *
     * Operation: Business API - Dispense cash.
     */
    async dispenseCash(args: {
      referenceNumber: string;
      customerPhoneNumber: string;
      amount: number;
      withdrawalCode: string;
      locale?: string;
    }): Promise<DispenseCashResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        customerPhoneNumber: args.customerPhoneNumber,
        amount: args.amount,
        withdrawalCode: args.withdrawalCode,
      };
      if (args.locale !== undefined) payload.locale = args.locale;
      return this.request<DispenseCashResponse>("POST", "/dispenseCash", payload, {
        useHash: true,
        useBasic: false,
        baseUrl: this.businessBaseUrl,
        hashFields: DISPENSE_CASH_HASH_FIELDS,
        raiseOnError: false,
      });
    }
  }

  return BusinessMixin;
}

export type BusinessClient = ReturnType<typeof BusinessOperations>;
