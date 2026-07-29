import actions from "@interactjs/actions/plugin.js";
import autoStart from "@interactjs/auto-start/plugin.js";
import inertia from "@interactjs/inertia/plugin.js";
import interact from "@interactjs/interact/index.js";
import interactModifiers from "@interactjs/modifiers/all.js";
import modifiersPlugin from "@interactjs/modifiers/plugin.js";
import template from "./template.html?raw";
import "./board.css";
import {
  CloudConflictError,
  CloudflareBoardAdapter,
} from "./persistence/cloudflare";
import { LocalWorkspaceStore } from "./persistence/local-storage";
import type {
  BoardState,
  CloudBoard,
  CloudDraft,
  PersistenceStatus,
  WorkspaceMode,
} from "./persistence/types";

declare global {
  interface Window {
    interact: typeof interact;
    interactModifiers: typeof interactModifiers;
    boardPersistence?: {
      workspaceId: string;
      save(state: BoardState): void;
    };
  }
}

const LEGACY_STORAGE_KEY = "openAxPeopleBoard";
const RECENTS_KEY = "openAxPeopleBoard:recent-workspaces";
const ID_PATTERN = /^[a-zA-Z0-9_-]{8,80}$/;

interact.use(inertia);
interact.use(modifiersPlugin);
interact.use(autoStart);
interact.use(actions);

interface WorkspaceLocation {
  mode: WorkspaceMode;
  id: string;
}

interface RecentWorkspace {
  kind: "cloud" | "local";
  id: string;
  nickname: string;
  lastOpened: string;
}

function resolveWorkspaceLocation(): WorkspaceLocation {
  const url = new URL(window.location.href);
  const localId = url.searchParams.get("local");
  if (localId && ID_PATTERN.test(localId)) return { mode: "local", id: localId };

  const boardId = url.searchParams.get("board");
  if (boardId && ID_PATTERN.test(boardId)) {
    return {
      mode: url.searchParams.get("workspace") === "draft" ? "cloud-draft" : "cloud",
      id: boardId,
    };
  }

  const id = crypto.randomUUID();
  replaceWorkspaceUrl("local", id);
  return { mode: "local", id };
}

function replaceWorkspaceUrl(mode: WorkspaceMode, id: string): void {
  const url = new URL(window.location.href);
  url.search = "";
  if (mode === "local") {
    url.searchParams.set("local", id);
  } else {
    url.searchParams.set("board", id);
    if (mode === "cloud-draft") url.searchParams.set("workspace", "draft");
  }
  history.replaceState(null, "", url);
}

function statesMatch(a: BoardState | null, b: BoardState): boolean {
  return a !== null && JSON.stringify(a) === JSON.stringify(b);
}

function nicknameOf(state: BoardState | null): string {
  return typeof state?.nickname === "string" ? state.nickname.trim().slice(0, 60) : "";
}

function emitToast(message: string): void {
  window.dispatchEvent(new CustomEvent("board:toast", { detail: message }));
}

function loadRecents(): RecentWorkspace[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is RecentWorkspace =>
        typeof item === "object" &&
        item !== null &&
        (item as RecentWorkspace).kind in { cloud: true, local: true } &&
        ID_PATTERN.test((item as RecentWorkspace).id),
    );
  } catch {
    return [];
  }
}

function rememberWorkspace(entry: RecentWorkspace): void {
  const recents = loadRecents().filter(
    (item) => !(item.kind === entry.kind && item.id === entry.id),
  );
  recents.unshift(entry);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, 12)));
}

class WorkspaceController {
  private mode: WorkspaceMode;
  private readonly id: string;
  private cloudBoard: CloudBoard | null = null;
  private draft: CloudDraft | null = null;
  private currentState: BoardState | null = null;
  private conflictCurrent: CloudBoard | null = null;
  private status: PersistenceStatus;

  constructor(
    location: WorkspaceLocation,
    private readonly local: LocalWorkspaceStore,
    private readonly remote: CloudflareBoardAdapter | null,
  ) {
    this.mode = location.mode;
    this.id = location.id;
    this.status = location.mode === "local" ? "local" : "cloud";
  }

  async load(): Promise<BoardState | null> {
    if (this.mode === "local") {
      this.currentState = this.local.loadLocal(this.id);
      this.status = "local";
      this.bindUi();
      this.remember();
      this.render();
      return this.currentState;
    }

    const storedDraft = this.local.loadDraft(this.id);
    if (!this.remote) {
      this.mode = storedDraft ? "cloud-draft" : "cloud";
      this.draft = storedDraft;
      this.currentState = storedDraft?.state ?? null;
      this.status = "offline";
      this.bindUi();
      this.remember();
      this.render();
      return this.currentState;
    }

    try {
      this.cloudBoard = await this.remote.load(this.id);
      if (this.mode === "cloud-draft" && storedDraft) {
        this.draft = storedDraft;
        this.currentState = storedDraft.state;
        this.status = "draft";
      } else {
        this.mode = "cloud";
        this.currentState = this.cloudBoard?.state ?? null;
        this.status = "cloud";
        replaceWorkspaceUrl("cloud", this.id);
      }
    } catch {
      this.draft = storedDraft;
      this.mode = storedDraft ? "cloud-draft" : "cloud";
      this.currentState = storedDraft?.state ?? null;
      this.status = "offline";
    }

    this.bindUi();
    this.remember();
    this.render();
    return this.currentState;
  }

