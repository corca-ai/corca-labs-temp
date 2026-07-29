import { deflate, inflate } from "pako";

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
 */
export function decodeUrlState(fragment) {
  const serialized = fragment.replace(/^#/u, "");
  if (!serialized) return undefined;

  let type = "base64";
  let payload = serialized;
  const separator = serialized.indexOf(":");
  if (separator >= 0) {
    type = serialized.slice(0, separator);
    payload = serialized.slice(separator + 1);
  }

  const bytes = base64UrlToBytes(payload);
  const json =
    type === "pako"
      ? new TextDecoder().decode(inflate(bytes))
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
