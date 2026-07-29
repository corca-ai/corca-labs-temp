import interact from "@interactjs/interactjs";
import template from "./template.html?raw";
import "./board.css";
import { CloudflareBoardAdapter } from "./persistence/cloudflare";
import { LocalStorageAdapter } from "./persistence/local-storage";
import {
  DebouncedPersistenceAdapter,
  ResilientPersistenceAdapter,
} from "./persistence/resilient";
import type { BoardState, PersistenceStatus } from "./persistence/types";

declare global {
  interface Window {
    interact: typeof interact;
    boardPersistence?: {
      boardId: string;
      save(state: BoardState): void;
    };
  }
}

const LEGACY_STORAGE_KEY = "openAxPeopleBoard";

function resolveBoardId(): string {
  const url = new URL(window.location.href);
  const existing = url.searchParams.get("board");
  if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) return existing;

  const boardId = crypto.randomUUID();
  url.searchParams.set("board", boardId);
  history.replaceState(null, "", url);
  return boardId;
}

function renderStatus(status: PersistenceStatus): void {
  const element = document.querySelector<HTMLElement>("#syncStatus");
  if (!element) return;
  const labels: Record<PersistenceStatus, string> = {
    local: "Local",
    syncing: "Saving…",
    synced: "Cloud saved",
    offline: "Offline · local",
  };
  element.dataset.status = status;
  element.textContent = labels[status];
}

async function boot(): Promise<void> {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) throw new Error("Missing app root");
  app.innerHTML = template;

  const header = app.querySelector("header");
  const status = document.createElement("span");
  status.id = "syncStatus";
  status.className = "sync-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  header?.append(status);

  const boardId = resolveBoardId();
  const apiUrl = import.meta.env.VITE_BOARD_API_URL?.trim();
  const local = new LocalStorageAdapter();
  const remote = apiUrl ? new CloudflareBoardAdapter(apiUrl) : null;
  const resilient = new ResilientPersistenceAdapter(local, remote, renderStatus);
  const persistence = new DebouncedPersistenceAdapter(resilient);
  const restored = await persistence.load(boardId);
  if (restored) {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(restored));
  } else {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }

  window.interact = interact;
  window.boardPersistence = {
    boardId,
    save(state) {
      void persistence.save(boardId, state);
    },
  };
  window.addEventListener("pagehide", () => {
    void persistence.flush();
  });

  await import("./board.js");
}

void boot().catch((error: unknown) => {
  console.error("Board startup failed", error);
  const app = document.querySelector<HTMLElement>("#app");
  if (app) {
    app.innerHTML = `<main class="boot-failure"><h1>The board could not start.</h1><p>Your other Corca Labs apps are unaffected. Reload this page to try again.</p><button type="button">Reload</button></main>`;
    app.querySelector("button")?.addEventListener("click", () => location.reload());
  }
});
