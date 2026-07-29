const MARKDOWN_PATTERN =
  /^\uFEFF?[ \t\r\n]*```mermaid[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*[ \t\r\n]*$/i;

/**
 * Extract the source from a Markdown document containing exactly one Mermaid
 * block and no other content.
 * @param {string} markdown
 */
export function parseWorkflowMarkdown(markdown) {
  const fenceCount = markdown.match(/^[ \t]*```/gmu)?.length ?? 0;
  const match = markdown.match(MARKDOWN_PATTERN);
  const source = match?.[1]?.trim();

  if (fenceCount !== 2 || !source) {
    throw new Error(
      "Expected exactly one non-empty ```mermaid code block and no other Markdown content.",
    );
  }

  return source;
}

/**
 * @param {string} filename
 */
export function isMarkdownFilename(filename) {
  return /\.md$/iu.test(filename);
}

/**
 * @param {string} filename
 */
export function filenameStem(filename) {
  return filename.replace(/\.md$/iu, "");
}

/**
 * @param {number} width
 * @param {number} height
 */
export function choosePrintOrientation(width, height) {
  return width > height * 1.12 ? "landscape" : "portrait";
}
