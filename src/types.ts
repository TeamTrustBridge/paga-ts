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

/* -------------------------------------------------------------------------- */
/* Directory lookups                                                          */
/* -------------------------------------------------------------------------- */

export interface CollectBank {
  name?: string;
  uuid?: string;
}

export interface CollectBanksResponse {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  banks?: CollectBank[];
}

export interface Bank {
  uuid?: string;
  name?: string;
  interInstitutionCode?: string;
  sortCode?: string;
}

export interface BanksResponse {
  referenceNumber?: string;
  responseCode?: number;
  message?: string;
  banks?: Bank[];
  /** The singular key Paga's legacy operations page documents. */
  bank?: Bank[];
}

export interface MobileOperator {
  name?: string;
  mobileOperatorCode?: string;
}

export interface MobileOperatorsResponse {
  referenceNumber?: string;
  responseCode?: number;
  message?: string;
  mobileOperator?: MobileOperator[];
}

export interface DataBundle {
  serviceId?: string;
  serviceName?: string;
  servicePrice?: number;
  validityPeriod?: string;
  dataValue?: string;
}

export interface DataBundlesResponse {
  referenceNumber?: string;
  responseCode?: number;
  message?: string;
  mobileOperatorServices?: DataBundle[];
}

export interface Merchant {
  displayName?: string;
  name?: string;
  description?: string;
  uuid?: string;
}

export interface MerchantsResponse {
  referenceNumber?: string;
  responseCode?: number;
  message?: string;
  merchants?: Merchant[];
}

export interface MerchantService {
  name?: string;
  code?: string;
  price?: number;
  shortCode?: string;
}

export interface MerchantServicesResponse {
  referenceNumber?: string;
  responseCode?: number;
  message?: string;
  services?: MerchantService[];
}

export interface MerchantAccountDetailsResponse {
  referenceNumber?: string;
  responseCode?: number;
  message?: string;
  customerName?: string;
  phoneNumber?: string;
  accountNumber?: string;
  address?: string;
  details?: Record<string, unknown>;
}

export interface ValidateDepositToBankResponse {
  referenceNumber?: string;
  responseCode?: number;
  responseCategoryCode?: number;
  message?: string;
  destinationAccountHolderNameAtBank?: string;
  fee?: number;
  vat?: number;
}

/* -------------------------------------------------------------------------- */
/* Status lookups                                                             */
/* -------------------------------------------------------------------------- */

export interface TransactionStatusResponse {
  referenceNumber?: string;
  responseCode?: number;
  responseCategoryCode?: number;
  message?: string;
  /** Human-readable only. Branch on `responseCode`, never on this. */
  status?: string;
  transactionId?: string;
  transactionReference?: string;
  transactionType?: string;
  dateUTC?: number;
  amount?: number;
  currency?: string;
  merchantTransactionReference?: string;
  additionalProperties?: Record<string, unknown>;
  reversalId?: string;
  exchangeRate?: number;
  fee?: number;
  integrationStatus?: string;
  commissionEarned?: number;
}

export interface RecentTransaction {
  itemNumber?: number;
  dateUTC?: number;
  description?: string;
  amount?: number;
  status?: string;
  transactionId?: string;
  referenceNumber?: string;
  currency?: string;
  exchangeRate?: number;
}

export interface RecentTransactionsResponse {
  referenceNumber?: string;
  responseCode?: number;
  message?: string;
  recordCount?: number;
  currency?: string;
  items?: RecentTransaction[];
}

export interface RefundStatusResponse {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  data?: PaymentStatusData;
}

/* -------------------------------------------------------------------------- */
/* Callback payloads                                                          */
/* -------------------------------------------------------------------------- */

export interface MoneyTransferNotification {
  responseCode?: number;
  responseCategoryCode?: number;
  message?: string;
  referenceNumber?: string;
  transactionId?: string;
  transactionReference?: string;
  transactionType?: string;
  transactionDate?: string;
  amount?: string;
  currency?: string;
  fee?: number;
  vat?: number;
  sessionId?: string;
  destinationAccountHolderNameAtBank?: string;
  reversalId?: string;
  exchangeRate?: number;
  integrationStatus?: string;
  [key: string]: unknown;
}

