/**
 * Money transfer operations for the Paga Engine API.
 *
 * Covers the **Make payments → Money Transfer** section of Paga's
 * documentation.
 */

import {
  BANKS_HASH_FIELDS,
  MONEY_TRANSFER_BULK_HASH_FIELDS,
  MONEY_TRANSFER_HASH_FIELDS,
  PAGA_WALLET_TRANSFER_HASH_FIELDS,
  VALIDATE_DEPOSIT_TO_BANK_HASH_FIELDS,
  VALIDATE_MONEY_TRANSFER_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type {
  BanksResponse,
  BulkMoneyTransferResponse,
  DepositToBankResponse,
  MoneyTransferItem,
  MoneyTransferResponse,
  ValidateDepositToBankResponse,
  ValidateMoneyTransferResponse,
} from "./types.js";

export function MoneyTransferOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class MoneyTransferMixin extends Base {
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
  }

  return MoneyTransferMixin;
}

export type MoneyTransferClient = ReturnType<typeof MoneyTransferOperations>;
