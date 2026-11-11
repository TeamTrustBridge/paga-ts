/**
 * The Paga Engine API client.
 *
 * Composes the operation mixins — checkout, actions, business accounts,
 * directory lookups, Direct Debit, persistent accounts and customers — onto
 * one client that owns the credentials and the HTTP plumbing.
 */

import { ActionOperations } from "./actions.js";
import { BasePagaClient, type PagaClientOptions } from "./base.js";
import { BusinessOperations } from "./business.js";
import { CheckoutOperations } from "./checkout.js";
import { CustomerOperations } from "./customer.js";
import { DirectDebitOperations } from "./directDebit.js";
import { DirectoryOperations } from "./directory.js";
import { PersistentAccountOperations } from "./persistent.js";

const WithCheckout = CheckoutOperations(BasePagaClient);
const WithActions = ActionOperations(WithCheckout);
const WithBusiness = BusinessOperations(WithActions);
const WithDirectory = DirectoryOperations(WithBusiness);
const WithDirectDebit = DirectDebitOperations(WithDirectory);
const WithPersistent = PersistentAccountOperations(WithDirectDebit);
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
