/**
 * Persistent payment account operations.
 *
 * A persistent payment account is a standing instruction that lets a
 * customer pay you repeatedly from the same account.
 */

import {
  DELETE_PERSISTENT_ACCOUNT_HASH_FIELDS,
  GET_PERSISTENT_ACCOUNT_HASH_FIELDS,
  REGISTER_PERSISTENT_ACCOUNT_HASH_FIELDS,
  UPDATE_PERSISTENT_ACCOUNT_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type { PagaResponse, PersistentPaymentAccountResponse } from "./types.js";

export function PersistentAccountOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class PersistentMixin extends Base {
    /**
     * Register a persistent payment account.
     *
     * Operation: Collect API - Register a persistent payment account.
     *
     * `accountReference` must be 11 to 30 characters.
     */
    async registerPersistentPaymentAccount(args: {
      referenceNumber: string;
      accountReference: string;
      financialIdentificationNumber: string;
      creditBankId: string;
      creditBankAccountNumber: string;
      callbackUrl: string;
    }): Promise<PersistentPaymentAccountResponse> {
      return this.request<PersistentPaymentAccountResponse>(
        "POST",
        "/registerPersistentPaymentAccount",
        {
          referenceNumber: args.referenceNumber,
          accountReference: args.accountReference,
          financialIdentificationNumber: args.financialIdentificationNumber,
          creditBankId: args.creditBankId,
          creditBankAccountNumber: args.creditBankAccountNumber,
          callbackUrl: args.callbackUrl,
        },
        { useHash: true, useBasic: true, hashFields: REGISTER_PERSISTENT_ACCOUNT_HASH_FIELDS },
      );
    }

    /**
     * Delete a persistent payment account.
     *
     * Operation: Collect API - Delete a persistent payment account.
     */
    async deletePersistentPaymentAccount(args: {
      referenceNumber: string;
      accountIdentifier: string;
    }): Promise<PagaResponse> {
      return this.request<PagaResponse>(
        "POST",
        "/deletePersistentPaymentAccount",
        {
          referenceNumber: args.referenceNumber,
          accountIdentifier: args.accountIdentifier,
        },
        { useHash: true, useBasic: true, hashFields: DELETE_PERSISTENT_ACCOUNT_HASH_FIELDS },
      );
    }

    /**
     * Update a persistent payment account.
     *
     * Operation: Collect API - Update a persistent payment account.
     *
     * Every field takes part in the hash, so send the current value of the
     * ones you are not changing.
     */
    async updatePersistentPaymentAccount(args: {
      referenceNumber: string;
      accountIdentifier: string;
      financialIdentificationNumber?: string;
      creditBankId?: string;
      creditBankAccountNumber?: string;
      callbackUrl?: string;
    }): Promise<PersistentPaymentAccountResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        accountIdentifier: args.accountIdentifier,
      };
      if (args.financialIdentificationNumber !== undefined) {
        payload.financialIdentificationNumber = args.financialIdentificationNumber;
      }
      if (args.creditBankId !== undefined) payload.creditBankId = args.creditBankId;
      if (args.creditBankAccountNumber !== undefined) {
        payload.creditBankAccountNumber = args.creditBankAccountNumber;
      }
      if (args.callbackUrl !== undefined) payload.callbackUrl = args.callbackUrl;

      return this.request<PersistentPaymentAccountResponse>(
        "POST",
        "/updatePersistentPaymentAccount",
        payload,
        { useHash: true, useBasic: true, hashFields: UPDATE_PERSISTENT_ACCOUNT_HASH_FIELDS },
      );
    }

    /**
     * Get a persistent payment account.
     *
     * Operation: Collect API - Get a persistent payment account.
     */
    async getPersistentPaymentAccount(args: {
      referenceNumber: string;
      accountIdentifier: string;
    }): Promise<PersistentPaymentAccountResponse> {
      return this.request<PersistentPaymentAccountResponse>(
        "POST",
        "/getPersistentPaymentAccount",
        {
          referenceNumber: args.referenceNumber,
          accountIdentifier: args.accountIdentifier,
        },
        { useHash: true, useBasic: true, hashFields: GET_PERSISTENT_ACCOUNT_HASH_FIELDS },
      );
    }

  }

  return PersistentMixin;
}

export type PersistentAccountClient = ReturnType<typeof PersistentAccountOperations>;
