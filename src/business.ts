/** Business account and subsidiary account operations for the Paga Engine API. */

import {
  ACCOUNT_BALANCE_HASH_FIELDS,
  DISPENSE_CASH_HASH_FIELDS,
  GET_OPERATION_STATUS_HASH_FIELDS,
  MONEY_TRANSFER_BULK_HASH_FIELDS,
  ONBOARD_MERCHANT_HASH_FIELDS,
  PAGA_WALLET_TRANSFER_HASH_FIELDS,
  SUBSIDIARY_ACCOUNT_HASH_FIELDS,
  SUBSIDIARY_BALANCE_HASH_FIELDS,
  SUBSIDIARY_CHARGE_HASH_FIELDS,
  SUBSIDIARY_HISTORY_HASH_FIELDS,
  SUBSIDIARY_RETRIEVE_HASH_FIELDS,
  SUBSIDIARY_TOPUP_HASH_FIELDS,
  SUBSIDIARY_TRANSFER_HASH_FIELDS,
  SUBSIDIARY_UPDATE_HASH_FIELDS,
  TRANSACTION_HISTORY_HASH_FIELDS,
  VALIDATE_MONEY_TRANSFER_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type {
  AccountBalanceResponse,
  BulkMoneyTransferResponse,
  DispenseCashResponse,
  MoneyTransferItem,
  MoneyTransferResponse,
  OnboardMerchantResponse,
  OperationStatusResponse,
  SubsidiaryAccountResponse,
  SubsidiaryBalanceResponse,
  SubsidiaryHistoryResponse,
  SubsidiaryMoneyResponse,
  SubsidiaryTransferResponse,
  TransactionHistoryResponse,
  ValidateMoneyTransferResponse,
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
     * Create a subsidiary account.
     *
     * Operation: Subsidiary Accounts - Create an account.
     *
     * Leave out `autoSweepDestination` for a ledger-backed account that holds
     * funds. Reusing a reference returns status code `102`.
     */
    async createSubsidiaryAccount(args: {
      referenceNumber: string;
      accountReference: string;
      accountName: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      email?: string;
      iifiNumber?: string;
      fundingTransactionLimit?: number;
      fundingDailyLimit?: number;
      status?: string;
      autoSweepDestination?: string;
      autoSweepBankPublicId?: string;
      autoSweepAccountNumber?: string;
      callbackUrl?: string;
    }): Promise<SubsidiaryAccountResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        accountReference: args.accountReference,
        accountName: args.accountName,
      };
      if (args.firstName !== undefined) payload.firstName = args.firstName;
      if (args.lastName !== undefined) payload.lastName = args.lastName;
      if (args.phoneNumber !== undefined) payload.phoneNumber = args.phoneNumber;
      if (args.email !== undefined) payload.email = args.email;
      if (args.iifiNumber !== undefined) payload.iifiNumber = args.iifiNumber;
      if (args.fundingTransactionLimit !== undefined) {
        payload.fundingTransactionLimit = args.fundingTransactionLimit;
      }
      if (args.fundingDailyLimit !== undefined) payload.fundingDailyLimit = args.fundingDailyLimit;
      if (args.status !== undefined) payload.status = args.status;
      if (args.autoSweepDestination !== undefined) {
        const autoSweep: Record<string, unknown> = { destination: args.autoSweepDestination };
        if (args.autoSweepDestination === "BANK") {
          if (args.autoSweepBankPublicId !== undefined) autoSweep.bankPublicId = args.autoSweepBankPublicId;
          if (args.autoSweepAccountNumber !== undefined) {
            autoSweep.accountNumber = args.autoSweepAccountNumber;
          }
        }
        payload.autoSweep = autoSweep;
      }
      if (args.callbackUrl !== undefined) payload.callbackUrl = args.callbackUrl;

      return this.request<SubsidiaryAccountResponse>("POST", "/subsidiary-accounts", payload, {
        useHash: true,
        useBasic: true,
        hashFields: SUBSIDIARY_ACCOUNT_HASH_FIELDS,
      });
    }

    /**
     * Charge a ledger-backed subsidiary account.
     *
     * Operation: Subsidiary Accounts - Charge an account.
     */
    async chargeSubsidiaryAccount(args: {
      accountReference: string;
      referenceNumber: string;
      amount: number;
      currency?: string;
      narration?: string;
    }): Promise<SubsidiaryMoneyResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        amount: args.amount,
        currency: args.currency ?? "NGN",
      };
      if (args.narration !== undefined) payload.narration = args.narration;
      return this.request<SubsidiaryMoneyResponse>(
        "POST",
        `/subsidiary-accounts/${args.accountReference}/charge`,
        payload,
        { useHash: true, useBasic: true, hashFields: SUBSIDIARY_CHARGE_HASH_FIELDS },
      );
    }

    /**
     * Top up a ledger-backed subsidiary account.
     *
     * Operation: Subsidiary Accounts - Top up an account.
     */
    async topUpSubsidiaryAccount(args: {
      accountReference: string;
      referenceNumber: string;
      amount: number;
      currency?: string;
      narration?: string;
    }): Promise<SubsidiaryMoneyResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        amount: args.amount,
        currency: args.currency ?? "NGN",
      };
      if (args.narration !== undefined) payload.narration = args.narration;
      return this.request<SubsidiaryMoneyResponse>(
        "POST",
        `/subsidiary-accounts/${args.accountReference}/topup`,
        payload,
        { useHash: true, useBasic: true, hashFields: SUBSIDIARY_TOPUP_HASH_FIELDS },
      );
    }

    /**
     * Transfer money between two subsidiary accounts.
     *
     * Operation: Subsidiary Accounts - Transfer between accounts.
     */
    async transferBetweenSubsidiaryAccounts(args: {
      sourceAccountReference: string;
      destinationAccountReference: string;
      referenceNumber: string;
      amount: number;
      currency?: string;
      narration?: string;
    }): Promise<SubsidiaryTransferResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        sourceAccountIdentifier: args.sourceAccountReference,
        destinationAccountIdentifier: args.destinationAccountReference,
        amount: args.amount,
        currency: args.currency ?? "NGN",
      };
      if (args.narration !== undefined) payload.narration = args.narration;
      return this.request<SubsidiaryTransferResponse>(
        "POST",
        "/subsidiary-accounts/transfer",
        payload,
        { useHash: true, useBasic: true, hashFields: SUBSIDIARY_TRANSFER_HASH_FIELDS },
      );
    }

    /**
     * Retrieve a subsidiary account.
     *
     * Operation: Subsidiary Accounts - Retrieve an account.
     */
    async retrieveSubsidiaryAccount(args: {
      accountReference: string;
      referenceNumber: string;
    }): Promise<SubsidiaryAccountResponse> {
      return this.request<SubsidiaryAccountResponse>(
        "GET",
        `/subsidiary-accounts/${args.accountReference}`,
        { referenceNumber: args.referenceNumber, accountIdentifier: args.accountReference },
        {
          useHash: true,
          useBasic: true,
          baseUrl: this.baseUrl,
          hashFields: SUBSIDIARY_RETRIEVE_HASH_FIELDS,
          params: { referenceNumber: args.referenceNumber },
        },
      );
    }

    /**
     * Update a subsidiary account.
     *
     * Operation: Subsidiary Accounts - Update an account.
     *
     * Send only what you want to change.
     */
    async updateSubsidiaryAccount(args: {
      accountReference: string;
      referenceNumber: string;
      accountName?: string;
      iifiNumber?: string;
      status?: string;
      autoSweepDestination?: string;
      autoSweepBankPublicId?: string;
      autoSweepAccountNumber?: string;
      callbackUrl?: string;
    }): Promise<SubsidiaryAccountResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        accountIdentifier: args.accountReference,
      };
      if (args.accountName !== undefined) payload.accountName = args.accountName;
      if (args.iifiNumber !== undefined) payload.iifiNumber = args.iifiNumber;
      if (args.status !== undefined) payload.status = args.status;
      if (args.autoSweepDestination !== undefined) {
        const autoSweep: Record<string, unknown> = { destination: args.autoSweepDestination };
        if (args.autoSweepDestination === "BANK") {
          if (args.autoSweepBankPublicId !== undefined) autoSweep.bankPublicId = args.autoSweepBankPublicId;
          if (args.autoSweepAccountNumber !== undefined) {
            autoSweep.accountNumber = args.autoSweepAccountNumber;
          }
        }
        payload.autoSweep = autoSweep;
      }
      if (args.callbackUrl !== undefined) payload.callbackUrl = args.callbackUrl;

      return this.request<SubsidiaryAccountResponse>(
        "PUT",
        `/subsidiary-accounts/${args.accountReference}`,
        payload,
        { useHash: true, useBasic: true, hashFields: SUBSIDIARY_UPDATE_HASH_FIELDS },
      );
    }

    /**
     * Get a subsidiary account balance.
     *
     * Operation: Subsidiary Accounts - Get the balance.
     */
    async getSubsidiaryBalance(args: {
      accountReference: string;
      referenceNumber: string;
    }): Promise<SubsidiaryBalanceResponse> {
      return this.request<SubsidiaryBalanceResponse>(
        "GET",
        `/subsidiary-accounts/${args.accountReference}/balance`,
        { referenceNumber: args.referenceNumber, accountIdentifier: args.accountReference },
        {
          useHash: true,
          useBasic: true,
          baseUrl: this.baseUrl,
          hashFields: SUBSIDIARY_BALANCE_HASH_FIELDS,
          params: { referenceNumber: args.referenceNumber },
        },
      );
    }

    /**
     * Get a subsidiary account transaction history.
     *
     * Operation: Subsidiary Accounts - Get transaction history.
     *
     * Up to three months at a time. Pages start at `0`.
     */
    async getSubsidiaryHistory(args: {
      accountReference: string;
      referenceNumber: string;
      startDateTimeUTC: string;
      endDateTimeUTC: string;
      pageNumber?: number;
      pageSize?: number;
    }): Promise<SubsidiaryHistoryResponse> {
      const signed = {
        accountIdentifier: args.accountReference,
        startDateTimeUTC: args.startDateTimeUTC,
        endDateTimeUTC: args.endDateTimeUTC,
      };
      return this.request<SubsidiaryHistoryResponse>(
        "GET",
        `/subsidiary-accounts/${args.accountReference}/history`,
        signed,
        {
          useHash: true,
          useBasic: true,
          baseUrl: this.baseUrl,
          hashFields: SUBSIDIARY_HISTORY_HASH_FIELDS,
          params: {
            referenceNumber: args.referenceNumber,
            startDateTimeUTC: args.startDateTimeUTC,
            endDateTimeUTC: args.endDateTimeUTC,
            pageSize: args.pageSize ?? 20,
            pageNumber: args.pageNumber ?? 0,
          },
        },
      );
    }

    /**
     * Send money to a Paga wallet.
     *
     * Operation: Business API - Money transfer to a Paga wallet.
     */
    async transferToPagaWallet(args: {
      referenceNumber: string;
      amount: number;
      destinationAccount: string;
      currency?: string;
      destinationBank?: string;
      sendWithdrawalCode?: boolean;
      sourceOfFunds?: string;
      transferReference?: string;
      suppressRecipientMessage?: boolean;
      alternateSenderName?: string;
      locale?: string;
    }): Promise<MoneyTransferResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        amount: args.amount,
        currency: args.currency ?? "NGN",
        destinationAccount: args.destinationAccount,
        sendWithdrawalCode: args.sendWithdrawalCode ?? true,
        suppressRecipientMessage: args.suppressRecipientMessage ?? false,
      };
      if (args.destinationBank !== undefined) payload.destinationBank = args.destinationBank;
      if (args.sourceOfFunds !== undefined) payload.sourceOfFunds = args.sourceOfFunds;
      if (args.transferReference !== undefined) payload.transferReference = args.transferReference;
      if (args.alternateSenderName !== undefined) payload.alternateSenderName = args.alternateSenderName;
      if (args.locale !== undefined) payload.locale = args.locale;

      return this.request<MoneyTransferResponse>("POST", "/moneyTransfer", payload, {
        useHash: true,
        useBasic: false,
        baseUrl: this.businessBaseUrl,
        hashFields: PAGA_WALLET_TRANSFER_HASH_FIELDS,
        raiseOnError: false,
      });
    }

    /**
     * Validate a Paga wallet transfer before sending it.
     *
     * Operation: Business API - Validate a money transfer.
     */
    async validateMoneyTransfer(args: {
      referenceNumber: string;
      amount: number;
      destinationAccount: string;
      currency?: string;
    }): Promise<ValidateMoneyTransferResponse> {
      return this.request<ValidateMoneyTransferResponse>(
        "POST",
        "/validateMoneyTransfer",
        {
          referenceNumber: args.referenceNumber,
          amount: args.amount,
          currency: args.currency ?? "NGN",
          destinationAccount: args.destinationAccount,
        },
        {
          useHash: true,
          useBasic: false,
          baseUrl: this.businessBaseUrl,
          hashFields: VALIDATE_MONEY_TRANSFER_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * Send up to 300 money transfers in one call.
     *
     * Operation: Business API - Bulk money transfer.
     *
     * Paga hashes the first item's reference number, amount and destination
     * account, followed by the total number of items. A bulk transfer can
     * partially succeed, so check every entry in `results`.
     */
    async sendBulkMoneyTransfer(args: {
      items: MoneyTransferItem[];
      bulkReferenceNumber?: string;
    }): Promise<BulkMoneyTransferResponse> {
      if (args.items.length === 0) {
        throw new Error("items must not be empty");
      }
      if (args.items.length > 300) {
        throw new Error("a bulk money transfer may contain at most 300 items");
      }
      const payload: Record<string, unknown> = { items: args.items.map((item) => ({ ...item })) };
      if (args.bulkReferenceNumber !== undefined) {
        payload.bulkReferenceNumber = args.bulkReferenceNumber;
      }
      const first = args.items[0];
      const hashPayload = {
        referenceNumber: first.referenceNumber,
        amount: first.amount,
        destinationAccount: first.destinationAccount,
        itemCount: args.items.length,
      };
      return this.request<BulkMoneyTransferResponse>("POST", "/moneyTransferBulk", payload, {
        useHash: true,
        useBasic: false,
        baseUrl: this.businessBaseUrl,
        hashFields: MONEY_TRANSFER_BULK_HASH_FIELDS,
        hashPayload,
        raiseOnError: false,
      });
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
