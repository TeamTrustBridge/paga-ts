/**
 * Shared HTTP plumbing for the Paga Engine SDK.
 *
 * Two APIs, two auth styles:
 *
 * - The **Collect API** uses HTTP Basic (`publicKey:secretKey`) plus a `hash`
 *   header, and reports success in `statusCode` (the string `"0"`).
 * - The **Business API** uses `principal` and `credentials` headers plus a
 *   `hash` header, and reports success in `responseCode` (the integer `0`).
 */

import { computePagaHash, DEFAULT_HASH_ALGORITHM, PAYMENT_REQUEST_HASH_FIELDS } from "./auth.js";
import { PagaAPIError, PagaAuthenticationError, PagaRateLimitError } from "./errors.js";
import { classify, OperationOutcome } from "./outcome.js";
import type { PagaResponse } from "./types.js";

/** Read a message off a response body. */
export function readMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const message = (body as Record<string, unknown>).message;
  return typeof message === "string" ? message : undefined;
}

/** Read a numeric code off a response body. */
export function readNumber(body: unknown): number | undefined {
  if (body === null || body === undefined) return undefined;
  const value = Number(body);
  return Number.isFinite(value) ? value : undefined;
}

/** Options accepted by {@link BasePagaClient.request}. */
export interface RequestOptions {
  /** Send the Paga `hash` header. Defaults to `true`. */
  useHash?: boolean;
  /** Use HTTP Basic auth instead of the `principal`/`credentials` headers. */
  useBasic?: boolean;
  /** Override the target base URL. */
  baseUrl?: string;
  /** Ordered hash field paths. */
  hashFields?: string[];
  /** Raise when the body reports a failure. Defaults to `true`. */
  raiseOnError?: boolean;
  /** Query string parameters. */
  params?: Record<string, string | number | boolean | undefined>;
  /**
   * The payload the hash is computed over, when it is not the request body.
   * Used by operations that sign fields the body does not carry.
   */
  hashPayload?: Record<string, unknown>;
}

/** Options accepted by the {@link PagaClient} constructor. */
export interface PagaClientOptions {
  environment?: "test" | "live";
  baseUrl?: string;
  checkoutBaseUrl?: string;
  businessBaseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30000. */
  timeoutMs?: number;
  /**
   * How many times to replay a rate-limited (HTTP 429) request.
   *
   * Defaults to `0`. Server errors are never retried: a 5xx or a timeout
   * leaves the outcome unknown, and Paga's guidance is to check the
   * transaction status with the original reference rather than send again.
   */
  maxRetries?: number;
  /** Base delay, in milliseconds, for the exponential retry backoff. */
  retryBackoffMs?: number;
}

export const DEFAULT_COLLECT_TEST_BASE_URL = "https://beta-collect.paga.com";
export const DEFAULT_COLLECT_LIVE_BASE_URL = "https://collect.paga.com";
export const DEFAULT_CHECKOUT_TEST_BASE_URL = "https://beta-checkout.paga.com";
export const DEFAULT_CHECKOUT_LIVE_BASE_URL = "https://checkout.paga.com";
export const DEFAULT_BUSINESS_TEST_BASE_URL =
  "https://beta.mypaga.com/paga-webservices/business-rest/secured";
export const DEFAULT_BUSINESS_LIVE_BASE_URL =
  "https://www.mypaga.com/paga-webservices/business-rest/secured";

/** The surface every operation mixin relies on. */
export interface PagaTransport {
  readonly publicKey: string;
  readonly secretKey: string;
  readonly hashKey: string;
  readonly baseUrl: string;
  readonly checkoutBaseUrl: string;
  readonly businessBaseUrl: string;
  request<T = PagaResponse>(
    method: string,
    path: string,
    payload?: unknown,
    options?: RequestOptions,
  ): Promise<T>;
  requestMultipart<T = PagaResponse>(
    method: string,
    path: string,
    parts: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<T>;
}

/** A constructor that the mixins can extend. */
export type Constructor<T = object> = abstract new (...args: any[]) => T;

/** Encode a string as UTF-8 base64, in both Node and the browser. */
export function base64Encode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/** Build a query string, skipping undefined values. */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/**
 * The base Paga client: credentials, base URLs and the request machinery.
 */
export abstract class BasePagaClient implements PagaTransport {
  public readonly publicKey: string;
  public readonly secretKey: string;
  public readonly hashKey: string;
  public readonly environment: "test" | "live";
  public readonly baseUrl: string;
  public readonly checkoutBaseUrl: string;
  public readonly businessBaseUrl: string;
  public readonly timeoutMs: number;
  public readonly maxRetries: number;
  public readonly retryBackoffMs: number;

