import {
  choosePrintOrientation,
  filenameStem,
  isMarkdownFilename,
  parseWorkflowMarkdown,
} from "./workflow.js";

const MERMAID_URL =
  "https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs";
const POLL_INTERVAL_MS = 1_500;

const COPY = {
  ko: {
    title: "워크플로 뷰어",
    description: "로컬 Mermaid 워크플로를 미리 보고 PDF로 저장하세요.",
    languageLabel: "언어 선택",
    open: "워크플로 열기",
    refresh: "새로고침",
    chooseAgain: "다시 선택",
    print: "인쇄 / PDF 저장",
    fileInputLabel: "워크플로 Markdown 파일 선택",
    welcomeTitle: "워크플로를 열어 주세요",
    welcomeInstruction: "를 선택하거나 Mermaid 워크플로 Markdown 파일을 여기에 끌어다 놓으세요.",
    privacy: "워크플로 파일은 브라우저 안에만 머물며 업로드되지 않습니다.",
    viewerLabel: "렌더링된 워크플로",
    localOnly: "로컬 전용",
    errorLabel: "워크플로를 표시할 수 없습니다",
    errorTitle: "파일을 확인하고 다시 시도해 주세요",
    watching: (/** @type {string} */ time) => `변경 사항 확인 중 · ${time} 업데이트`,
    fallback: (/** @type {string} */ time) => `${time} 업데이트 · 변경 사항을 읽으려면 파일을 다시 선택하세요`,
    attention: "워크플로를 확인해 주세요",
    accessPaused: "파일 접근이 중단되었습니다 · 워크플로를 다시 선택하세요",
    rendererLoading: "다이어그램 렌더러를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.",
    parseError: "비어 있지 않은 ```mermaid 코드 블록 하나만 있어야 하며 다른 Markdown 내용은 포함할 수 없습니다.",
    parseGuidance: "Markdown 파일에는 Mermaid 코드 블록 하나만 남긴 다음 새로고침하세요.",
    mermaidGuidance: "Mermaid 다이어그램을 수정한 다음 파일을 새로고침하세요. 다른 워크플로를 열어도 됩니다.",
    notMarkdown: "Markdown(.md) 파일이 아닙니다.",
    notMarkdownGuidance: "FLOW_ORG_NAME_SHORT_TITLE.md 형식의 파일을 선택하세요.",
    rendererError: "Mermaid 렌더러를 불러올 수 없습니다.",
    rendererGuidance: "인터넷 연결을 확인한 다음 페이지를 새로고침하세요. 로컬 파일에는 접근하지 않았습니다.",
  },
  en: {
    title: "Workflow viewer",
    description: "Preview a local Mermaid workflow and print it as a PDF.",
    languageLabel: "Choose language",
    open: "Open workflow",
    refresh: "Refresh",
    chooseAgain: "Choose again",
    print: "Print / Save PDF",
    fileInputLabel: "Choose a workflow Markdown file",
    welcomeTitle: "Open your workflow",
    welcomeInstruction: ", or drag a Mermaid workflow Markdown file here.",
    privacy: "Your workflow file stays in this browser and is not uploaded.",
    viewerLabel: "Rendered workflow",
    localOnly: "Local only",
    errorLabel: "Couldn’t show this workflow",
    errorTitle: "Check the file and try again",
    watching: (/** @type {string} */ time) => `Watching for changes · Updated ${time}`,
    fallback: (/** @type {string} */ time) => `Updated ${time} · Choose the file again to reread changes`,
    attention: "The workflow needs attention",
    accessPaused: "File access paused · Select the workflow again",
    rendererLoading: "The diagram renderer is still loading. Please try again.",
    parseError: "Expected exactly one non-empty ```mermaid code block and no other Markdown content.",
    parseGuidance: "Keep only one Mermaid code block in the Markdown file, then refresh it.",
    mermaidGuidance: "Correct the Mermaid diagram, then refresh this file. You can also open another workflow.",
    notMarkdown: "This is not a Markdown (.md) file.",
    notMarkdownGuidance: "Choose a file named FLOW_ORG_NAME_SHORT_TITLE.md.",
    rendererError: "Could not load the Mermaid renderer.",
    rendererGuidance: "Check your internet connection and reload this page. Your local file was not accessed.",
  },
};

/** @typedef {"ko" | "en"} Language */
/** @typedef {"none" | "watching" | "fallback" | "attention" | "accessPaused"} StatusMode */

const documentTitle =
  /** @type {HTMLElement} */ (document.querySelector("#document-title"));
const pageDescription =
  /** @type {HTMLMetaElement} */ (document.querySelector("#page-description"));
const languageSwitch =
  /** @type {HTMLElement} */ (document.querySelector("#language-switch"));
const languageOptions =
  /** @type {NodeListOf<HTMLButtonElement>} */ (
    document.querySelectorAll(".language-option")
  );
const openButton =
  /** @type {HTMLButtonElement} */ (document.querySelector("#open-button"));
