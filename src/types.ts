/** Response and payload types for the Paga Engine API. */

export interface PagaResponse {
  statusCode?: string;
  statusMessage?: string;
  responseCode?: number;
  message?: string;
  referenceNumber?: string;
  transactionId?: string;
  [key: string]: unknown;
}

export interface CollectPaymentMethodResult {
  name?: string;
  properties?: Record<string, unknown>;
}

export interface CollectPaymentRequestResponse extends PagaResponse {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  requestAmount?: number;
  totalPaymentAmount?: number;
  paymentMethods?: CollectPaymentMethodResult[];
  expiryDateTimeUTC?: string;
}

export interface CheckoutVerifyChargeResponse {
  status_code?: number;
  status_message?: string;
  chargeId?: string;
  amount?: number;
  currency?: string;
}

export interface MerchantPaymentResponse {
  responseCode?: number;
  responseCategoryCode?: number;
  message?: string;
  referenceNumber?: string;
  merchantTransactionReference?: string;
  integrationStatus?: string;
}

export interface PurchaseResponse {
  responseCode?: number;
  statusCode?: string;
  statusMessage?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
}

export interface AccountBalanceResponse {
  referenceNumber?: string;
  responseCode?: number;
  totalBalance?: string;
  availableBalance?: number;
  currency?: string;
}

export interface TransactionItem {
  referenceNumber?: string;
  status?: string;
  amount?: number;
  fee?: number;
  balance?: number;
  dateUTC?: number;
}

export interface TransactionHistoryResponse {
  referenceNumber?: string;
  responseCode?: number;
  items?: TransactionItem[];
}

export interface PaymentStatusData {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  requestAmount?: number;
  totalPaymentAmount?: number;
  expiryDateTimeUTC?: string;
  additionalData?: Record<string, unknown>;
  refundStatus?: string;
}

export interface PaymentStatusResponse {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  data?: PaymentStatusData;
}

export interface DepositToBankResponse {
  referenceNumber?: string;
  responseCode?: number;
  message?: string;
  transactionId?: string;
  destinationAccountHolderNameAtBank?: string;
  fee?: number;
  vat?: number;
  currency?: string;
  exchangeRate?: number;
  sessionId?: string;
}

export interface RefundResponse {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  refundAmount?: number;
  currency?: string;
  refundDestination?: string;
}

export interface PagaPaymentCallback {
  event?: string;
  notificationId?: string;
  statusCode?: string;
  statusMessage?: string;
  externalReferenceNumber?: string;
  state?: string;
  outstandingBalance?: number;
  paymentAmount?: number;
  cumulativePaymentAmount?: number;
  collectionFee?: number;
  fundingDetails?: Record<string, unknown>;
  hash?: string;
  [key: string]: unknown;
}

export interface SubsidiaryAccountResponse {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  accountNumber?: string;
  accountReference?: string;
  status?: string;
  balance?: number;
  currency?: string;
}

export interface SubsidiaryMoneyResponse {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  transactionId?: string;
  newBalance?: number;
}

export interface SubsidiaryTransferResponse {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  transactionId?: string;
  source?: Record<string, unknown>;
  destination?: Record<string, unknown>;
}

export interface SubsidiaryBalanceResponse {
  statusCode?: string;
  accountReference?: string;
  accountNumber?: string;
  balance?: number;
  currency?: string;
  timeStamp?: string;
}

export interface SubsidiaryHistoryResponse {
  statusCode?: string;
  itemCount?: number;
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  transactions?: TransactionItem[];
}
