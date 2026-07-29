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
