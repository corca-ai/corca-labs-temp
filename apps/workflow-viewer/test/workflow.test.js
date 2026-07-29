import test from "node:test";
import assert from "node:assert/strict";

import {
  choosePrintOrientation,
  filenameStem,
  isMarkdownFilename,
} from "../src/workflow.js";

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
