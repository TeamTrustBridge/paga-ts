/**
 * Shared helpers for the paga-ts test suite.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PagaClient } from "../dist/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));

export const PUBLIC_KEY = "PUBLIC-KEY";
export const SECRET_KEY = "SECRET-KEY";
export const HASH_KEY = "hashkey123";

export const COLLECT_BASE = "https://beta-collect.paga.com";
export const CHECKOUT_BASE = "https://beta-checkout.paga.com";
export const BUSINESS_BASE = "https://beta.mypaga.com/paga-webservices/business-rest/secured";

/** The shared cross-SDK hash vectors. */
export function loadHashVectors() {
  const paths = [
    join(HERE, "fixtures", "hash_vectors.json"),
    join(HERE, "..", "..", "fixtures", "hash_vectors.json"),
  ];
  for (const path of paths) {
    try {
      return JSON.parse(readFileSync(path, "utf8"));
    } catch {
      continue;
    }
  }
  throw new Error("shared hash vectors not found");
}

/**
 * Replace global fetch with a recorder that replays canned responses.
 *
 * Returns a restore function.
 */
export function stubFetch(responses = []) {
  const requests = [];
  const queue = [...responses];

  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const request = {
      url: String(url),
      method: init?.method ?? "GET",
      headers: normalizeHeaders(init?.headers),
      body: init?.body,
    };
    requests.push(request);
    const next = queue.length > 0 ? queue.shift() : { status: 200, body: {} };
    const status = next.status ?? 200;
    const payload = next.body === undefined ? {} : next.body;
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "content-type": "application/json", ...(next.headers ?? {}) },
    });
  };

  return {
    requests,
    get last() {
      return requests[requests.length - 1];
    },
    get count() {
      return requests.length;
    },
    restore() {
      globalThis.fetch = original;
    },
  };
}

function normalizeHeaders(headers) {
  const result = {};
  if (!headers) return result;
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key.toLowerCase()] = value;
    });
    return result;
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) result[key.toLowerCase()] = value;
    return result;
  }
  for (const [key, value] of Object.entries(headers)) result[key.toLowerCase()] = value;
  return result;
}

/** Decode the HTTP Basic credentials off a recorded request. */
export function basicCredentials(request) {
  const header = request.headers.authorization ?? "";
  if (!header.startsWith("Basic ")) {
    throw new Error(`expected Basic auth, got ${JSON.stringify(header)}`);
  }
  const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
  const separator = decoded.indexOf(":");
  return [decoded.slice(0, separator), decoded.slice(separator + 1)];
}

/** Decode a recorded request's JSON body. */
export function requestJson(request) {
  return JSON.parse(request.body);
}

/** Build a client pointed at a stubbed fetch. */
export function makeClient(options = {}) {
  return new PagaClient(PUBLIC_KEY, SECRET_KEY, HASH_KEY, options);
}
