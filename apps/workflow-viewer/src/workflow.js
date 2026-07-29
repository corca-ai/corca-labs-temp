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

/**
 * Keep small pointer jitter as a click; only deliberate movement starts panning.
 * @param {number} deltaX
 * @param {number} deltaY
 * @param {number} [threshold]
 */
export function hasExceededPanThreshold(deltaX, deltaY, threshold = 3) {
  return Math.abs(deltaX) + Math.abs(deltaY) > threshold;
}
