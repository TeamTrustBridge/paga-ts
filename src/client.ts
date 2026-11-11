/**
 * Async client for the Paga Engine API.
 */

import {
  ACCOUNT_BALANCE_HASH_FIELDS,
  AIRTIME_HASH_FIELDS,
  BILL_PAYMENT_HASH_FIELDS,
  MONEY_TRANSFER_HASH_FIELDS,
  PAYMENT_STATUS_HASH_FIELDS,
  REFUND_HASH_FIELDS,
  SUBSIDIARY_ACCOUNT_HASH_FIELDS,
  SUBSIDIARY_BALANCE_HASH_FIELDS,
  SUBSIDIARY_CHARGE_HASH_FIELDS,
  SUBSIDIARY_HISTORY_HASH_FIELDS,
  SUBSIDIARY_RETRIEVE_HASH_FIELDS,
  SUBSIDIARY_TOPUP_HASH_FIELDS,
  SUBSIDIARY_TRANSFER_HASH_FIELDS,
  SUBSIDIARY_UPDATE_HASH_FIELDS,
  TRANSACTION_HISTORY_HASH_FIELDS,
  computePagaHash,
} from "./auth";
import {
  PagaAPIError,
  PagaAuthenticationError,
  PagaRateLimitError,
} from "./errors";
import type {
  AccountBalanceResponse,
  CheckoutVerifyChargeResponse,
  CollectPaymentRequestResponse,
  DepositToBankResponse,
  MerchantPaymentResponse,
  PaymentStatusResponse,
  PagaPaymentCallback,
  PagaResponse,
  PurchaseResponse,
  RefundResponse,
  SubsidiaryAccountResponse,
  SubsidiaryBalanceResponse,
  SubsidiaryHistoryResponse,
  SubsidiaryMoneyResponse,
  SubsidiaryTransferResponse,
  TransactionHistoryResponse,
} from "./types";
import {
  verifyCheckoutNotification,
  verifyFundingNotification,
  verifyPaymentCallback,
  verifySubsidiaryOperation,
} from "./webhooks";

export interface PagaClientOptions {
  environment?: "test" | "live";
  baseUrl?: string;
  checkoutBaseUrl?: string;
  businessBaseUrl?: string;
  timeoutMs?: number;
}

type RequestOptions = {
  useHash?: boolean;
  useBasic?: boolean;
  baseUrl?: string;
  hashFields?: string[];
  raiseOnError?: boolean;
};

export class PagaClient {
  public readonly publicKey: string;
  public readonly secretKey: string;
  public readonly hashKey: string;
  public readonly environment: "test" | "live";
  public readonly baseUrl: string;
  public readonly checkoutBaseUrl: string;
  public readonly businessBaseUrl: string;

