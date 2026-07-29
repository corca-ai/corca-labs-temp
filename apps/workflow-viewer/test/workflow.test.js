import test from "node:test";
import assert from "node:assert/strict";

import {
  choosePrintOrientation,
  filenameStem,
  isMarkdownFilename,
  parseWorkflowMarkdown,
} from "../src/workflow.js";

test("extracts one Mermaid-only code block with Korean labels", () => {
  const markdown = `\`\`\`mermaid
flowchart TD
  input[("문의 접수")] --> work[["요청 검토"]]:::proc
\`\`\`
`;

  assert.equal(
    parseWorkflowMarkdown(markdown),
    'flowchart TD\n  input[("문의 접수")] --> work[["요청 검토"]]:::proc',
  );
});

test("accepts BOM, CRLF, and surrounding whitespace", () => {
  assert.equal(
    parseWorkflowMarkdown("\uFEFF \r\n```MERMAID\r\ngraph TD\r\n  A --> B\r\n```\r\n"),
    "graph TD\r\n  A --> B",
  );
});

test("rejects prose outside the Mermaid block", () => {
  assert.throws(
    () => parseWorkflowMarkdown("# Workflow\n\n```mermaid\ngraph TD\nA-->B\n```"),
    /exactly one/,
  );
});

test("rejects an empty or additional code block", () => {
  assert.throws(() => parseWorkflowMarkdown("```mermaid\n\n```"), /non-empty/);
  assert.throws(
    () =>
      parseWorkflowMarkdown(
        "```mermaid\ngraph TD\nA-->B\n```\n```text\nextra\n```",
      ),
    /exactly one/,
  );
});

test("handles Markdown names and Korean filename stems", () => {
  const filename = "FLOW_코르카_최재혁_고객문의.md";
  assert.equal(isMarkdownFilename(filename), true);
  assert.equal(filenameStem(filename), "FLOW_코르카_최재혁_고객문의");
  assert.equal(isMarkdownFilename("workflow.txt"), false);
});

test("selects the more legible A4 orientation", () => {
  assert.equal(choosePrintOrientation(900, 400), "landscape");
  assert.equal(choosePrintOrientation(400, 900), "portrait");
});