  constructor(publicKey: string, secretKey: string, hashKey: string, options: PagaClientOptions = {}) {
    if (options.environment !== undefined && options.environment !== "test" && options.environment !== "live") {
      throw new Error('environment must be either "test" or "live"');
    }
    this.publicKey = publicKey;
    this.secretKey = secretKey;
    this.hashKey = hashKey;
    this.environment = options.environment ?? "test";
    this.baseUrl =
      options.baseUrl ??
      (this.environment === "test" ? DEFAULT_COLLECT_TEST_BASE_URL : DEFAULT_COLLECT_LIVE_BASE_URL);
    this.checkoutBaseUrl =
      options.checkoutBaseUrl ??
      (this.environment === "test" ? DEFAULT_CHECKOUT_TEST_BASE_URL : DEFAULT_CHECKOUT_LIVE_BASE_URL);
    this.businessBaseUrl =
      options.businessBaseUrl ??
      (this.environment === "test" ? DEFAULT_BUSINESS_TEST_BASE_URL : DEFAULT_BUSINESS_LIVE_BASE_URL);
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxRetries = Math.max(0, options.maxRetries ?? 0);
    this.retryBackoffMs = options.retryBackoffMs ?? 500;
  }

  /** The Authorization header value for HTTP Basic auth. */
  protected basicAuthHeader(): string {
    return `Basic ${base64Encode(`${this.publicKey}:${this.secretKey}`)}`;
  }

  /** The `principal` / `credentials` / `hash` headers for the Business API. */
  protected async securedHeaders(
    signed: Record<string, unknown> | undefined,
    hashFields?: string[],
  ): Promise<Record<string, string>> {
    return {
      principal: this.publicKey,
      credentials: this.secretKey,
      hash: await computePagaHash(
        signed ?? {},
        this.hashKey,
        hashFields ?? PAYMENT_REQUEST_HASH_FIELDS,
      ),
    };
  }

  /** The `hash` header for the Collect API's Basic-auth endpoints. */
  protected async collectHashHeader(
    signed: Record<string, unknown> | undefined,
    hashFields?: string[],
  ): Promise<string> {
    return computePagaHash(signed ?? {}, this.hashKey, hashFields ?? PAYMENT_REQUEST_HASH_FIELDS);
  }

  /** The signal that aborts a request once the timeout elapses. */
  protected timeoutSignal(): AbortSignal | undefined {
    const anySignal = (AbortSignal as { timeout?: (ms: number) => AbortSignal }).timeout;
    if (typeof anySignal === "function") {
      return anySignal(this.timeoutMs);
    }
    const controller = new AbortController();
    setTimeout(() => controller.abort(), this.timeoutMs);
    return controller.signal;
  }

  /** Milliseconds to wait before the next attempt. */
  protected retryDelay(response: Response, attempt: number): number {
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (Number.isFinite(seconds)) return seconds * 1000;
    }
    return this.retryBackoffMs * 2 ** attempt;
  }

  /**
   * Send a request, retrying rate-limited calls when enabled.
   *
   * Only HTTP 429 is retried. A rate-limited request was rejected before
   * Paga processed it, so replaying it is safe.
   */
  protected async send(url: string, init: RequestInit): Promise<Response> {
    let attempt = 0;
    for (;;) {
      const response = await fetch(url, init);
      if (response.status !== 429 || attempt >= this.maxRetries) {
        return response;
      }
      await new Promise((resolve) => setTimeout(resolve, this.retryDelay(response, attempt)));
      attempt += 1;
    }
  }

