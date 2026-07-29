import {
  choosePrintOrientation,
  filenameStem,
  isMarkdownFilename,
  parseWorkflowMarkdown,
} from "./workflow.js";

const MERMAID_URL =
  "https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs";
const POLL_INTERVAL_MS = 1_500;

const documentTitle =
  /** @type {HTMLElement} */ (document.querySelector("#document-title"));
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
let currentStem = "Workflow viewer";

function nowLabel() {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
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
 * @param {string} guidance
 */
function showError(problem, guidance) {
  welcomePanel.hidden = true;
  viewerPanel.hidden = true;
  errorPanel.hidden = false;
  errorDetail.textContent =
    problem instanceof Error ? problem.message : String(problem);
  errorGuidance.textContent = guidance;
  printButton.disabled = true;
}

function updateRefreshUi() {
  refreshButton.hidden = !fileHandle && !fallbackFile;
  refreshButton.textContent = fileHandle ? "Refresh" : "Choose again";
}

/**
 * @param {string} source
 * @param {string} filename
 * @param {number} requestId
 */
async function renderSource(source, filename, requestId) {
  if (!mermaid) {
    throw new Error("The diagram renderer is still loading. Please try again.");
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
  statusElement.textContent = fileHandle
    ? `Watching for changes · Updated ${nowLabel()}`
    : `Updated ${nowLabel()} · Choose the file again to reread changes`;
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
      parseProblem
        ? "Keep only one Mermaid code block in the Markdown file, then refresh it."
        : "Correct the Mermaid diagram, then refresh this file. You can also open another workflow.",
    );
    statusElement.textContent = "The workflow needs attention";
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
      statusElement.textContent = "File access paused · Select the workflow again";
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
      "This is not a Markdown (.md) file.",
      "Choose a file named FLOW_ORG_NAME_SHORT_TITLE.md.",
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
    `Could not load the Mermaid renderer.\n\n${
      problem instanceof Error ? problem.message : String(problem)
    }`,
    "Check your internet connection and reload this page. Your local file was not accessed.",
  );
}
