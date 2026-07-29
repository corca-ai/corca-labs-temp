import {
  choosePrintOrientation,
  filenameStem,
  isMarkdownFilename,
} from "./workflow.js";
import {
  decodeUrlState,
  encodePakoState,
  UrlStateSizeWarning,
} from "./url-state.js";
import DOMPurify from "dompurify";
import { toBlob } from "html-to-image";
import { marked } from "marked";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker.js?worker";

const monacoGlobal =
  /** @type {typeof globalThis & { MonacoEnvironment: { getWorker: () => Worker } }} */ (
    globalThis
  );
monacoGlobal.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

const MERMAID_URL =
  "https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs";
const POLL_INTERVAL_MS = 1_500;
const EDIT_DELAY_MS = 220;
const HASH_DELAY_MS = 320;
const VIEW_MODE_STORAGE_KEY = "workflow-viewer:view-mode";
const DEFAULT_CODE = `# 문의 처리 흐름

\`\`\`mermaid
flowchart TD
    문의[("고객 문의")]
    분류[["문의 분류"]]:::proc
    분류결과[("분류 결과")]
    답변작성[["답변 작성"]]:::proc
    답변초안[("답변 초안")]
    답변검토[["답변 검토"]]:::proc
    검토결과[("검토 결과")]
    답변발송[["답변 발송"]]:::proc
    발송기록[("발송 기록")]
    응대지침[("응대 지침")]

    문의 --> 분류 --> 분류결과 --> 답변작성 --> 답변초안
    답변초안 --> 답변검토 --> 검토결과 --> 답변발송 --> 발송기록
    응대지침 -.-> 분류
    응대지침 -.-> 답변작성
    응대지침 -.-> 답변검토

    classDef proc fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
\`\`\``;

const COPY = {
  ko: {
    title: "워크플로 뷰어",
    description: "Mermaid를 지원하는 Markdown 문서를 편집하고 실시간으로 미리 보세요.",
    viewModeLabel: "보기 모드",
    splitView: "분할",
    viewerView: "미리보기만",
    languageLabel: "언어 선택",
    open: "MD 파일 불러오기",
    refresh: "새로고침",
    chooseAgain: "다시 선택",
    copy: "클립보드에 복사",
    copying: "복사 중…",
    copied: "복사됨",
    copyFailed: "복사 실패",
    copyPng: "PNG 복사",
    copyingPng: "PNG 복사 중…",
    copiedPng: "PNG 복사됨",
    copyPngFailed: "PNG 복사 실패",
    downloadPng: "PNG 다운로드",
    preparingPng: "PNG 만드는 중…",
    downloadedPng: "PNG 저장됨",
    pngFailed: "PNG 저장 실패",
    print: "인쇄 / PDF 저장",
    fileInputLabel: "워크플로 Markdown 파일 선택",
    editorTitle: "Markdown 편집기",
    editorNote: "입력하는 동안 미리보기가 자동으로 업데이트됩니다.",
    editorLabel: "Mermaid를 지원하는 Markdown 문서",
    urlBadge: "URL 동기화",
    previewTitle: "미리보기",
    diagramLabel: "Markdown 미리보기",
    privacy: "로컬 파일은 업로드되지 않습니다. 공유 링크의 내용은 URL 조각에만 저장됩니다.",
    browserOnly: "브라우저 전용",
    dropTitle: "Markdown 파일 놓기",
    dropNote: "파일에서 Mermaid 코드를 불러옵니다.",
    errorLabel: "워크플로를 표시할 수 없습니다",
    errorTitle: "Mermaid 블록을 확인해 주세요",
    live: "실시간 미리보기 · URL 동기화됨",
    urlError: "공유 URL을 읽지 못해 예제 그래프를 열었습니다",
    sizeBlocked: "큰 공유 문서를 불러오지 않고 예제 그래프를 열었습니다",
    sizeWarning: "이 공유 링크는 안전한 자동 로드 크기를 초과합니다. 신뢰할 수 있는 링크일 때만 계속하세요.\n\n그래도 불러올까요?",
    watching: (/** @type {string} */ time) => `파일 변경 확인 중 · ${time} 업데이트`,
    fallback: (/** @type {string} */ time) => `${time} 업데이트 · 변경 사항을 읽으려면 파일을 다시 선택하세요`,
    attention: "Mermaid 블록을 확인해 주세요",
    accessPaused: "파일 접근이 중단되었습니다 · 워크플로를 다시 선택하세요",
    rendererLoading: "다이어그램 렌더러를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.",
    mermaidGuidance: "왼쪽 Markdown 편집기에서 Mermaid 코드 블록의 문법을 수정하세요.",
    notMarkdown: "Markdown(.md) 파일이 아닙니다.",
    notMarkdownGuidance: ".md 파일을 선택하세요.",
    rendererError: "Mermaid 렌더러를 불러올 수 없습니다.",
    rendererGuidance: "인터넷 연결을 확인한 다음 페이지를 새로고침하세요. 로컬 파일에는 접근하지 않았습니다.",
  },
  en: {
    title: "Workflow viewer",
    description: "Edit and preview Markdown with Mermaid diagram support.",
    viewModeLabel: "View mode",
    splitView: "Split",
    viewerView: "Viewer only",
    languageLabel: "Choose language",
    open: "Load MD file",
    refresh: "Refresh",
    chooseAgain: "Choose again",
    copy: "Copy to clipboard",
    copying: "Copying…",
    copied: "Copied",
    copyFailed: "Copy failed",
    copyPng: "Copy PNG",
    copyingPng: "Copying PNG…",
    copiedPng: "PNG copied",
    copyPngFailed: "PNG copy failed",
    downloadPng: "Download PNG",
    preparingPng: "Creating PNG…",
    downloadedPng: "PNG downloaded",
    pngFailed: "PNG download failed",
    print: "Print / Save PDF",
    fileInputLabel: "Choose a workflow Markdown file",
    editorTitle: "Markdown editor",
    editorNote: "The preview updates automatically while you type.",
    editorLabel: "Markdown document with Mermaid support",
    urlBadge: "URL synced",
    previewTitle: "Preview",
    diagramLabel: "Markdown preview",
    privacy: "Local files are not uploaded. Shared content is stored only in the URL fragment.",
    browserOnly: "Browser only",
    dropTitle: "Drop Markdown file",
    dropNote: "Load Mermaid code from the file.",
    errorLabel: "Couldn’t show this workflow",
    errorTitle: "Check the Mermaid block",
    live: "Live preview · URL synced",
    urlError: "Could not read the shared URL, so the example graph was opened",
    sizeBlocked: "The large shared document was not loaded; the example graph was opened",
    sizeWarning: "This shared link exceeds the safe automatic-load size. Continue only if you trust its source.\n\nLoad it anyway?",
    watching: (/** @type {string} */ time) => `Watching file changes · Updated ${time}`,
    fallback: (/** @type {string} */ time) => `Updated ${time} · Choose the file again to reread changes`,
    attention: "Check the Mermaid block",
    accessPaused: "File access paused · Select the workflow again",
    rendererLoading: "The diagram renderer is still loading. Please try again.",
    mermaidGuidance: "Correct the Mermaid block syntax in the Markdown editor.",
    notMarkdown: "This is not a Markdown (.md) file.",
    notMarkdownGuidance: "Choose a .md file.",
    rendererError: "Could not load the Mermaid renderer.",
    rendererGuidance: "Check your internet connection and reload this page. Your local file was not accessed.",
  },
};