const refreshButton =
  /** @type {HTMLButtonElement} */ (document.querySelector("#refresh-button"));
const printButton =
  /** @type {HTMLButtonElement} */ (document.querySelector("#print-button"));
const fileInput =
  /** @type {HTMLInputElement} */ (document.querySelector("#file-input"));
const dropZone = /** @type {HTMLElement} */ (document.querySelector("#drop-zone"));
const welcomePanel =
  /** @type {HTMLElement} */ (document.querySelector("#welcome-panel"));
const viewerPanel =
  /** @type {HTMLElement} */ (document.querySelector("#viewer-panel"));
const errorPanel =
  /** @type {HTMLElement} */ (document.querySelector("#error-panel"));
const errorDetail =
  /** @type {HTMLElement} */ (document.querySelector("#error-detail"));
const errorGuidance =
  /** @type {HTMLElement} */ (document.querySelector("#error-guidance"));
const welcomeTitle =
  /** @type {HTMLElement} */ (document.querySelector("#welcome-title"));
const welcomeAction =
  /** @type {HTMLElement} */ (document.querySelector("#welcome-action"));
const welcomeInstruction =
  /** @type {HTMLElement} */ (document.querySelector("#welcome-instruction"));
const privacyNote =
  /** @type {HTMLElement} */ (document.querySelector("#privacy-note"));
const localBadge =
  /** @type {HTMLElement} */ (document.querySelector("#local-badge"));
const errorLabel =
  /** @type {HTMLElement} */ (document.querySelector("#error-label"));
const errorTitle =
  /** @type {HTMLElement} */ (document.querySelector("#error-title"));
const filenameElement =
  /** @type {HTMLElement} */ (document.querySelector("#filename"));
const statusElement =
  /** @type {HTMLElement} */ (document.querySelector("#status"));
const diagram = /** @type {HTMLElement} */ (document.querySelector("#diagram"));
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
let renderNumber = 0;
let pollInProgress = false;
let activeRender = 0;
let currentStem = "";
/** @type {Language} */
let activeLanguage = "ko";
/** @type {StatusMode} */
let statusMode = "none";
/** @type {Date | undefined} */
let statusTime;
/** @type {{ problem: unknown, guidanceKey: "parseGuidance" | "mermaidGuidance" | "notMarkdownGuidance" | "rendererGuidance", detailKey?: "parseError" | "notMarkdown", prefixKey?: "rendererError" } | undefined} */
let currentError;

