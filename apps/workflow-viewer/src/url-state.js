import { deflate, inflate, Inflate } from "pako";

export const MAX_COMPRESSED_BYTES = 512 * 1024;
export const MAX_DECOMPRESSED_BYTES = 2 * 1024 * 1024;
export const VIEW_MODE_QUERY_PARAM = "view";

/**
 * Read the public URL value and translate it to the application's internal
 * view-mode name.
 * @param {string} search
 * @returns {"split" | "viewer" | undefined}
 */
export function decodeViewMode(search) {
  const value = new URLSearchParams(search).get(VIEW_MODE_QUERY_PARAM);
  if (value === "split") return "split";
  if (value === "preview") return "viewer";
  return undefined;
}

/**
 * Return a copy of the URL with the selected view mode, preserving all other
 * query parameters and the shared-document hash.
 * @param {string | URL} url
 * @param {"split" | "viewer"} mode
 */
export function urlWithViewMode(url, mode) {
  const nextUrl = new URL(url);
  nextUrl.searchParams.set(
    VIEW_MODE_QUERY_PARAM,
    mode === "viewer" ? "preview" : "split",
  );
  return nextUrl;
}

export class UrlStateSizeWarning extends Error {
  /**
   * @param {"compressed" | "decompressed"} stage
   * @param {number} limitBytes
   * @param {number} observedBytes
   */
  constructor(stage, limitBytes, observedBytes) {
    super(`URL state ${stage} size exceeds ${limitBytes} bytes.`);
    this.name = "UrlStateSizeWarning";
    this.stage = stage;
    this.limitBytes = limitBytes;
    this.observedBytes = observedBytes;
  }
}

/**
 * @param {Uint8Array} bytes
 */
function bytesToBase64Url(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

/**
 * @param {string} encoded
 */
function base64UrlToBytes(encoded) {
  const normalized = encoded.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/**
 * @param {string} payload
 * @param {number} maxBytes
 * @param {"compressed" | "decompressed"} stage
 */
function gateEncodedSize(payload, maxBytes, stage) {
  const maxCharacters = Math.ceil(maxBytes / 3) * 4;
  if (payload.length > maxCharacters) {
    throw new UrlStateSizeWarning(
      stage,
      maxBytes,
      Math.floor((payload.length * 3) / 4),
    );
  }
}

/**
 * Stop pako once its streamed output crosses the automatic-load threshold.
 * @param {Uint8Array} bytes
 */
function boundedInflate(bytes) {
  const inflator = new Inflate();
  /** @type {Uint8Array[]} */
  const chunks = [];
  let totalBytes = 0;

  inflator.onData = (chunk) => {
    const chunkBytes =
      chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
    totalBytes += chunkBytes.length;
    if (totalBytes > MAX_DECOMPRESSED_BYTES) {
      throw new UrlStateSizeWarning(
        "decompressed",
        MAX_DECOMPRESSED_BYTES,
        totalBytes,
      );
    }
    chunks.push(chunkBytes);
  };
  inflator.push(bytes, true);
  if (inflator.err) throw new Error(inflator.msg);

  const output = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

/**
 * Serialize a Mermaid Live-compatible state fragment.
 * @param {string} code
 * @param {string} [filename]
 */
export function encodePakoState(code, filename) {
  const state = {
    code,
    ...(filename ? { filename } : {}),
    mermaid: JSON.stringify({ theme: "default" }, null, 2),
    autoSync: true,
    updateDiagram: true,
  };
  const json = JSON.stringify(state);
  const compressed = deflate(new TextEncoder().encode(json), { level: 9 });
  return `pako:${bytesToBase64Url(compressed)}`;
}

/**
 * Decode Mermaid Live `pako:` or `base64:` state data.
 * @param {string} fragment
 * @param {{ allowOversize?: boolean }} [options]
 */
export function decodeUrlState(fragment, { allowOversize = false } = {}) {
  const serialized = fragment.replace(/^#/u, "");
  if (!serialized) return undefined;

  let type = "base64";
  let payload = serialized;
  const separator = serialized.indexOf(":");
  if (separator >= 0) {
    type = serialized.slice(0, separator);
    payload = serialized.slice(separator + 1);
  }

  if (!allowOversize) {
    gateEncodedSize(
      payload,
      type === "pako" ? MAX_COMPRESSED_BYTES : MAX_DECOMPRESSED_BYTES,
      type === "pako" ? "compressed" : "decompressed",
    );
  }
  const bytes = base64UrlToBytes(payload);
  if (!allowOversize && type === "pako" && bytes.length > MAX_COMPRESSED_BYTES) {
    throw new UrlStateSizeWarning(
      "compressed",
      MAX_COMPRESSED_BYTES,
      bytes.length,
    );
  }
  if (
    !allowOversize &&
    type === "base64" &&
    bytes.length > MAX_DECOMPRESSED_BYTES
  ) {
    throw new UrlStateSizeWarning(
      "decompressed",
      MAX_DECOMPRESSED_BYTES,
      bytes.length,
    );
  }
  const json =
    type === "pako"
      ? new TextDecoder().decode(
          allowOversize ? inflate(bytes) : boundedInflate(bytes),
        )
      : type === "base64"
        ? new TextDecoder().decode(bytes)
        : (() => {
            throw new Error(`Unsupported URL state type: ${type}`);
          })();
  const state = JSON.parse(json);
  if (
    !state ||
    typeof state !== "object" ||
    !("code" in state) ||
    typeof state.code !== "string"
  ) {
    throw new Error("URL state does not contain Mermaid code.");
  }
  const filenameValue =
    "filename" in state
      ? state.filename
      : "title" in state
        ? state.title
        : undefined;
  const filename =
    typeof filenameValue === "string"
      ? filenameValue.split(/[\\/]/u).at(-1)?.trim().slice(0, 255) || undefined
      : undefined;
  return { code: state.code, filename };
}