/** @typedef {"ko" | "en"} Language */
/** @typedef {"split" | "viewer"} ViewMode */
/** @typedef {"live" | "urlError" | "sizeBlocked" | "watching" | "fallback" | "attention" | "accessPaused"} StatusMode */

const get = {
  element: (/** @type {string} */ selector) =>
    /** @type {HTMLElement} */ (document.querySelector(selector)),
  button: (/** @type {string} */ selector) =>
    /** @type {HTMLButtonElement} */ (document.querySelector(selector)),
};

const documentTitle = get.element("#document-title");
const pageDescription =
  /** @type {HTMLMetaElement} */ (document.querySelector("#page-description"));
const viewSwitch = get.element("#view-switch");
const viewOptions =
  /** @type {NodeListOf<HTMLButtonElement>} */ (
    document.querySelectorAll(".view-option")
  );
const languageSwitch = get.element("#language-switch");
const languageOptions =
  /** @type {NodeListOf<HTMLButtonElement>} */ (
    document.querySelectorAll(".language-option")
  );
const openButton = get.button("#open-button");
const refreshButton = get.button("#refresh-button");
const copyButton = get.button("#copy-button");
const copyPngButton = get.button("#copy-png-button");
const pngButton = get.button("#png-button");
const printButton = get.button("#print-button");
const exportStatus = get.element("#export-status");
const fileInput =
  /** @type {HTMLInputElement} */ (document.querySelector("#file-input"));
const dropZone = get.element("#drop-zone");
const editorHost = get.element("#editor");
const editorTitle = get.element("#editor-title");
const editorNote = get.element("#editor-note");
const urlBadge = get.element("#url-badge");
const previewTitle = get.element("#preview-title");
const viewerPanel = get.element("#viewer-panel");
const privacyNote = get.element("#privacy-note");
const localBadge = get.element("#local-badge");
const dropTitle = get.element("#drop-title");
const dropNote = get.element("#drop-note");
const filenameElement = get.element("#filename");
const statusElement = get.element("#status");
const preview = get.element("#preview");
const errorPanel = get.element("#error-panel");
const errorLabel = get.element("#error-label");
const errorTitle = get.element("#error-title");
const errorDetail = get.element("#error-detail");
const errorGuidance = get.element("#error-guidance");
const printPageStyle =
  /** @type {HTMLStyleElement} */ (document.querySelector("#print-page-style"));
const pickerWindow =
  /** @type {Window & { showOpenFilePicker?: (options: object) => Promise<FileSystemFileHandle[]> }} */ (
    window
  );

/** @type {{ initialize: (config: object) => void, render: (id: string, source: string) => Promise<{ svg: string, bindFunctions?: (element: Element) => void }> } | undefined} */
let mermaid;
/** @type {FileSystemFileHandle | undefined} */
let fileHandle;
/** @type {File | undefined} */
let fallbackFile;
/** @type {string | undefined} */
let lastObservedText;
/** @type {Language} */
let activeLanguage = "ko";
/** @type {StatusMode} */
let statusMode = "live";
/** @type {Date | undefined} */
let statusTime;
/** @type {{ problem: unknown, guidanceKey: "mermaidGuidance" | "notMarkdownGuidance" | "rendererGuidance", detailKey?: "notMarkdown", prefixKey?: "rendererError" } | undefined} */
let currentError;
let renderNumber = 0;
let activeRender = 0;
let pollInProgress = false;
/** @type {number | undefined} */
let renderTimer;
/** @type {number | undefined} */
let hashTimer;
let currentStem = "workflow";
let currentFilename = "";
/** @type {string | undefined} */
let programmaticEditorValue;
/** @type {ViewMode} */
let activeViewMode = (() => {
  try {
    return localStorage.getItem(VIEW_MODE_STORAGE_KEY) === "viewer"
      ? "viewer"
      : "split";
  } catch {
    return "split";
  }
})();
document.documentElement.dataset.viewMode = activeViewMode;
/** @type {"default" | "working" | "success" | "error"} */
let copyActionState = "default";
/** @type {"default" | "working" | "success" | "error"} */
let copyPngActionState = "default";
/** @type {"default" | "working" | "success" | "error"} */
let pngActionState = "default";
/** @type {number | undefined} */
let copyResetTimer;
/** @type {number | undefined} */
let copyPngResetTimer;
/** @type {number | undefined} */
let pngResetTimer;

