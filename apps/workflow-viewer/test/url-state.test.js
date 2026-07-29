import test from "node:test";
import assert from "node:assert/strict";
import { deflate } from "pako";

import {
  decodeViewMode,
  decodeUrlState,
  encodePakoState,
  MAX_COMPRESSED_BYTES,
  MAX_DECOMPRESSED_BYTES,
  urlWithViewMode,
  UrlStateSizeWarning,
} from "../src/url-state.js";

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

test("reads split and preview view modes from URL parameters", () => {
  assert.equal(decodeViewMode("?view=split"), "split");
  assert.equal(decodeViewMode("?view=preview"), "viewer");
  assert.equal(decodeViewMode("?view=viewer"), undefined);
  assert.equal(decodeViewMode("?view=unknown"), undefined);
  assert.equal(decodeViewMode(""), undefined);
});

test("writes view mode without changing other URL state", () => {
  assert.equal(
    urlWithViewMode(
      "https://example.com/workflow-viewer/?lang=en#pako:payload",
      "viewer",
    ).href,
    "https://example.com/workflow-viewer/?lang=en&view=preview#pako:payload",
  );
  assert.equal(
    urlWithViewMode(
      "https://example.com/workflow-viewer/?view=preview#pako:payload",
      "split",
    ).href,
    "https://example.com/workflow-viewer/?view=split#pako:payload",
  );
});

test("round-trips Korean Mermaid code and filename through pako URL state", () => {
  const code = 'flowchart TD\n  A["입력"] --> B["처리"]';
  const fragment = encodePakoState(code, "FLOW_조직_이름_업무.md");

  assert.match(fragment, /^pako:/);
  assert.deepEqual(decodeUrlState(fragment), {
    code,
    filename: "FLOW_조직_이름_업무.md",
  });
});

test("decodes Mermaid Live-compatible pako state", () => {
  const state = {
    code: "flowchart LR\n  A --> B",
    mermaid: '{\n  "theme": "default"\n}',
    autoSync: true,
    updateDiagram: true,
  };
  const compressed = deflate(new TextEncoder().encode(JSON.stringify(state)), {
    level: 9,
  });

  assert.deepEqual(
    decodeUrlState(`pako:${base64Url(compressed)}`),
    { code: "flowchart LR\n  A --> B", filename: undefined },
  );
});

test("decodes base64 state, accepts legacy title, and rejects malformed payloads", () => {
  const state = JSON.stringify({
    code: "sequenceDiagram\n  A->>B: Hello",
    title: "Shared sequence",
  });
  assert.deepEqual(
    decodeUrlState(`base64:${Buffer.from(state).toString("base64url")}`),
    {
      code: "sequenceDiagram\n  A->>B: Hello",
      filename: "Shared sequence",
    },
  );
  assert.throws(() => decodeUrlState("pako:not-valid"), /invalid|incorrect/i);
  assert.throws(
    () =>
      decodeUrlState(
        `base64:${Buffer.from('{"theme":"default"}').toString("base64url")}`,
      ),
    /does not contain/,
  );
});

test("strips path components from untrusted shared filenames", () => {
  const state = JSON.stringify({
    code: "flowchart LR\n  A --> B",
    filename: "../../FLOW_safe.md",
  });

  assert.deepEqual(
    decodeUrlState(`base64:${Buffer.from(state).toString("base64url")}`),
    { code: "flowchart LR\n  A --> B", filename: "FLOW_safe.md" },
  );
});

test("gates oversized compressed input before base64 decoding", () => {
  assert.throws(
    () =>
      decodeUrlState(
        `pako:${"A".repeat(Math.ceil(MAX_COMPRESSED_BYTES / 3) * 4 + 1)}`,
      ),
    (problem) =>
      problem instanceof UrlStateSizeWarning &&
      problem.stage === "compressed",
  );
});

test("gates decompressed pako output and permits explicit override", () => {
  const code = "A".repeat(MAX_DECOMPRESSED_BYTES + 1);
  const fragment = encodePakoState(code, "large.md");

  assert.throws(
    () => decodeUrlState(fragment),
    (problem) =>
      problem instanceof UrlStateSizeWarning &&
      problem.stage === "decompressed",
  );
  assert.deepEqual(decodeUrlState(fragment, { allowOversize: true }), {
    code,
    filename: "large.md",
  });
});