  constructor(publicKey: string, secretKey: string, hashKey: string, options: PagaClientOptions = {}) {
    if (options.environment !== undefined && options.environment !== "test" && options.environment !== "live") {
      throw new Error('environment must be either "test" or "live"');
    }
    this.publicKey = publicKey;
    this.secretKey = secretKey;
    this.hashKey = hashKey;
    this.environment = options.environment ?? "test";
    this.baseUrl = options.baseUrl ?? (this.environment === "test" ? "https://beta-collect.paga.com" : "https://collect.paga.com");
    this.checkoutBaseUrl = options.checkoutBaseUrl ?? (this.environment === "test" ? "https://beta-checkout.paga.com" : "https://checkout.paga.com");
    this.businessBaseUrl = options.businessBaseUrl ?? (this.environment === "test" ? "https://beta.mypaga.com/paga-webservices/business-rest/secured" : "https://www.mypaga.com/paga-webservices/business-rest/secured");
  }

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
  }): Promise<CollectPaymentRequestResponse> {
    const payload: Record<string, unknown> = {
      referenceNumber: args.referenceNumber,
      amount: args.amount,
      currency: args.currency ?? "NGN",
      payer: { name: args.payerName, phoneNumber: args.payerPhoneNumber },
      payee: { name: args.payeeName },
      payerCollectionFeeShare: args.payerCollectionFeeShare ?? 1,
      payeeCollectionFeeShare: args.payeeCollectionFeeShare ?? 0,
      paymentMethods: args.paymentMethods ?? ["BANK_TRANSFER"],
    };
    if (args.payerEmail) payload.payer = { ...(payload.payer as object), email: args.payerEmail };
    if (args.callBackUrl) payload.callBackUrl = args.callBackUrl;
    if (args.expiryDateTimeUTC) payload.expiryDateTimeUTC = args.expiryDateTimeUTC;
    if (args.isSuppressMessages) payload.isSuppressMessages = true;
    const response = await this.request("POST", "/paymentRequest", payload, {
      useHash: true,
      useBasic: true,
    });
    return response as CollectPaymentRequestResponse;
  }

  async getPaymentStatus(args: { referenceNumber: string }): Promise<PaymentStatusResponse> {
    const response = await this.request("POST", "/status", { referenceNumber: args.referenceNumber }, {
      useHash: true,
      useBasic: true,
      hashFields: PAYMENT_STATUS_HASH_FIELDS,
    });
    return response as PaymentStatusResponse;
  }

  async verifyCharge(args: {
    paymentReference: string;
    publicKey: string;
    amount: number;
    currency?: string;
  }): Promise<CheckoutVerifyChargeResponse> {
    const response = await this.request("POST", "/checkout/transaction/verify", {
      paymentReference: args.paymentReference,
      publicKey: args.publicKey,
      amount: args.amount,
      currency: args.currency ?? "NGN",
    }, {
      useHash: false,
      useBasic: true,
      baseUrl: this.checkoutBaseUrl,
    });
    return response as CheckoutVerifyChargeResponse;
  }

  async refundPayment(args: {
    referenceNumber: string;
    paymentRequestReference: string;
    refundAmount: number;
    currency?: string;
    reason?: string;
  }): Promise<RefundResponse> {
    const payload = {
      referenceNumber: args.referenceNumber,
      paymentRequestReference: args.paymentRequestReference,
      refundAmount: args.refundAmount,
      currency: args.currency ?? "NGN",
    };
    if (args.reason) (payload as Record<string, unknown>).reason = args.reason;
    const response = await this.request("POST", "/refund/v2", payload, {
      useHash: true,
      useBasic: true,
      hashFields: REFUND_HASH_FIELDS,
    });
    return response as RefundResponse;
  }

  async sendMoney(args: {
    referenceNumber: string;
    amount: string;
    destinationBankUUID: string;
    destinationBankAccountNumber: string;
    currency?: string;
    remarks?: string;
    statusCallbackUrl?: string;
  }): Promise<DepositToBankResponse> {
    const payload: Record<string, unknown> = {
      referenceNumber: args.referenceNumber,
      amount: args.amount,
      currency: args.currency ?? "NGN",
      destinationBankUUID: args.destinationBankUUID,
      destinationBankAccountNumber: args.destinationBankAccountNumber,
    };
    if (args.remarks) payload.remarks = args.remarks;
    if (args.statusCallbackUrl) payload.statusCallbackUrl = args.statusCallbackUrl;
    const response = await this.request("POST", "/depositToBank", payload, {
      useHash: true,
      useBasic: false,
      baseUrl: this.businessBaseUrl,
      hashFields: MONEY_TRANSFER_HASH_FIELDS,
      raiseOnError: false,
    });
    return response as DepositToBankResponse;
  }

  async buyAirtime(args: {
    referenceNumber: string;
    amount: string;
    destinationPhoneNumber: string;
    mobileOperatorPublicId: string;
    currency?: string;
    isDataBundle?: boolean;
    mobileOperatorServiceId?: string;
    isSuppressRecipientMessages?: boolean;
  }): Promise<PurchaseResponse> {
    const payload: Record<string, unknown> = {
      referenceNumber: args.referenceNumber,
      amount: args.amount,
      destinationPhoneNumber: args.destinationPhoneNumber,
      mobileOperatorPublicId: args.mobileOperatorPublicId,
      currency: args.currency ?? "NGN",
      isDataBundle: args.isDataBundle ?? false,
    };
    if (args.mobileOperatorServiceId) payload.mobileOperatorServiceId = args.mobileOperatorServiceId;
    if (args.isSuppressRecipientMessages) payload.isSuppressRecipientMessages = true;
    const response = await this.request("POST", "/airtimePurchase", payload, {
      useHash: true,
      useBasic: false,
      baseUrl: this.businessBaseUrl,
      hashFields: AIRTIME_HASH_FIELDS,
      raiseOnError: false,
    });
    return response as PurchaseResponse;
  }

  async payBill(args: {
    referenceNumber: string;
    amount: number;
    merchantAccount: string;
    merchantReferenceNumber: string;
    merchantService?: string[];
    currency?: string;
    paymentChannel?: string;
    locale?: string;
  }): Promise<MerchantPaymentResponse> {
    const payload: Record<string, unknown> = {
      referenceNumber: args.referenceNumber,
      amount: args.amount,
      merchantAccount: args.merchantAccount,
      merchantReferenceNumber: args.merchantReferenceNumber,
      currency: args.currency ?? "NGN",
    };
    if (args.merchantService) payload.merchantService = args.merchantService;
    if (args.paymentChannel) payload.paymentChannel = args.paymentChannel;
    if (args.locale) payload.locale = args.locale;
    const response = await this.request("POST", "/merchantPayment", payload, {
      useHash: true,
      useBasic: false,
      baseUrl: this.businessBaseUrl,
      hashFields: BILL_PAYMENT_HASH_FIELDS,
      raiseOnError: false,
    });
    return response as MerchantPaymentResponse;
  }

  async getBusinessBalance(args: { referenceNumber: string }): Promise<AccountBalanceResponse> {
    const response = await this.request("POST", "/accountBalance", { referenceNumber: args.referenceNumber }, {
      useHash: true,
      useBasic: false,
      baseUrl: this.businessBaseUrl,
      hashFields: ACCOUNT_BALANCE_HASH_FIELDS,
      raiseOnError: false,
    });
    return response as AccountBalanceResponse;
  }

  async getBusinessTransactions(args: {
    referenceNumber: string;
    startDateUTC: string;
    endDateUTC: string;
  }): Promise<TransactionHistoryResponse> {
    const response = await this.request("POST", "/transactionHistory", {
      referenceNumber: args.referenceNumber,
      startDateUTC: args.startDateUTC,
      endDateUTC: args.endDateUTC,
    }, {
      useHash: true,
      useBasic: false,
      baseUrl: this.businessBaseUrl,
      hashFields: TRANSACTION_HISTORY_HASH_FIELDS,
    });
    return response as TransactionHistoryResponse;
  }

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
    if (args.firstName) payload.firstName = args.firstName;
    if (args.lastName) payload.lastName = args.lastName;
    if (args.phoneNumber) payload.phoneNumber = args.phoneNumber;
    if (args.email) payload.email = args.email;
    if (args.iifiNumber) payload.iifiNumber = args.iifiNumber;
    if (args.fundingTransactionLimit !== undefined) payload.fundingTransactionLimit = args.fundingTransactionLimit;
    if (args.fundingDailyLimit !== undefined) payload.fundingDailyLimit = args.fundingDailyLimit;
    if (args.status) payload.status = args.status;
    if (args.autoSweepDestination) {
      const autoSweep: Record<string, unknown> = { destination: args.autoSweepDestination };
      if (args.autoSweepDestination === "BANK") {
        if (args.autoSweepBankPublicId) autoSweep.bankPublicId = args.autoSweepBankPublicId;
        if (args.autoSweepAccountNumber) autoSweep.accountNumber = args.autoSweepAccountNumber;
      }
      payload.autoSweep = autoSweep;
    }
    if (args.callbackUrl) payload.callbackUrl = args.callbackUrl;
    const response = await this.request("POST", "/subsidiary-accounts", payload, {
      useHash: true,
      useBasic: true,
      hashFields: SUBSIDIARY_ACCOUNT_HASH_FIELDS,
    });
    return response as SubsidiaryAccountResponse;
  }

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
    if (args.narration) payload.narration = args.narration;
    const response = await this.request("POST", `/subsidiary-accounts/${args.accountReference}/charge`, payload, {
      useHash: true,
      useBasic: true,
      hashFields: SUBSIDIARY_CHARGE_HASH_FIELDS,
    });
    return response as SubsidiaryMoneyResponse;
  }

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
    if (args.narration) payload.narration = args.narration;
    const response = await this.request("POST", `/subsidiary-accounts/${args.accountReference}/topup`, payload, {
      useHash: true,
      useBasic: true,
      hashFields: SUBSIDIARY_TOPUP_HASH_FIELDS,
    });
    return response as SubsidiaryMoneyResponse;
  }

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
    if (args.narration) payload.narration = args.narration;
    const response = await this.request("POST", "/subsidiary-accounts/transfer", payload, {
      useHash: true,
      useBasic: true,
      hashFields: SUBSIDIARY_TRANSFER_HASH_FIELDS,
    });
    return response as SubsidiaryTransferResponse;
  }

  async retrieveSubsidiaryAccount(args: {
    accountReference: string;
    referenceNumber: string;
  }): Promise<SubsidiaryAccountResponse> {
    const response = await this.request(
      "GET",
      `/subsidiary-accounts/${args.accountReference}`,
      { referenceNumber: args.referenceNumber, accountIdentifier: args.accountReference },
      { useHash: true, useBasic: true, baseUrl: this.baseUrl, hashFields: SUBSIDIARY_RETRIEVE_HASH_FIELDS },
    );
    return response as SubsidiaryAccountResponse;
  }

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
    if (args.accountName) payload.accountName = args.accountName;
    if (args.iifiNumber) payload.iifiNumber = args.iifiNumber;
    if (args.status) payload.status = args.status;
    if (args.autoSweepDestination) {
      const autoSweep: Record<string, unknown> = { destination: args.autoSweepDestination };
      if (args.autoSweepDestination === "BANK") {
        if (args.autoSweepBankPublicId) autoSweep.bankPublicId = args.autoSweepBankPublicId;
        if (args.autoSweepAccountNumber) autoSweep.accountNumber = args.autoSweepAccountNumber;
      }
      payload.autoSweep = autoSweep;
    }
    if (args.callbackUrl) payload.callbackUrl = args.callbackUrl;
    const response = await this.request("PUT", `/subsidiary-accounts/${args.accountReference}`, payload, {
      useHash: true,
      useBasic: true,
      hashFields: SUBSIDIARY_UPDATE_HASH_FIELDS,
    });
    return response as SubsidiaryAccountResponse;
  }

  async getSubsidiaryBalance(args: {
    accountReference: string;
    referenceNumber: string;
  }): Promise<SubsidiaryBalanceResponse> {
    const response = await this.request(
      "GET",
      `/subsidiary-accounts/${args.accountReference}/balance`,
      { referenceNumber: args.referenceNumber, accountIdentifier: args.accountReference },
      { useHash: true, useBasic: true, baseUrl: this.baseUrl, hashFields: SUBSIDIARY_BALANCE_HASH_FIELDS },
    );
    const body = response as SubsidiaryBalanceResponse;
    return body;
  }

  async getSubsidiaryHistory(args: {
    accountReference: string;
    referenceNumber: string;
    startDateTimeUTC: string;
    endDateTimeUTC: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<SubsidiaryHistoryResponse> {
    const params = new URLSearchParams();
    params.set("referenceNumber", args.referenceNumber);
    params.set("startDateTimeUTC", args.startDateTimeUTC);
    params.set("endDateTimeUTC", args.endDateTimeUTC);
    params.set("pageSize", String(args.pageSize ?? 20));
    params.set("pageNumber", String(args.pageNumber ?? 0));
    const response2 = await this.requestWithParams("GET", `/subsidiary-accounts/${args.accountReference}/history`, undefined, {
      useHash: true,
      useBasic: true,
      baseUrl: this.baseUrl,
      hashFields: SUBSIDIARY_HISTORY_HASH_FIELDS,
      params,
    });
    return response2 as SubsidiaryHistoryResponse;
  }

  private async request(
    method: string,
    path: string,
    payload: unknown,
    options: RequestOptions = {},
  ): Promise<PagaResponse> {
    const baseUrl = options.baseUrl ?? this.baseUrl;
    const url = `${baseUrl.replace(/\/$/, "")}${path}`;
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (options.useBasic) {
      headers.authorization = `Basic ${btoa(`${this.publicKey}:${this.secretKey}`)}`;
    } else if (options.useHash) {
      headers.principal = this.publicKey;
      headers.credentials = this.secretKey;
    }
    if (options.useHash && payload) {
      headers.hash = await computePagaHash(
        payload as Record<string, unknown>,
        this.hashKey,
        options.hashFields,
      );
    }
    const hasBody = method !== "GET" && method !== "DELETE";
    const res = await fetch(url, {
      method,
      headers,
      body: hasBody && payload !== undefined && payload !== null ? JSON.stringify(payload) : undefined,
    });
    if (res.status === 429) {
      throw new PagaRateLimitError("Paga rate limit exceeded");
    }
    if (res.status === 401 || res.status === 403) {
      throw new PagaAuthenticationError(`Paga authentication failed with status ${res.status}`);
    }
    const body = (await res.json().catch(() => ({}))) as PagaResponse;
    if (options.raiseOnError ?? true) {
      const statusCode = body?.statusCode;
      const isSuccess = body?.responseCode === 0 || statusCode === "0";
      if (!isSuccess) {
        throw new PagaAPIError(body?.message ?? `Paga request failed`, {
          statusCode: res.status,
          responseCode: body?.responseCode,
          payload: body,
        });
      }
    }
    return body;
  }

  private async requestWithParams(
    method: string,
    path: string,
    payload: unknown,
    options: RequestOptions & { params?: URLSearchParams },
  ): Promise<PagaResponse> {
    const baseUrl = options.baseUrl ?? this.baseUrl;
    const url = `${baseUrl.replace(/\/$/, "")}${path}`;
    const query = options.params ? `?${options.params.toString()}` : "";
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (options.useBasic) {
      headers.authorization = `Basic ${btoa(`${this.publicKey}:${this.secretKey}`)}`;
    } else if (options.useHash) {
      headers.principal = this.publicKey;
      headers.credentials = this.secretKey;
    }
    if (options.useHash && payload) {
      headers.hash = await computePagaHash(payload as Record<string, unknown>, this.hashKey, options.hashFields);
    }
    const hasBody = method !== "GET" && method !== "DELETE";
    const res = await fetch(`${url}${query}`, {
      method,
      headers,
      body: hasBody && payload !== undefined && payload !== null ? JSON.stringify(payload) : undefined,
    });
    if (res.status === 429) throw new PagaRateLimitError("Paga rate limit exceeded");
    if (res.status === 401 || res.status === 403) throw new PagaAuthenticationError(`Paga authentication failed with status ${res.status}`);
    const body = (await res.json().catch(() => ({}))) as PagaResponse;
    if (options.raiseOnError ?? true) {
      const statusCode = body?.statusCode;
      const isSuccess = body?.responseCode === 0 || statusCode === "0";
      if (!isSuccess) throw new PagaAPIError(body?.message ?? "Paga request failed", { statusCode: res.status, responseCode: body?.responseCode, payload: body });
    }
    return body;
  }
}