const codeEditor = monaco.editor.create(editorHost, {
  value: "",
  language: "markdown",
  theme: "vs",
  automaticLayout: true,
  ariaLabel: COPY.ko.editorLabel,
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: 14,
  lineHeight: 23,
  minimap: { enabled: false },
  wordWrap: "on",
  wrappingIndent: "same",
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  padding: { top: 18, bottom: 18 },
  renderLineHighlight: "line",
  guides: { indentation: true },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  accessibilitySupport: "auto",
});

function updateViewModeUi() {
  document.documentElement.dataset.viewMode = activeViewMode;
  for (const option of viewOptions) {
    option.setAttribute(
      "aria-pressed",
      String(option.dataset.viewMode === activeViewMode),
    );
  }
  window.requestAnimationFrame(() => codeEditor.layout());
}

/** @param {ViewMode} mode */
function setViewMode(mode) {
  activeViewMode = mode;
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // The mode still applies for this page when storage is unavailable.
  }
  updateViewModeUi();
}

/** @param {string} value */
function setEditorValue(value) {
  if (codeEditor.getValue() === value) {
    programmaticEditorValue = undefined;
    return;
  }
  programmaticEditorValue = value;
  codeEditor.setValue(value);
}

/** @param {Date} date */
function formattedTime(date) {
  return new Intl.DateTimeFormat(activeLanguage === "ko" ? "ko-KR" : "en", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function updateStatus() {
  const copy = COPY[activeLanguage];
  if (statusMode === "watching" && statusTime) {
    statusElement.textContent = copy.watching(formattedTime(statusTime));
  } else if (statusMode === "fallback" && statusTime) {
    statusElement.textContent = copy.fallback(formattedTime(statusTime));
  } else {
    statusElement.textContent =
      statusMode === "live"
        ? copy.live
        : statusMode === "urlError"
          ? copy.urlError
          : statusMode === "sizeBlocked"
            ? copy.sizeBlocked
            : statusMode === "attention"
              ? copy.attention
              : copy.accessPaused;
  }
}

/**
 * @param {StatusMode} mode
 * @param {Date} [time]
 */
function setStatus(mode, time) {
  statusMode = mode;
  statusTime = time;
  updateStatus();
}

function renderErrorCopy() {
  if (!currentError) return;
  const copy = COPY[activeLanguage];
  const rawMessage =
    currentError.problem instanceof Error
      ? currentError.problem.message
      : String(currentError.problem);
  errorDetail.textContent = currentError.detailKey
    ? copy[currentError.detailKey]
    : currentError.prefixKey
      ? `${copy[currentError.prefixKey]}\n\n${rawMessage}`
      : rawMessage;
  errorGuidance.textContent = copy[currentError.guidanceKey];
}

function applyTranslations() {
  const copy = COPY[activeLanguage];
  document.documentElement.lang = activeLanguage;
  pageDescription.content = copy.description;
  viewSwitch.setAttribute("aria-label", copy.viewModeLabel);
  for (const option of viewOptions) {
    option.textContent =
      option.dataset.viewMode === "viewer" ? copy.viewerView : copy.splitView;
  }
  languageSwitch.setAttribute("aria-label", copy.languageLabel);
  openButton.textContent = copy.open;
  refreshButton.textContent = fileHandle ? copy.refresh : copy.chooseAgain;
  updateExportActionLabels();
  printButton.textContent = copy.print;
  fileInput.setAttribute("aria-label", copy.fileInputLabel);
  editorTitle.textContent = copy.editorTitle;
  editorNote.textContent = copy.editorNote;
  codeEditor.updateOptions({ ariaLabel: copy.editorLabel });
  urlBadge.textContent = copy.urlBadge;
  previewTitle.textContent = copy.previewTitle;
  preview.setAttribute("aria-label", copy.diagramLabel);
  viewerPanel.setAttribute("aria-label", copy.previewTitle);
  privacyNote.textContent = copy.privacy;
  localBadge.textContent = copy.browserOnly;
  dropTitle.textContent = copy.dropTitle;
  dropNote.textContent = copy.dropNote;
  errorLabel.textContent = copy.errorLabel;
  errorTitle.textContent = copy.errorTitle;
  for (const option of languageOptions) {
    option.setAttribute(
      "aria-pressed",
      String(option.dataset.language === activeLanguage),
    );
  }
  documentTitle.textContent = currentStem === "workflow" ? copy.title : currentStem;
  document.title = currentStem === "workflow" ? copy.title : currentStem;
  updateStatus();
  renderErrorCopy();
}

function updateExportActionLabels() {
  const copy = COPY[activeLanguage];
  copyButton.textContent =
    copyActionState === "working"
      ? copy.copying
      : copyActionState === "success"
        ? copy.copied
        : copyActionState === "error"
          ? copy.copyFailed
          : copy.copy;
  copyPngButton.textContent =
    copyPngActionState === "working"
      ? copy.copyingPng
      : copyPngActionState === "success"
        ? copy.copiedPng
        : copyPngActionState === "error"
          ? copy.copyPngFailed
          : copy.copyPng;
  pngButton.textContent =
    pngActionState === "working"
      ? copy.preparingPng
      : pngActionState === "success"
        ? copy.downloadedPng
        : pngActionState === "error"
          ? copy.pngFailed
          : copy.downloadPng;
}

/**
 * @param {"copy" | "copyPng" | "png"} action
 * @param {"default" | "working" | "success" | "error"} state
 */
function setExportActionState(action, state) {
  if (action === "copy") copyActionState = state;
  else if (action === "copyPng") copyPngActionState = state;
  else pngActionState = state;
  updateExportActionLabels();

  const copy = COPY[activeLanguage];
  exportStatus.textContent =
    action === "copy"
      ? state === "working"
        ? copy.copying
        : state === "success"
          ? copy.copied
          : state === "error"
            ? copy.copyFailed
            : ""
      : action === "copyPng"
        ? state === "working"
          ? copy.copyingPng
          : state === "success"
            ? copy.copiedPng
            : state === "error"
              ? copy.copyPngFailed
              : ""
      : state === "working"
        ? copy.preparingPng
        : state === "success"
          ? copy.downloadedPng
          : state === "error"
            ? copy.pngFailed
            : "";
}

/** @param {boolean} disabled */
function setPreviewActionsDisabled(disabled) {
  copyButton.disabled = disabled;
  copyPngButton.disabled = disabled;
  pngButton.disabled = disabled;
  printButton.disabled = disabled;
}

/** @param {string} filename */
function setFilename(filename) {
  currentFilename = filename;
  filenameElement.textContent = filename;
  currentStem = filename ? filenameStem(filename) : "workflow";
  documentTitle.textContent =
    currentStem === "workflow" ? COPY[activeLanguage].title : currentStem;
  document.title = documentTitle.textContent;
}

function updateRefreshUi() {
  refreshButton.hidden = !fileHandle && !fallbackFile;
  refreshButton.textContent = fileHandle
    ? COPY[activeLanguage].refresh
    : COPY[activeLanguage].chooseAgain;
}

/**
 * @param {unknown} problem
 * @param {"mermaidGuidance" | "notMarkdownGuidance" | "rendererGuidance"} guidanceKey
 * @param {"notMarkdown"} [detailKey]
 * @param {"rendererError"} [prefixKey]
 */
function showError(problem, guidanceKey, detailKey, prefixKey) {
  currentError = { problem, guidanceKey, detailKey, prefixKey };
  errorPanel.hidden = false;
  setPreviewActionsDisabled(true);
  renderErrorCopy();
}

function updatePrintOrientation() {
  const onlyChild = preview.children.length === 1 ? preview.firstElementChild : null;
  const svg =
    onlyChild?.classList.contains("mermaid-diagram")
      ? onlyChild.querySelector("svg")
      : null;
  const orientation =
    svg instanceof SVGSVGElement
      ? choosePrintOrientation(
          svg.viewBox.baseVal.width || svg.getBoundingClientRect().width,
          svg.viewBox.baseVal.height || svg.getBoundingClientRect().height,
        )
      : "portrait";
  document.documentElement.dataset.printOrientation = orientation;
  printPageStyle.textContent = `@page { size: A4 ${orientation}; margin: 10mm; }`;
}

/** @param {string} code */
function scheduleHashUpdate(code) {
  window.clearTimeout(hashTimer);
  hashTimer = window.setTimeout(() => {
    history.replaceState(
      undefined,
      "",
      `#${encodePakoState(code, currentFilename || undefined)}`,
    );
  }, HASH_DELAY_MS);
}

/**
 * Convert bare Mermaid Live content into a one-block Markdown document.
 * @param {string} content
 */
function normalizeMarkdownInput(content) {
  if (/```mermaid\b/iu.test(content)) return content;
  if (
    /^\s*(?:---[\s\S]*?---\s*)?(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|mindmap|timeline|zenuml|sankey-beta|xychart-beta|block-beta|packet-beta|architecture-beta|kanban)\b/iu.test(
      content,
    )
  ) {
    return `\`\`\`mermaid\n${content.trim()}\n\`\`\``;
  }
  return content;
}

/** @param {Element} node */
function getMermaidNodeKey(node) {
  return node.id.replace(/^flowchart-/u, "").replace(/-\d+$/u, "");
}

/**
 * @param {string} edgeId
 * @param {string[]} nodeKeys
 */
function getMermaidEdgeEnds(edgeId, nodeKeys) {
  const edgeKey = edgeId.replace(/^L_/u, "").replace(/_\d+$/u, "");
  for (const source of nodeKeys) {
    for (const target of nodeKeys) {
      if (`${source}_${target}` === edgeKey) return { source, target };
    }
  }
  return undefined;
}

/** @param {Element} container */
function prepareInteractiveDiagram(container) {
  const nodes = Array.from(container.querySelectorAll(".node"));
  const nodeKeys = nodes.map(getMermaidNodeKey);

  for (const node of nodes) {
    node.setAttribute("data-workflow-node", getMermaidNodeKey(node));
    if (node.classList.contains("proc")) {
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      node.setAttribute("aria-pressed", "false");
    }
  }

  for (const edge of container.querySelectorAll("path[data-edge='true']")) {
    const edgeId = edge.getAttribute("data-id") ?? edge.id;
    const ends = getMermaidEdgeEnds(edgeId, nodeKeys);
    if (!ends) continue;
    edge.setAttribute("data-workflow-source", ends.source);
    edge.setAttribute("data-workflow-target", ends.target);
  }

  container.classList.add("is-interactive");
}

function clearDiagramHighlight() {
  for (const diagram of preview.querySelectorAll(
    ".mermaid-diagram.is-highlighted",
  )) {
    diagram.classList.remove("is-highlighted");
    for (const element of diagram.querySelectorAll(
      ".is-selected, .is-related",
    )) {
      element.classList.remove("is-selected", "is-related");
    }
    for (const node of diagram.querySelectorAll(".node.proc[aria-pressed]")) {
      node.setAttribute("aria-pressed", "false");
    }
  }
}

const CLIPBOARD_STYLE_PROPERTIES = [
  "background-color",
  "border",
  "border-collapse",
  "border-radius",
  "color",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "line-height",
  "list-style-position",
  "list-style-type",
  "margin",
  "padding",
  "text-align",
  "text-decoration",
  "vertical-align",
  "white-space",
];

/**
 * Preserve readable document formatting without copying viewer layout styles.
 * @param {Element} source
 * @param {Element} target
 */
function inlineClipboardStyles(source, target) {
  if (
    !(
      target instanceof HTMLElement ||
      target instanceof SVGElement
    )
  ) {
    return;
  }
  const computed = getComputedStyle(source);
  for (const property of CLIPBOARD_STYLE_PROPERTIES) {
    target.style.setProperty(property, computed.getPropertyValue(property));
  }
  if (source.classList.contains("mermaid-diagram")) return;

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  for (const [index, sourceChild] of sourceChildren.entries()) {
    const targetChild = targetChildren[index];
    if (targetChild) inlineClipboardStyles(sourceChild, targetChild);
  }
}

/**
 * Crop a rendered PNG to pixels that differ materially from its background.
 * @param {Blob} blob
 * @param {number} padding
 * @returns {Promise<Blob>}
 */
async function cropPngToContent(blob, padding) {
  const bitmap = await createImageBitmap(blob);
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = bitmap.width;
  sourceCanvas.height = bitmap.height;
  const sourceContext = sourceCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!sourceContext) throw new Error("Could not inspect the rendered PNG.");
  sourceContext.drawImage(bitmap, 0, 0);
  bitmap.close();

  const pixels = sourceContext.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  ).data;
  const background = [pixels[0], pixels[1], pixels[2]];
  let minX = sourceCanvas.width;
  let minY = sourceCanvas.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < sourceCanvas.height; y += 1) {
    for (let x = 0; x < sourceCanvas.width; x += 1) {
      const offset = (y * sourceCanvas.width + x) * 4;
      if (pixels[offset + 3] < 16) continue;
      const differsFromBackground =
        Math.abs(pixels[offset] - background[0]) > 40 ||
        Math.abs(pixels[offset + 1] - background[1]) > 40 ||
        Math.abs(pixels[offset + 2] - background[2]) > 40;
      if (!differsFromBackground) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return blob;
  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = contentWidth + padding * 2;
  outputCanvas.height = contentHeight + padding * 2;
  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) throw new Error("Could not crop the rendered PNG.");
  outputContext.fillStyle = `rgb(${background.join(",")})`;
  outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
  outputContext.drawImage(
    sourceCanvas,
    minX,
    minY,
    contentWidth,
    contentHeight,
    padding,
    padding,
    contentWidth,
    contentHeight,
  );
  const croppedBlob = await new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("Could not encode the cropped PNG.")),
      "image/png",
    );
  });
  return /** @type {Blob} */ (croppedBlob);
}

