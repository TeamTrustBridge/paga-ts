/**
 * Subsidiary account operations for the Paga Engine API.
 *
 * Covers the **Manage accounts → Subsidiary accounts** section of Paga's
 * documentation.
 *
 * A subsidiary account is a Paga account for one of your customers, held on
 * your behalf. You can issue, hold and move money on their account, and set
 * it up to sweep straight into a bank account.
 */

import {
  SUBSIDIARY_ACCOUNT_HASH_FIELDS,
  SUBSIDIARY_BALANCE_HASH_FIELDS,
  SUBSIDIARY_CHARGE_HASH_FIELDS,
  SUBSIDIARY_HISTORY_HASH_FIELDS,
  SUBSIDIARY_RETRIEVE_HASH_FIELDS,
  SUBSIDIARY_TOPUP_HASH_FIELDS,
  SUBSIDIARY_TRANSFER_HASH_FIELDS,
  SUBSIDIARY_UPDATE_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type {
  SubsidiaryAccountResponse,
  SubsidiaryBalanceResponse,
  SubsidiaryHistoryResponse,
  SubsidiaryMoneyResponse,
  SubsidiaryTransferResponse,
} from "./types.js";

export function SubsidiaryOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class SubsidiaryMixin extends Base {
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
  }

  return SubsidiaryMixin;
}

export type SubsidiaryClient = ReturnType<typeof SubsidiaryOperations>;