  saveLocalChange(state: BoardState): void {
    this.currentState = structuredClone(state);
    if (this.mode === "local") {
      this.local.saveLocal(this.id, this.currentState);
      this.status = "local";
      this.remember();
      this.render();
      return;
    }

    if (this.mode === "cloud" && statesMatch(this.cloudBoard?.state ?? null, this.currentState)) {
      this.status = "cloud";
      this.remember();
      this.render();
      return;
    }

    const baseRevision = this.draft?.baseRevision ?? this.cloudBoard?.revision ?? null;
    this.draft = {
      state: this.currentState,
      baseRevision,
      savedAt: new Date().toISOString(),
    };
    this.local.saveDraft(this.id, this.draft);
    this.mode = "cloud-draft";
    this.status = "draft";
    replaceWorkspaceUrl("cloud-draft", this.id);
    this.remember();
    this.render();
  }

  private bindUi(): void {
    document.querySelector("#saveCloud")?.addEventListener("click", () => {
      void this.saveDraftToCloud(false);
    });
    document.querySelector("#publishCloud")?.addEventListener("click", () => {
      void this.publishLocal();
    });
    document.querySelector("#openDraft")?.addEventListener("click", () => {
      replaceWorkspaceUrl("cloud-draft", this.id);
      location.reload();
    });
    document.querySelector("#viewCloud")?.addEventListener("click", () => {
      replaceWorkspaceUrl("cloud", this.id);
      location.reload();
    });
    document.querySelector("#pullCloud")?.addEventListener("click", () => {
      if (confirm("Discard this local draft and load the latest cloud state?")) {
        void this.loadLatestCloud();
      }
    });
    document.querySelector("#restoreBackup")?.addEventListener("click", () => {
      this.restoreBackup();
    });
    document.querySelector("#newLocal")?.addEventListener("click", () => {
      replaceWorkspaceUrl("local", crypto.randomUUID());
      location.reload();
    });

    const nickname = document.querySelector<HTMLInputElement>("#boardNickname");
    nickname?.addEventListener("input", () => {
      window.dispatchEvent(
        new CustomEvent("board:set-nickname", {
          detail: nickname.value.slice(0, 60),
        }),
      );
    });

    const dialog = document.querySelector<HTMLDialogElement>("#conflictDialog");
    dialog?.addEventListener("close", () => {
      if (dialog.returnValue === "pull") void this.loadLatestCloud(this.conflictCurrent);
      if (dialog.returnValue === "overwrite") void this.saveDraftToCloud(true);
    });
  }

  private async saveDraftToCloud(force: boolean): Promise<void> {
    if (!this.remote || !this.currentState || this.mode !== "cloud-draft") return;
    const draft = this.draft ?? this.local.loadDraft(this.id);
    if (!draft) return;

    this.status = "saving";
    this.render();
    try {
      const saved = await this.remote.save(
        this.id,
        this.currentState,
        draft.baseRevision,
        force,
      );
      this.local.saveBackup(this.id, {
        state: structuredClone(this.currentState),
        baseRevision: saved.revision,
        savedAt: new Date().toISOString(),
      });
      this.local.deleteDraft(this.id);
      this.cloudBoard = saved;
      this.draft = null;
      this.conflictCurrent = null;
      this.mode = "cloud";
      this.status = "cloud";
      replaceWorkspaceUrl("cloud", this.id);
      this.remember();
      this.render();
      emitToast("Saved the local draft to cloud");
    } catch (error) {
      if (error instanceof CloudConflictError) {
        this.conflictCurrent = error.current;
        this.status = "draft";
        this.render();
        document.querySelector<HTMLDialogElement>("#conflictDialog")?.showModal();
        return;
      }
      this.status = "offline";
      this.render();
      emitToast("Cloud save failed; your local draft is safe");
    }
  }