function nowLabel() {
  return new Intl.DateTimeFormat(activeLanguage === "ko" ? "ko-KR" : "en", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function updateStatus() {
  if (statusMode === "watching" && statusTime) {
    statusElement.textContent = COPY[activeLanguage].watching(
      new Intl.DateTimeFormat(activeLanguage === "ko" ? "ko-KR" : "en", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }).format(statusTime),
    );
  } else if (statusMode === "fallback" && statusTime) {
    statusElement.textContent = COPY[activeLanguage].fallback(
      new Intl.DateTimeFormat(activeLanguage === "ko" ? "ko-KR" : "en", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }).format(statusTime),
    );
  } else {
    statusElement.textContent =
      statusMode === "attention"
        ? COPY[activeLanguage].attention
        : statusMode === "accessPaused"
          ? COPY[activeLanguage].accessPaused
          : "";
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
  const detail = currentError.detailKey
    ? copy[currentError.detailKey]
    : currentError.prefixKey
      ? `${copy[currentError.prefixKey]}\n\n${rawMessage}`
      : rawMessage;
  errorDetail.textContent = detail;
  errorGuidance.textContent = copy[currentError.guidanceKey];
}

function applyTranslations() {
  const copy = COPY[activeLanguage];
  document.documentElement.lang = activeLanguage;
  pageDescription.content = copy.description;
  languageSwitch.setAttribute("aria-label", copy.languageLabel);
  openButton.textContent = copy.open;
  refreshButton.textContent = fileHandle ? copy.refresh : copy.chooseAgain;
  printButton.textContent = copy.print;
  fileInput.setAttribute("aria-label", copy.fileInputLabel);
  welcomeTitle.textContent = copy.welcomeTitle;
  welcomeAction.textContent = copy.open;
  welcomeInstruction.textContent = copy.welcomeInstruction;
  privacyNote.textContent = copy.privacy;
  viewerPanel.setAttribute("aria-label", copy.viewerLabel);
  localBadge.textContent = copy.localOnly;
  errorLabel.textContent = copy.errorLabel;
  errorTitle.textContent = copy.errorTitle;
  for (const option of languageOptions) {
    option.setAttribute(
      "aria-pressed",
      String(option.dataset.language === activeLanguage),
    );
  }
  if (!currentStem) {
    documentTitle.textContent = copy.title;
    document.title = copy.title;
  }
  updateStatus();
  renderErrorCopy();
}

/**
 * @param {string} filename
 */
function setFilename(filename) {
  filenameElement.textContent = filename;
  currentStem = filenameStem(filename);
  documentTitle.textContent = currentStem;
  document.title = currentStem;
}

/**
 * @param {unknown} problem
 * @param {"parseGuidance" | "mermaidGuidance" | "notMarkdownGuidance" | "rendererGuidance"} guidanceKey
 * @param {"parseError" | "notMarkdown"} [detailKey]
 * @param {"rendererError"} [prefixKey]
 */
function showError(problem, guidanceKey, detailKey, prefixKey) {
  currentError = { problem, guidanceKey, detailKey, prefixKey };
  welcomePanel.hidden = true;
  viewerPanel.hidden = true;
  errorPanel.hidden = false;
  renderErrorCopy();
  printButton.disabled = true;
}

function updateRefreshUi() {
  refreshButton.hidden = !fileHandle && !fallbackFile;
  refreshButton.textContent = fileHandle
    ? COPY[activeLanguage].refresh
    : COPY[activeLanguage].chooseAgain;
}

/**
 * @param {string} source
 * @param {string} filename
 * @param {number} requestId
 */
async function renderSource(source, filename, requestId) {
  if (!mermaid) {
    throw new Error(COPY[activeLanguage].rendererLoading);
  }

  const rendered = await mermaid.render(`workflow-${renderNumber++}`, source);
  if (requestId !== activeRender) return;

  diagram.replaceChildren();
  diagram.insertAdjacentHTML("afterbegin", rendered.svg);
  rendered.bindFunctions?.(diagram);
  setFilename(filename);
  welcomePanel.hidden = true;
  errorPanel.hidden = true;
  viewerPanel.hidden = false;
  currentError = undefined;
  setStatus(fileHandle ? "watching" : "fallback", new Date());
  printButton.disabled = false;
  updatePrintOrientation();
}

/**
 * @param {File} file
 */
async function renderFile(file) {
  const requestId = ++activeRender;
  setFilename(file.name);

  try {
    const text = await file.text();
    lastObservedText = text;
    const source = parseWorkflowMarkdown(text);
    await renderSource(source, file.name, requestId);
  } catch (problem) {
    if (requestId !== activeRender) return;
    const parseProblem =
      problem instanceof Error && problem.message.startsWith("Expected exactly");
    showError(
      problem,
      parseProblem ? "parseGuidance" : "mermaidGuidance",
      parseProblem ? "parseError" : undefined,
    );
    setStatus("attention");
  } finally {
    updateRefreshUi();
  }
}

async function readHandle() {
  if (!fileHandle) return;
  const file = await fileHandle.getFile();
  await renderFile(file);
}

function chooseFallbackFile() {
  fileInput.value = "";
  fileInput.click();
}

async function chooseFile() {
  if (pickerWindow.showOpenFilePicker) {
    try {
      const handles = await pickerWindow.showOpenFilePicker({
        types: [
          {
            description: "Workflow Markdown",
            accept: { "text/markdown": [".md"] },
          },
        ],
        multiple: false,
      });
      const [chosenHandle] = handles;
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

/**
 * @param {File} file
 */
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
    if (text !== lastObservedText) {
      await renderFile(file);
    }
  } catch (problem) {
    if (problem instanceof DOMException && problem.name === "NotAllowedError") {
      setStatus("accessPaused");
      fileHandle = undefined;
      fallbackFile = undefined;
      updateRefreshUi();
    }
  } finally {
    pollInProgress = false;
  }
}

function updatePrintOrientation() {
  const svg = diagram.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) return;

  const viewBox = svg.viewBox.baseVal;
  const width = viewBox.width || svg.getBoundingClientRect().width;
  const height = viewBox.height || svg.getBoundingClientRect().height;
  const orientation = choosePrintOrientation(width, height);
  document.documentElement.dataset.printOrientation = orientation;
  printPageStyle.textContent = `@page { size: A4 ${orientation}; margin: 10mm; }`;
}

openButton.addEventListener("click", () => void chooseFile());

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

refreshButton.addEventListener("click", () => {
  if (fileHandle) {
    void readHandle();
  } else {
    chooseFallbackFile();
  }
});

printButton.addEventListener("click", () => {
  document.title = currentStem;
  updatePrintOrientation();
  window.print();
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
    setFilename(file.name);
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
      // Drag-and-drop remains fully functional through the File fallback.
    }
  }

  await useFallbackFile(file);
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") void pollForChanges();
});
window.addEventListener("beforeprint", updatePrintOrientation);
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
      primaryColor: "#e1f5fe",
      primaryBorderColor: "#01579b",
      lineColor: "#53645f",
      textColor: "#17231f",
    },
    flowchart: {
      htmlLabels: true,
      useMaxWidth: true,
    },
  });
  mermaid = loadedMermaid;
  openButton.disabled = false;
} catch (problem) {
  showError(
    problem,
    "rendererGuidance",
    undefined,
    "rendererError",
  );
}

applyTranslations();