export interface UsdPaymentWebhook {
  event?: string;
  referenceNumber?: string;
  paymentId?: string;
  paymentStatus?: string;
  receivedAmounts?: Record<string, unknown>;
  serviceDetails?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: Record<string, unknown>;
  [key: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/* Direct Debit                                                               */
/* -------------------------------------------------------------------------- */

export interface DirectDebitSessionMetadata {
  amountLimit?: number;
  authorizationAmount?: number;
  currency?: string;
  accountReference?: string;
  allowPartialPayment?: boolean;
  allowMultipleUse?: boolean;
}

export interface DirectDebitSessionData {
  referenceNumber?: string;
  sessionKey?: string;
  status?: string;
  checkoutUrl?: string;
  redirectUrl?: string;
  callbackUrl?: string;
  enabledPaymentMethods?: string[];
  initiatedAt?: string;
  sessionExpiresAt?: string;
  paymentExpiresAt?: string;
  metadata?: DirectDebitSessionMetadata;
}

export interface DirectDebitSessionResponse {
  statusCode?: string;
  statusMessage?: string;
  data?: DirectDebitSessionData;
}

export interface MandateProcess {
  ProcessStatusId?: string;
  AccountReference?: string;
  StatusMessage?: string;
  CreatedDateTimeUTC?: string;
}

export interface MandateAdditionalData {
  mandate?: MandateProcess[];
}

export interface MandateStatusData {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  requestAmount?: number;
  totalPaymentAmount?: number;
  paymentMethods?: CollectPaymentMethodResult[];
  expiryDateTimeUTC?: string;
  isPayerPagaAccountHolder?: boolean;
  additionalData?: MandateAdditionalData;
}

export interface MandateStatusResponse {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  data?: MandateStatusData;
}

export interface ChargeMandateResponse {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
}

export interface ChargeMandateStatusData {
  statusCode?: number;
  ReferenceNumber?: string;
  Amount?: number;
  ProcessStatusId?: string;
}

export interface ChargeMandateStatusResponse {
  statusCode?: string;
  statusMessage?: string;
  data?: ChargeMandateStatusData;
}

export interface DisableMandateResponse {
  statusCode?: string;
  statusMessage?: string;
  referenceNumber?: string;
  data?: unknown;
}

/* -------------------------------------------------------------------------- */
/* Persistent accounts, customers and extra Business operations               */
/* -------------------------------------------------------------------------- */

export interface PersistentPaymentAccountResponse {
  referenceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  responseCode?: number;
  message?: string;
  accountNumber?: string;
  accountReference?: string;
  financialIdentificationNumber?: string;
  creditBankId?: string;
  creditBankAccountNumber?: string;
  callbackUrl?: string;
  status?: string;
  balance?: number;
  currency?: string;
}

export interface CustomerResponse {
  referenceNumber?: string;
  responseCode?: number;
  responseCategoryCode?: number;
  message?: string;
  customerReference?: string;
  customerPhoneNumber?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerDateOfBirth?: string;
  customerAddress?: Record<string, unknown>;
  pagaAccountNumber?: string;
  status?: string;
}

export interface MoneyTransferItem {
  referenceNumber?: string;
  amount?: number;
  destinationAccount?: string;
  currency?: string;
  destinationBank?: string;
  transferReference?: string;
  suppressRecipientMessage?: boolean;
}

export interface BulkTransferResult {
  referenceNumber?: string;
  responseCode?: number;
  message?: string;
  transactionId?: string;
  withdrawalCode?: string;
  exchangeRate?: number;
  fee?: number;
  currency?: string;
  receiverRegistrationStatus?: string;
}

export interface BulkMoneyTransferResponse {
  bulkReferenceNumber?: string;
  responseCode?: number;
  message?: string;
  results?: BulkTransferResult[];
}

export interface MoneyTransferResponse {
  referenceNumber?: string;
  responseCode?: number;
  responseCategoryCode?: number;
  message?: string;
  withdrawalCode?: string;
  transactionId?: string;
  reversalId?: string;
  currency?: string;
  exchangeRate?: number;
  fee?: number;
  receiverRegistrationStatus?: string;
  recipientAccountHolderName?: string;
}

export interface ValidateMoneyTransferResponse {
  referenceNumber?: string;
  responseCode?: number;
  message?: string;
  fee?: number;
  vat?: number;
  recipientAccountHolderName?: string;
  recipientRegistrationStatus?: string;
  recipientKYCLevel?: string;
}

export interface OperationStatusResponse {
  referenceNumber?: string;
  responseCode?: number | string;
  transactionStatus?: string;
  message?: string;
  transactionId?: string;
  fee?: number;
}

export interface OnboardMerchantCredentials {
  merchantPublicId?: string;
  merchantSecretKey?: string;
  merchantHmac?: string;
}

export interface OnboardMerchantUpdate {
  status?: string;
  credentials?: OnboardMerchantCredentials;
}

export interface OnboardMerchantResponse {
  responseCode?: number;
  message?: string;
  onboardingUpdate?: OnboardMerchantUpdate;
}

export interface DispenseCashResponse {
  responseCode?: number;
  message?: string;
  transactionId?: string;
  agentCommission?: number;
  customerName?: string;
}