  /** Turn a response into a parsed body, raising the right error type. */
  protected async parse<T>(response: Response, raiseOnError: boolean): Promise<T> {
    if (response.status === 401 || response.status === 403) {
      throw new PagaAuthenticationError(
        `Paga authentication failed with status ${response.status}`,
      );
    }
    if (response.status === 429) {
      throw new PagaRateLimitError("Paga rate limit exceeded", {
        statusCode: response.status,
        payload: await response.json().catch(() => ({})),
      });
    }
    if (response.status >= 400) {
      const body = await response.json().catch(() => ({}));
      throw new PagaAPIError(readMessage(body) ?? `Paga request failed`, {
        statusCode: response.status,
        responseCode: readNumber((body as Record<string, unknown>)?.responseCode),
        payload: body,
      });
    }

    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (raiseOnError) {
      const outcome = classify(body);
      if (outcome !== OperationOutcome.SUCCESS) {
        throw new PagaAPIError(readMessage(body) ?? "Paga request failed", {
          statusCode: response.status,
          responseCode: readNumber(body?.responseCode),
          payload: body,
        });
      }
    }
    return body as T;
  }

  /**
   * Send a JSON request to Paga.
   *
   * @param method HTTP method.
   * @param path Endpoint path relative to the base URL.
   * @param payload JSON request body.
   * @param options Auth, hashing and error options.
   */
  async request<T = PagaResponse>(
    method: string,
    path: string,
    payload?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const base = options.baseUrl ?? this.baseUrl;
    const url = `${base.replace(/\/$/, "")}${path}`;
    const query = options.params ? buildQueryString(options.params) : "";

    const signed = options.hashPayload ?? (payload as Record<string, unknown> | undefined);
    const headers: Record<string, string> = { "content-type": "application/json" };

    if (options.useBasic) {
      headers.authorization = this.basicAuthHeader();
      if (options.useHash !== false && signed !== undefined) {
        headers.hash = await this.collectHashHeader(signed, options.hashFields);
      }
    } else if (options.useHash !== false && signed !== undefined) {
      Object.assign(headers, await this.securedHeaders(signed, options.hashFields));
    }

    const hasBody = method !== "GET" && method !== "DELETE" && payload !== undefined;
    const init: RequestInit = {
      method,
      headers,
      signal: this.timeoutSignal(),
    };
    if (hasBody) {
      init.body = JSON.stringify(payload);
    }

    const response = await this.send(`${url}${query}`, init);
    return this.parse<T>(response, options.raiseOnError ?? true);
  }

  /**
   * Send a `multipart/form-data` request to Paga.
   *
   * Paga's customer registration endpoints take a JSON part plus one or two
   * image parts. The hash is computed over the JSON part, not over the
   * multipart envelope.
   */
  async requestMultipart<T = PagaResponse>(
    method: string,
    path: string,
    parts: Record<string, unknown>,
    options: RequestOptions = {},
  ): Promise<T> {
    const base = options.baseUrl ?? this.businessBaseUrl;
    const url = `${base.replace(/\/$/, "")}${path}`;

    const form = new FormData();
    let jsonPart: Record<string, unknown> | undefined;
    for (const [name, value] of Object.entries(parts)) {
      if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
        const bytes = new Uint8Array(value.byteLength);
        bytes.set(new Uint8Array(value));
        form.append(name, new Blob([bytes.buffer]), "upload");
      } else if (typeof value === "string") {
        form.append(name, value);
      } else if (value && typeof value === "object") {
        const json = JSON.stringify(value);
        form.append(name, new Blob([json], { type: "application/json" }));
        jsonPart = value as Record<string, unknown>;
      } else {
        form.append(name, String(value));
      }
    }

    const signed = options.hashPayload ?? jsonPart;
    const headers: Record<string, string> = {};
    if (options.useBasic) {
      headers.authorization = this.basicAuthHeader();
    } else if (signed !== undefined) {
      Object.assign(headers, await this.securedHeaders(signed, options.hashFields));
    }

    const init: RequestInit = {
      method,
      headers,
      body: form,
      signal: this.timeoutSignal(),
    };
    const response = await this.send(url, init);
    return this.parse<T>(response, options.raiseOnError ?? true);
  }
}
