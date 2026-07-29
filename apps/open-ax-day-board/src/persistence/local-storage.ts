import type { BoardState, CloudDraft } from "./types";

const localBoardKey = (id: string) => `openAxPeopleBoard:local:${id}`;
const cloudDraftKey = (id: string) => `openAxPeopleBoard:cloud-draft:${id}`;
const cloudBackupKey = (id: string) => `openAxPeopleBoard:cloud-backup:${id}`;

function readJson<T>(key: string): T | null {
  const serialized = localStorage.getItem(key);
  if (!serialized) return null;
  try {
    return JSON.parse(serialized) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export class LocalWorkspaceStore {
  loadLocal(id: string): BoardState | null {
    return readJson<BoardState>(localBoardKey(id));
  }

  saveLocal(id: string, state: BoardState): void {
    localStorage.setItem(localBoardKey(id), JSON.stringify(state));
  }

  loadDraft(boardId: string): CloudDraft | null {
    return readJson<CloudDraft>(cloudDraftKey(boardId));
  }

  saveDraft(boardId: string, draft: CloudDraft): void {
    localStorage.setItem(cloudDraftKey(boardId), JSON.stringify(draft));
  }

  deleteDraft(boardId: string): void {
    localStorage.removeItem(cloudDraftKey(boardId));
  }

  loadBackup(boardId: string): CloudDraft | null {
    return readJson<CloudDraft>(cloudBackupKey(boardId));
  }

  saveBackup(boardId: string, draft: CloudDraft): void {
    localStorage.setItem(cloudBackupKey(boardId), JSON.stringify(draft));
  }
}