  private async loadLatestCloud(known?: CloudBoard | null): Promise<void> {
    if (!this.remote || this.mode === "local") return;
    try {
      const latest = known ?? await this.remote.load(this.id);
      this.local.deleteDraft(this.id);
      this.draft = null;
      this.cloudBoard = latest;
      this.mode = "cloud";
      this.status = "cloud";
      replaceWorkspaceUrl("cloud", this.id);
      if (latest) localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(latest.state));
      else localStorage.removeItem(LEGACY_STORAGE_KEY);
      location.reload();
    } catch {
      this.status = "offline";
      this.render();
      emitToast("Could not load the latest cloud state");
    }
  }

  private restoreBackup(): void {
    if (this.mode === "local") return;
    const backup = this.local.loadBackup(this.id);
    if (!backup) return;
    if (this.local.loadDraft(this.id) && !confirm("Replace the current local draft with the backup?")) {
      return;
    }
    this.local.saveDraft(this.id, {
      state: backup.state,
      baseRevision: this.cloudBoard?.revision ?? backup.baseRevision,
      savedAt: new Date().toISOString(),
    });
    replaceWorkspaceUrl("cloud-draft", this.id);
    location.reload();
  }

  private async publishLocal(): Promise<void> {
    if (!this.remote || this.mode !== "local" || !this.currentState) return;
    const cloudId = crypto.randomUUID();
    this.status = "saving";
    this.render();
    try {
      const saved = await this.remote.save(cloudId, this.currentState, null);
      this.local.saveBackup(cloudId, {
        state: structuredClone(this.currentState),
        baseRevision: saved.revision,
        savedAt: new Date().toISOString(),
      });
      rememberWorkspace({
        kind: "cloud",
        id: cloudId,
        nickname: nicknameOf(this.currentState),
        lastOpened: new Date().toISOString(),
      });
      replaceWorkspaceUrl("cloud", cloudId);
      location.reload();
    } catch {
      this.status = "local";
      this.render();
      emitToast("Publish failed; this workspace remains local");
    }
  }

  private remember(): void {
    rememberWorkspace({
      kind: this.mode === "local" ? "local" : "cloud",
      id: this.id,
      nickname: nicknameOf(this.currentState),
      lastOpened: new Date().toISOString(),
    });
  }

  private render(): void {
    const status = document.querySelector<HTMLElement>("#syncStatus");
    const title = document.querySelector<HTMLElement>("#workspaceTitle");
    const description = document.querySelector<HTMLElement>("#workspaceDescription");
    if (!status || !title || !description) return;

    const labels: Record<PersistenceStatus, string> = {
      cloud: "Cloud",
      draft: "Local draft",
      local: "Local only",
      saving: "Saving…",
      offline: "Offline",
    };
    status.dataset.status = this.status;
    status.textContent = labels[this.status];

    const isLocal = this.mode === "local";
    const isDraft = this.mode === "cloud-draft";
    title.textContent = isLocal
      ? "Local workspace"
      : isDraft
        ? "Local draft of cloud"
        : "Cloud state";
    description.textContent = isLocal
      ? "Changes stay in this browser until you publish."
      : isDraft
        ? "Autosaved here. The cloud board is unchanged."
        : "Latest cloud state. Your next change creates a local draft.";

    const nickname = document.querySelector<HTMLInputElement>("#boardNickname");
    if (nickname && document.activeElement !== nickname) {
      nickname.value = nicknameOf(this.currentState);
    }

    this.setVisible("#saveCloud", isDraft && Boolean(this.remote));
    this.setVisible("#publishCloud", isLocal && Boolean(this.remote));
    this.setVisible("#openDraft", !isLocal && !isDraft && Boolean(this.local.loadDraft(this.id)));
    this.setVisible("#viewCloud", isDraft);
    this.setVisible("#pullCloud", isDraft && Boolean(this.remote));
    this.setVisible("#restoreBackup", !isLocal && Boolean(this.local.loadBackup(this.id)));
    this.renderRecents();
  }

  private renderRecents(): void {
    const section = document.querySelector<HTMLElement>("#recentSection");
    const container = document.querySelector<HTMLElement>("#recentWorkspaces");
    if (!section || !container) return;
    const recents = loadRecents().filter(
      (item) => !(item.id === this.id && item.kind === (this.mode === "local" ? "local" : "cloud")),
    );
    section.hidden = recents.length === 0;
    container.replaceChildren(
      ...recents.slice(0, 6).map((item) => {
        const link = document.createElement("a");
        const url = new URL(window.location.href);
        url.search = "";
        url.searchParams.set(item.kind === "local" ? "local" : "board", item.id);
        link.href = url.toString();
        const label = document.createElement("span");
        label.textContent = item.nickname || "Untitled board";
        const kind = document.createElement("small");
        kind.textContent = item.kind;
        link.append(label, kind);
        return link;
      }),
    );
  }

  private setVisible(selector: string, visible: boolean): void {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) element.hidden = !visible;
  }

  get workspaceId(): string {
    return this.id;
  }
}

async function boot(): Promise<void> {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) throw new Error("Missing app root");
  app.innerHTML = template;

  const location = resolveWorkspaceLocation();
  const apiUrl = import.meta.env.VITE_BOARD_API_URL?.trim();
  const controller = new WorkspaceController(
    location,
    new LocalWorkspaceStore(),
    apiUrl ? new CloudflareBoardAdapter(apiUrl) : null,
  );
  const restored = await controller.load();
  if (restored) localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(restored));
  else localStorage.removeItem(LEGACY_STORAGE_KEY);

  window.interact = interact;
  window.interactModifiers = interactModifiers;
  window.boardPersistence = {
    workspaceId: controller.workspaceId,
    save(state) {
      controller.saveLocalChange(state);
    },
  };

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
