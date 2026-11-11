/**
 * Customer registration and KYC operations.
 *
 * Registering a customer on the Business API is how you open an account for
 * someone. The plain registration takes the customer's details; the KYC
 * variants additionally take photographs, and are sent as
 * `multipart/form-data`.
 */

import {
  CUSTOMER_ACCOUNT_PHOTO_HASH_FIELDS,
  CUSTOMER_HASH_FIELDS,
  CUSTOMER_IDENTIFICATION_HASH_FIELDS,
} from "./auth.js";
import type { Constructor, PagaTransport } from "./base.js";
import type { CustomerResponse } from "./types.js";

export function CustomerOperations<TBase extends Constructor<PagaTransport>>(Base: TBase) {
  abstract class CustomerMixin extends Base {
    /**
     * Register a customer.
     *
     * Operation: Business API - Register a customer.
     */
    async registerCustomer(args: {
      referenceNumber: string;
      customerPhoneNumber: string;
      customerFirstName: string;
      customerLastName: string;
      customerEmail: string;
      customerDateOfBirth: string;
      customerAddress?: Record<string, unknown>;
      customerReference?: string;
    }): Promise<CustomerResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        customerPhoneNumber: args.customerPhoneNumber,
        customerFirstName: args.customerFirstName,
        customerLastName: args.customerLastName,
        customerEmail: args.customerEmail,
        customerDateOfBirth: args.customerDateOfBirth,
      };
      if (args.customerAddress !== undefined) payload.customerAddress = args.customerAddress;
      if (args.customerReference !== undefined) payload.customerReference = args.customerReference;

      return this.request<CustomerResponse>("POST", "/registerCustomer", payload, {
        useHash: true,
        useBasic: false,
        baseUrl: this.businessBaseUrl,
        hashFields: CUSTOMER_HASH_FIELDS,
      });
    }

    /**
     * Register a customer with KYC photographs.
     *
     * Operation: Business API - Register a customer with KYC.
     *
     * Each photograph must be a JPEG of at most 500 KB.
     */
    async registerCustomerWithKyc(args: {
      referenceNumber: string;
      customerPhoneNumber: string;
      customerEmail: string;
      customerFirstName: string;
      customerLastName: string;
      customerDateOfBirth: string;
      customerGender: string;
      customerAccountPhoto: Uint8Array;
      customerIdPhoto: Uint8Array;
      customerAddress?: Record<string, unknown>;
      customerMaritalStatus?: string;
      customerPreferredLanguageISOCode?: string;
      customerIdType?: string;
      customerIdNumber?: string;
      customerIdExpirationDate?: string;
      optinForWalletSavings?: boolean;
      customerReference?: string;
    }): Promise<CustomerResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        customerPhoneNumber: args.customerPhoneNumber,
        customerEmail: args.customerEmail,
        customerFirstName: args.customerFirstName,
        customerLastName: args.customerLastName,
        customerDateOfBirth: args.customerDateOfBirth,
        customerGender: args.customerGender,
      };
      if (args.customerAddress !== undefined) payload.customerAddress = args.customerAddress;
      if (args.customerMaritalStatus !== undefined) payload.customerMaritalStatus = args.customerMaritalStatus;
      if (args.customerPreferredLanguageISOCode !== undefined) {
        payload.customerPreferredLanguageISOCode = args.customerPreferredLanguageISOCode;
      }
      if (args.customerIdType !== undefined) payload.customerIdType = args.customerIdType;
      if (args.customerIdNumber !== undefined) payload.customerIdNumber = args.customerIdNumber;
      if (args.customerIdExpirationDate !== undefined) {
        payload.customerIdExpirationDate = args.customerIdExpirationDate;
      }
      if (args.optinForWalletSavings !== undefined) payload.optinForWalletSavings = args.optinForWalletSavings;
      if (args.customerReference !== undefined) payload.customerReference = args.customerReference;

      return this.requestMultipart<CustomerResponse>(
        "POST",
        "/registerCustomerWithKYC",
        {
          customer: payload,
          customerAccountPhoto: args.customerAccountPhoto,
          customerIdPhoto: args.customerIdPhoto,
        },
        { useHash: true, hashFields: CUSTOMER_HASH_FIELDS, hashPayload: payload },
      );
    }

    /**
     * Upload a customer's account photograph.
     *
     * Operation: Business API - Register a customer account photo.
     */
    async registerCustomerAccountPhoto(args: {
      referenceNumber: string;
      customerPhoneNumber: string;
      customerAccountPhoto: Uint8Array;
    }): Promise<CustomerResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        customerPhoneNumber: args.customerPhoneNumber,
      };
      return this.requestMultipart<CustomerResponse>(
        "POST",
        "/registerCustomerAccountPhoto",
        {
          customer: payload,
          customerAccountPhoto: args.customerAccountPhoto,
        },
        { useHash: true, hashFields: CUSTOMER_ACCOUNT_PHOTO_HASH_FIELDS, hashPayload: payload },
      );
    }

    /**
     * Upload a customer's identification.
     *
     * Operation: Business API - Register a customer identification.
     */
    async registerCustomerIdentification(args: {
      referenceNumber: string;
      customerPhoneNumber: string;
      customerIdType: string;
      customerIdNumber: string;
      customerIdExpirationDate: string;
      customerIdPhoto: Uint8Array;
    }): Promise<CustomerResponse> {
      const payload: Record<string, unknown> = {
        referenceNumber: args.referenceNumber,
        customerPhoneNumber: args.customerPhoneNumber,
        customerIdType: args.customerIdType,
        customerIdNumber: args.customerIdNumber,
        customerIdExpirationDate: args.customerIdExpirationDate,
      };
      return this.requestMultipart<CustomerResponse>(
        "POST",
        "/registerCustomerIdentification",
        {
          customer: payload,
          customerIdPhoto: args.customerIdPhoto,
        },
        { useHash: true, hashFields: CUSTOMER_IDENTIFICATION_HASH_FIELDS, hashPayload: payload },
      );
    }
  }

  return CustomerMixin;
}

export type CustomerClient = ReturnType<typeof CustomerOperations>;