/**
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

async function waitForDiagramVisualState() {
  if (!preview.querySelector(".mermaid-diagram.is-highlighted")) return;
  await new Promise((resolve) => window.setTimeout(resolve, 160));
}

function pinDiagramHighlightForExport() {
  const elements = Array.from(
    preview.querySelectorAll(
      ".mermaid-diagram.is-highlighted .node, " +
        ".mermaid-diagram.is-highlighted path[data-edge='true'], " +
        ".mermaid-diagram.is-highlighted .edgeLabels > .edgeLabel",
    ),
  );
  const originals = elements.map((element) => ({
    element,
    opacity: element.getAttribute("opacity"),
    style: element.getAttribute("style"),
  }));
  for (const element of elements) {
    const computed = getComputedStyle(element);
    element.setAttribute("opacity", computed.opacity);
    if (
      element instanceof HTMLElement ||
      element instanceof SVGElement
    ) {
      element.style.setProperty("opacity", computed.opacity, "important");
      if (computed.filter !== "none") {
        element.style.setProperty("filter", computed.filter, "important");
      }
    }
  }
  return () => {
    for (const { element, opacity, style } of originals) {
      if (opacity === null) element.removeAttribute("opacity");
      else element.setAttribute("opacity", opacity);
      if (style === null) element.removeAttribute("style");
      else element.setAttribute("style", style);
    }
  };
}

/** @returns {Promise<Blob>} */
async function renderDocumentPng() {
  await document.fonts.ready;
  await waitForDiagramVisualState();
  const bounds = preview.getBoundingClientRect();
  const width = Math.ceil(Math.max(bounds.width, preview.scrollWidth));
  const height = Math.ceil(Math.max(bounds.height, preview.scrollHeight));
  const restoreHighlight = pinDiagramHighlightForExport();
  let blob;
  try {
    blob = await toBlob(preview, {
      backgroundColor: "#ffffff",
      cacheBust: true,
      height,
      pixelRatio: 2,
      style: {
        boxSizing: "border-box",
        margin: "0",
        maxWidth: "none",
        minHeight: "0",
        overflow: "visible",
        padding: "0",
      },
      width,
    });
  } finally {
    restoreHighlight();
  }
  if (!blob) throw new Error("Could not render the document as PNG.");
  return cropPngToContent(blob, 32);
}

