/**
 * Direct Debit (Open Banking) operations.
 *
 * The flow is: start a hosted set-up session (or create a mandate by API),
 * wait for the mandate callback, then charge the mandate. Only charge a
 * mandate whose `ProcessStatusId` is `APPROVED`.
 */

import {
  CHARGE_MANDATE_HASH_FIELDS,
  CHARGE_MANDATE_STATUS_HASH_FIELDS,
  DISABLE_MANDATE_HASH_FIELDS,
  MANDATE_STATUS_HASH_FIELDS,
  PAYMENT_REQUEST_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type {
  ChargeMandateResponse,
  ChargeMandateStatusResponse,
  DisableMandateResponse,
  DirectDebitSessionResponse,
  MandateStatusResponse,
  PagaResponse,
} from "./types.js";

export function DirectDebitOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class DirectDebitMixin extends Base {
    /**
     * Start a hosted Direct Debit set-up session.
     *
     * Operation: Direct Debit - Start a hosted set-up session.
     *
     * Redirect your customer to the returned `checkoutUrl`. This endpoint
     * uses HTTP Basic only — it sends no `hash` header.
     */
    async startDirectDebitSession(args: {
      referenceNumber: string;
      accountReference: string;
      amountLimit: number;
      callbackUrl: string;
      redirectUrl?: string;
      sessionExpirySeconds?: string;
      paymentExpirySeconds?: string;
      payerPhoneNumber?: string;
      payerEmail?: string;
      authorizationAmount?: number;
    }): Promise<DirectDebitSessionResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        accountReference: args.accountReference,
        amountLimit: args.amountLimit,
        paymentMethods: ["BANK_ACCOUNT_DIRECT_DEBIT"],
        callbackUrl: args.callbackUrl,
      };
      if (args.redirectUrl !== undefined) payload.redirectUrl = args.redirectUrl;
      if (args.sessionExpirySeconds !== undefined) payload.sessionExpirySeconds = args.sessionExpirySeconds;
      if (args.paymentExpirySeconds !== undefined) payload.paymentExpirySeconds = args.paymentExpirySeconds;
      const additional: Record<string, unknown> = {};
      if (args.payerPhoneNumber !== undefined) additional.payerPhoneNumber = args.payerPhoneNumber;
      if (args.payerEmail !== undefined) additional.payerEmail = args.payerEmail;
      if (args.authorizationAmount !== undefined) additional.authorizationAmount = args.authorizationAmount;
      if (Object.keys(additional).length > 0) payload.additionalProperties = additional;

      return this.request<DirectDebitSessionResponse>(
        "POST",
        "/checkout/charge-process/start",
        payload,
        { useHash: false, useBasic: true, baseUrl: this.checkoutBaseUrl },
      );
    }

    /**
     * Set up a mandate by API, without a hosted session.
     *
     * Operation: Direct Debit - Set up a mandate by API.
     *
     * The authorisation transfer must come from mobile banking, internet
     * banking or a branch — not from POS, USSD or ATM.
     */
    async createDirectDebitMandate(args: {
      referenceNumber: string;
      amount: number;
      payerName: string;
      payerPhoneNumber: string;
      payeeName: string;
      accountReference: string;
      currency?: string;
      payerEmail?: string;
      payerAddress?: string;
      payerBankId?: string;
      payerBankAccountNumber?: string;
      payerCurrency?: string;
      callBackUrl?: string;
      redirectUrl?: string;
      narration?: string;
      expiryDateTimeUTC?: string;
      isSingleUse?: boolean;
      isAllowPartialPayments?: boolean;
      isAllowOverPayments?: boolean;
      isSuppressMessages?: boolean;
      payerCollectionFeeShare?: number;
      payeeCollectionFeeShare?: number;
    }): Promise<PagaResponse> {
      const payer: Record<string, unknown> = {
        name: args.payerName,
        phoneNumber: args.payerPhoneNumber,
      };
      if (args.payerEmail !== undefined) payer.email = args.payerEmail;
      if (args.payerAddress !== undefined) payer.address = args.payerAddress;
      if (args.payerBankId !== undefined) payer.bankId = args.payerBankId;
      if (args.payerBankAccountNumber !== undefined) payer.bankAccountNumber = args.payerBankAccountNumber;
      if (args.payerCurrency !== undefined) payer.currency = args.payerCurrency;

      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        amount: args.amount,
        currency: args.currency ?? "NGN",
        accountReference: args.accountReference,
        payer,
        payee: { name: args.payeeName },
        paymentMethods: ["DIRECT_DEBIT"],
        isSingleUse: args.isSingleUse ?? true,
        isAllowPartialPayments: args.isAllowPartialPayments ?? false,
        isAllowOverPayments: args.isAllowOverPayments ?? false,
        payerCollectionFeeShare: args.payerCollectionFeeShare ?? 1,
        payeeCollectionFeeShare: args.payeeCollectionFeeShare ?? 0,
      };
      if (args.callBackUrl !== undefined) payload.callBackUrl = args.callBackUrl;
      if (args.redirectUrl !== undefined) payload.redirectUrl = args.redirectUrl;
      if (args.narration !== undefined) payload.narration = args.narration;
      if (args.expiryDateTimeUTC !== undefined) payload.expiryDateTimeUTC = args.expiryDateTimeUTC;
      if (args.isSuppressMessages) payload.isSuppressMessages = true;

      return this.request<PagaResponse>("POST", "/paymentRequest", payload, {
        useHash: true,
        useBasic: true,
        hashFields: PAYMENT_REQUEST_HASH_FIELDS,
      });
    }

    /**
     * Check a mandate's status.
     *
     * Operation: Direct Debit - Check mandate status.
     *
     * Read `data.additionalData.mandate[].ProcessStatusId`. The response's
     * own `data.statusCode` stays `"1"` / `"pending"` forever.
     */
    async getMandateStatus(args: { referenceNumber: string }): Promise<MandateStatusResponse> {
      return this.request<MandateStatusResponse>(
        "POST",
        "/status",
        { referenceNumber: args.referenceNumber },
        {
          useHash: true,
          useBasic: true,
          hashFields: MANDATE_STATUS_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * Charge an approved mandate.
     *
     * Operation: Direct Debit - Charge the mandate.
     *
     * A successful response means the charge was accepted, not completed.
     */
    async chargeMandate(args: {
      referenceNumber: string;
      amount: number;
      accountReference: string;
    }): Promise<ChargeMandateResponse> {
      return this.request<ChargeMandateResponse>(
        "POST",
        "/chargeDebitMandate",
        {
          referenceNumber: args.referenceNumber,
          amount: args.amount,
          accountReference: args.accountReference,
        },
        { useHash: true, useBasic: true, hashFields: CHARGE_MANDATE_HASH_FIELDS },
      );
    }

    /**
     * Check a mandate charge's status.
     *
     * Operation: Direct Debit - Check charge status.
     */
    async getChargeMandateStatus(args: {
      referenceNumber: string;
    }): Promise<ChargeMandateStatusResponse> {
      return this.request<ChargeMandateStatusResponse>(
        "POST",
        "/getChargeMandateStatus",
        { referenceNumber: args.referenceNumber },
        {
          useHash: true,
          useBasic: true,
          hashFields: CHARGE_MANDATE_STATUS_HASH_FIELDS,
          raiseOnError: false,
        },
      );
    }

    /**
     * Disable a mandate.
     *
     * Operation: Direct Debit - Disable a mandate.
     *
     * Its `ProcessStatusId` then becomes `REJECTED` and it can never be
     * charged again.
     */
    async disableMandate(args: {
      referenceNumber: string;
      accountReference: string;
    }): Promise<DisableMandateResponse> {
      return this.request<DisableMandateResponse>(
        "POST",
        "/disableMandate",
        {
          referenceNumber: args.referenceNumber,
          accountReference: args.accountReference,
        },
        { useHash: true, useBasic: true, hashFields: DISABLE_MANDATE_HASH_FIELDS },
      );
    }
  }

  return DirectDebitMixin;
}

export type DirectDebitClient = ReturnType<typeof DirectDebitOperations>;
