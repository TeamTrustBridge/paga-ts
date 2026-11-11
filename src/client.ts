/**
 * The Paga Engine API client.
 *
 * Composes one mixin per section of Paga's documentation:
 *
 * - `checkout` — Checkout
 * - `collection` — Dynamic virtual account, Bank USSD, Paga wallet and USD
 *   bank transfer
 * - `refunds` — Refunds
 * - `directDebit` — Direct Debit (Open Banking)
 * - `moneyTransfer` — Money Transfer
 * - `airtime` — Airtime and data
 * - `billPayment` — Bill payment (VAS)
 * - `status` — Check the transaction status
 * - `business` — Your business account
 * - `subsidiary` — Subsidiary accounts
 * - `persistent` — Persistent payment accounts
 * - `customer` — Customer registration and KYC
 *
 * The client owns the credentials and the HTTP plumbing.
 */

import { AirtimeOperations } from "./airtime.js";
import { BasePagaClient, type PagaClientOptions } from "./base.js";
import { BillPaymentOperations } from "./billPayment.js";
import { BusinessOperations } from "./business.js";
import { CheckoutOperations } from "./checkout.js";
import { CollectionOperations } from "./collection.js";
import { CustomerOperations } from "./customer.js";
import { DirectDebitOperations } from "./directDebit.js";
import { MoneyTransferOperations } from "./moneyTransfer.js";
import { PersistentAccountOperations } from "./persistent.js";
import { RefundOperations } from "./refunds.js";
import { StatusOperations } from "./status.js";
import { SubsidiaryOperations } from "./subsidiary.js";

const WithCheckout = CheckoutOperations(BasePagaClient);
const WithCollection = CollectionOperations(WithCheckout);
const WithRefunds = RefundOperations(WithCollection);
const WithDirectDebit = DirectDebitOperations(WithRefunds);
const WithMoneyTransfer = MoneyTransferOperations(WithDirectDebit);
const WithAirtime = AirtimeOperations(WithMoneyTransfer);
const WithBillPayment = BillPaymentOperations(WithAirtime);
const WithStatus = StatusOperations(WithBillPayment);
const WithBusiness = BusinessOperations(WithStatus);
const WithSubsidiary = SubsidiaryOperations(WithBusiness);
const WithPersistent = PersistentAccountOperations(WithSubsidiary);
const WithCustomer = CustomerOperations(WithPersistent);

/**
 * An async client for the Paga Engine API.
 *
 * ```ts
 * const client = new PagaClient(publicKey, secretKey, hashKey, { environment: "test" });
 * const payment = await client.createPayment({
 *   referenceNumber: "ORD-2026-0187",
 *   amount: 50,
 *   payerName: "Bello Ramon",
 *   payerPhoneNumber: "08064343187",
 *   payeeName: "Your business name",
 * });
 * ```
 */
export class PagaClient extends WithCustomer {
  constructor(
    publicKey: string,
    secretKey: string,
    hashKey: string,
    options: PagaClientOptions = {},
  ) {
    super(publicKey, secretKey, hashKey, options);
  }
}
