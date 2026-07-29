import test from "node:test";
import assert from "node:assert/strict";
import { deflate } from "pako";

import { decodeUrlState, encodePakoState } from "../src/url-state.js";

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

test("round-trips Korean Mermaid code through pako URL state", () => {
  const code = 'flowchart TD\n  A["입력"] --> B["처리"]';
  const fragment = encodePakoState(code);

  assert.match(fragment, /^pako:/);
  assert.equal(decodeUrlState(fragment), code);
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

  assert.equal(
    decodeUrlState(`pako:${base64Url(compressed)}`),
    "flowchart LR\n  A --> B",
  );
});

test("decodes base64 state and rejects malformed payloads", () => {
  const state = JSON.stringify({ code: "sequenceDiagram\n  A->>B: Hello" });
  assert.equal(
    decodeUrlState(`base64:${Buffer.from(state).toString("base64url")}`),
    "sequenceDiagram\n  A->>B: Hello",
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