/** @returns {Promise<string>} */
async function createClipboardHtml() {
  await document.fonts.ready;
  await waitForDiagramVisualState();
  const restoreHighlight = pinDiagramHighlightForExport();
  let clone;
  let diagramImages;
  try {
    clone = /** @type {HTMLElement} */ (preview.cloneNode(true));
    inlineClipboardStyles(preview, clone);

    const sourceDiagrams = Array.from(
      preview.querySelectorAll(".mermaid-diagram"),
    );
    diagramImages = await Promise.all(
      sourceDiagrams.map(async (diagram) => {
        const blob = await toBlob(/** @type {HTMLElement} */ (diagram), {
          backgroundColor: "#ffffff",
          cacheBust: true,
          pixelRatio: 2,
        });
        if (!blob) {
          throw new Error("Could not render a Mermaid diagram as PNG.");
        }
        return blobToDataUrl(await cropPngToContent(blob, 24));
      }),
    );
  } finally {
    restoreHighlight();
  }
  const cloneDiagrams = Array.from(
    clone.querySelectorAll(".mermaid-diagram"),
  );
  for (const [index, dataUrl] of diagramImages.entries()) {
    const diagram = cloneDiagrams[index];
    if (!diagram) continue;
    const image = document.createElement("img");
    image.src = dataUrl;
    image.alt = "Rendered Mermaid diagram";
    image.style.cssText =
      "display:block;width:auto;max-width:100%;height:auto;margin:1.5em auto;";
    diagram.replaceWith(image);
  }

  clone.removeAttribute("aria-label");
  clone.style.cssText +=
    "width:auto;max-width:900px;margin:0;padding:24px;background:#fff;";
  return clone.outerHTML;
}

function copyPreviewSelection() {
  const selection = window.getSelection();
  if (!selection) throw new Error("Clipboard selection is unavailable.");
  const previousRanges = Array.from(
    { length: selection.rangeCount },
    (_, index) => selection.getRangeAt(index).cloneRange(),
  );
  const range = document.createRange();
  range.selectNodeContents(preview);
  selection.removeAllRanges();
  selection.addRange(range);
  const copied = document.execCommand("copy");
  selection.removeAllRanges();
  for (const previousRange of previousRanges) selection.addRange(previousRange);
  if (!copied) throw new Error("Clipboard copy was rejected.");
}

async function copyRenderedDocument() {
  const plainText = preview.innerText;
  if (navigator.clipboard?.write && "ClipboardItem" in window) {
    const pngPromise = renderDocumentPng();
    const htmlPromise = createClipboardHtml();
    const item = new ClipboardItem({
      "image/png": pngPromise,
      "text/html": htmlPromise.then(
        (html) => new Blob([html], { type: "text/html" }),
      ),
      "text/plain": new Blob([plainText], { type: "text/plain" }),
    });
    await navigator.clipboard.write([item]);
    return;
  }
  copyPreviewSelection();
}

async function copyRenderedPng() {
  if (!navigator.clipboard?.write || !("ClipboardItem" in window)) {
    throw new Error("PNG clipboard copy is unavailable in this browser.");
  }
  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": renderDocumentPng() }),
  ]);
}

async function downloadRenderedPng() {
  const blob = await renderDocumentPng();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${currentStem}.png`;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * @param {Element} diagram
 * @param {Element} selectedNode
 */
function highlightDiagramNeighborhood(diagram, selectedNode) {
  clearDiagramHighlight();
  const selectedKey = selectedNode.getAttribute("data-workflow-node");
  if (!selectedKey) return;

  diagram.classList.add("is-highlighted");
  selectedNode.classList.add("is-selected");
  selectedNode.setAttribute("aria-pressed", "true");

  for (const edge of diagram.querySelectorAll(
    "path[data-workflow-source][data-workflow-target]",
  )) {
    const source = edge.getAttribute("data-workflow-source");
    const target = edge.getAttribute("data-workflow-target");
    if (source !== selectedKey && target !== selectedKey) continue;

    edge.classList.add("is-related");
    const neighborKey = source === selectedKey ? target : source;
    for (const node of diagram.querySelectorAll("[data-workflow-node]")) {
      if (node.getAttribute("data-workflow-node") === neighborKey) {
        node.classList.add("is-related");
      }
    }

    const edgeId = edge.getAttribute("data-id") ?? edge.id;
    for (const label of diagram.querySelectorAll(".edgeLabel [data-id]")) {
      if (label.getAttribute("data-id") === edgeId) {
        label.closest(".edgeLabel")?.classList.add("is-related");
      }
    }
  }
}

/**
 * @param {string} markdown
 * @param {StatusMode} successMode
 * @param {Date} [successTime]
 */
async function renderMarkdown(markdown, successMode, successTime) {
  const requestId = ++activeRender;
  setPreviewActionsDisabled(true);
  if (!mermaid) {
    showError(
      new Error(COPY[activeLanguage].rendererLoading),
      "mermaidGuidance",
    );
    return;
  }

  try {
    const rawHtml = await marked.parse(markdown);
    if (requestId !== activeRender) return;
    preview.innerHTML = DOMPurify.sanitize(rawHtml);
    for (const link of preview.querySelectorAll("a")) {
      link.setAttribute("rel", "noopener noreferrer");
    }

    const mermaidBlocks = Array.from(
      preview.querySelectorAll("pre > code.language-mermaid"),
    );
    /** @type {unknown[]} */
    const blockErrors = [];

    for (const [index, block] of mermaidBlocks.entries()) {
      const pre = block.parentElement;
      if (!pre) continue;
      try {
        const rendered = await mermaid.render(
          `workflow-${renderNumber++}-${index}`,
          block.textContent ?? "",
        );
        if (requestId !== activeRender) return;
        const container = document.createElement("div");
        container.className = "mermaid-diagram";
        container.insertAdjacentHTML("afterbegin", rendered.svg);
        rendered.bindFunctions?.(container);
        prepareInteractiveDiagram(container);
        pre.replaceWith(container);
      } catch (problem) {
        blockErrors.push(problem);
        pre.classList.add("mermaid-block-error");
      }
    }

    if (requestId !== activeRender) return;
    if (blockErrors.length > 0) {
      showError(blockErrors[0], "mermaidGuidance");
      setStatus("attention");
    } else {
      errorPanel.hidden = true;
      currentError = undefined;
      setPreviewActionsDisabled(false);
      setStatus(successMode, successTime);
    }
    updatePrintOrientation();
  } catch (problem) {
    if (requestId !== activeRender) return;
    showError(problem, "mermaidGuidance");
    setStatus("attention");
  }
}

function scheduleEditorRender() {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(() => {
    void renderMarkdown(codeEditor.getValue(), "live");
  }, EDIT_DELAY_MS);
}

function detachFile() {
  fileHandle = undefined;
  fallbackFile = undefined;
  lastObservedText = undefined;
  updateRefreshUi();
}

/**
 * @param {string} content
 * @param {StatusMode} mode
 * @param {Date} [time]
 * @param {boolean} [syncHash]
 */
function applyEditorCode(content, mode, time, syncHash = true) {
  const markdown = normalizeMarkdownInput(content);
  setEditorValue(markdown);
  if (syncHash) scheduleHashUpdate(markdown);
  void renderMarkdown(markdown, mode, time);
}

/** @param {File} file */
async function renderFile(file) {
  setFilename(file.name);
  try {
    const text = await file.text();
    lastObservedText = text;
    applyEditorCode(
      text,
      fileHandle ? "watching" : "fallback",
      new Date(),
    );
  } catch (problem) {
    showError(problem, "mermaidGuidance");
    setStatus("attention");
  } finally {
    updateRefreshUi();
  }
}

async function readHandle() {
  if (!fileHandle) return;
  await renderFile(await fileHandle.getFile());
}

function chooseFallbackFile() {
  fileInput.value = "";
  fileInput.click();
}

async function chooseFile() {
  if (pickerWindow.showOpenFilePicker) {
    try {
      const [chosenHandle] = await pickerWindow.showOpenFilePicker({
        types: [
          {
            description: "Workflow Markdown",
            accept: { "text/markdown": [".md"] },
          },
        ],
        multiple: false,
      });
      fileHandle = chosenHandle;
      fallbackFile = undefined;
      await readHandle();
      return;
    } catch (problem) {
      if (problem instanceof DOMException && problem.name === "AbortError") return;
    }
  }
  chooseFallbackFile();
}

/** @param {File} file */
async function useFallbackFile(file) {
  fileHandle = undefined;
  fallbackFile = file;
  await renderFile(file);
}

async function pollForChanges() {
  if (!fileHandle || pollInProgress || document.visibilityState === "hidden") return;
  pollInProgress = true;
  try {
    const file = await fileHandle.getFile();
    const text = await file.text();
    if (text !== lastObservedText) await renderFile(file);
  } catch (problem) {
    if (problem instanceof DOMException && problem.name === "NotAllowedError") {
      fileHandle = undefined;
      fallbackFile = undefined;
      setStatus("accessPaused");
      updateRefreshUi();
    }
  } finally {
    pollInProgress = false;
  }
}

function loadHash() {
  try {
    let state;
    try {
      state = decodeUrlState(location.hash);
    } catch (problem) {
      if (!(problem instanceof UrlStateSizeWarning)) throw problem;
      if (!window.confirm(COPY[activeLanguage].sizeWarning)) {
        setFilename("");
        setEditorValue(DEFAULT_CODE);
        void renderMarkdown(DEFAULT_CODE, "sizeBlocked");
        return;
      }
      state = decodeUrlState(location.hash, { allowOversize: true });
    }
    if (state !== undefined) {
      setFilename(state.filename ?? "");
      applyEditorCode(state.code, "live", undefined, false);
      return;
    }
    setFilename("");
    applyEditorCode(DEFAULT_CODE, "live", undefined, false);
  } catch {
    setFilename("");
    setEditorValue(DEFAULT_CODE);
    void renderMarkdown(DEFAULT_CODE, "urlError");
  }
}

languageSwitch.addEventListener("click", (event) => {
  const button =
    event.target instanceof Element
      ? event.target.closest("[data-language]")
      : null;
  if (!(button instanceof HTMLButtonElement)) return;
  const language = button.dataset.language;
  if (language !== "ko" && language !== "en") return;
  activeLanguage = language;
  applyTranslations();
});

viewSwitch.addEventListener("click", (event) => {
  const button =
    event.target instanceof Element
      ? event.target.closest("[data-view-mode]")
      : null;
  if (!(button instanceof HTMLButtonElement)) return;
  const mode = button.dataset.viewMode;
  if (mode !== "split" && mode !== "viewer") return;
  setViewMode(mode);
});

openButton.addEventListener("click", () => void chooseFile());
refreshButton.addEventListener("click", () => {
  if (fileHandle) void readHandle();
  else chooseFallbackFile();
});
copyButton.addEventListener("click", async () => {
  window.clearTimeout(copyResetTimer);
  copyButton.disabled = true;
  setExportActionState("copy", "working");
  try {
    await copyRenderedDocument();
    setExportActionState("copy", "success");
  } catch (problem) {
    console.error(problem);
    try {
      copyPreviewSelection();
      setExportActionState("copy", "success");
    } catch (fallbackProblem) {
      console.error(fallbackProblem);
      setExportActionState("copy", "error");
    }
  } finally {
    copyButton.disabled = printButton.disabled;
    copyResetTimer = window.setTimeout(() => {
      setExportActionState("copy", "default");
    }, 1_800);
  }
});
copyPngButton.addEventListener("click", async () => {
  window.clearTimeout(copyPngResetTimer);
  copyPngButton.disabled = true;
  setExportActionState("copyPng", "working");
  try {
    await copyRenderedPng();
    setExportActionState("copyPng", "success");
  } catch (problem) {
    console.error(problem);
    setExportActionState("copyPng", "error");
  } finally {
    copyPngButton.disabled = printButton.disabled;
    copyPngResetTimer = window.setTimeout(() => {
      setExportActionState("copyPng", "default");
    }, 1_800);
  }
});
pngButton.addEventListener("click", async () => {
  window.clearTimeout(pngResetTimer);
  pngButton.disabled = true;
  setExportActionState("png", "working");
  try {
    await downloadRenderedPng();
    setExportActionState("png", "success");
  } catch (problem) {
    console.error(problem);
    setExportActionState("png", "error");
  } finally {
    pngButton.disabled = printButton.disabled;
    pngResetTimer = window.setTimeout(() => {
      setExportActionState("png", "default");
    }, 1_800);
  }
});
printButton.addEventListener("click", () => {
  document.title = currentStem;
  updatePrintOrientation();
  window.print();
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const selectedNode = target.closest(".mermaid-diagram .node.proc");
  const diagram = selectedNode?.closest(".mermaid-diagram");
  if (selectedNode && diagram) {
    highlightDiagramNeighborhood(diagram, selectedNode);
    return;
  }
  if (target.closest("#preview")) clearDiagramHighlight();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const selectedNode = target.closest(".mermaid-diagram .node.proc");
  const diagram = selectedNode?.closest(".mermaid-diagram");
  if (!selectedNode || !diagram) return;
  event.preventDefault();
  highlightDiagramNeighborhood(diagram, selectedNode);
});

codeEditor.onDidChangeModelContent(() => {
  if (
    programmaticEditorValue !== undefined &&
    codeEditor.getValue() === programmaticEditorValue
  ) {
    programmaticEditorValue = undefined;
    return;
  }
  programmaticEditorValue = undefined;
  detachFile();
  setStatus("live");
  scheduleEditorRender();
  scheduleHashUpdate(codeEditor.getValue());
});

fileInput.addEventListener("change", () => {
  const [file] = fileInput.files ?? [];
  if (file) void useFallbackFile(file);
});

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    if (
      eventName === "drop" ||
      !(event instanceof DragEvent) ||
      !event.relatedTarget ||
      !dropZone.contains(/** @type {Node} */ (event.relatedTarget))
    ) {
      dropZone.classList.remove("is-dragging");
    }
  });
}
dropZone.addEventListener("drop", async (event) => {
  if (!(event instanceof DragEvent)) return;
  const [item] = event.dataTransfer?.items ?? [];
  const [file] = event.dataTransfer?.files ?? [];
  if (!file) return;
  if (!isMarkdownFilename(file.name)) {
    showError(
      new Error("Not a Markdown file"),
      "notMarkdownGuidance",
      "notMarkdown",
    );
    return;
  }
  if (item && "getAsFileSystemHandle" in item) {
    try {
      const handle = await /** @type {DataTransferItem & { getAsFileSystemHandle: () => Promise<FileSystemHandle | null> }} */ (
        item
      ).getAsFileSystemHandle();
      if (handle?.kind === "file") {
        fileHandle = /** @type {FileSystemFileHandle} */ (handle);
        fallbackFile = undefined;
        await readHandle();
        return;
      }
    } catch {
      // Continue with the browser File fallback.
    }
  }
  await useFallbackFile(file);
});

window.addEventListener("hashchange", loadHash);
window.addEventListener("beforeprint", updatePrintOrientation);
window.addEventListener("afterprint", () => {
  document.title =
    currentStem === "workflow" ? COPY[activeLanguage].title : currentStem;
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") void pollForChanges();
});
window.setInterval(() => void pollForChanges(), POLL_INTERVAL_MS);

try {
  const module = await import(/* @vite-ignore */ MERMAID_URL);
  const loadedMermaid = /** @type {NonNullable<typeof mermaid>} */ (module.default);
  loadedMermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    themeVariables: {
      fontFamily:
        '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "Segoe UI", sans-serif',
      primaryColor: "#ffffff",
      primaryBorderColor: "#64736d",
      lineColor: "#53645f",
      textColor: "#17231f",
    },
    flowchart: { htmlLabels: true, useMaxWidth: true },
  });
  mermaid = loadedMermaid;
  openButton.disabled = false;
  loadHash();
} catch (problem) {
  showError(problem, "rendererGuidance", undefined, "rendererError");
}

applyTranslations();
updateViewModeUi();
