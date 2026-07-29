export type BoardState = Record<string, unknown>;

export interface CloudBoard {
  state: BoardState;
  revision: number;
  updatedAt: string;
}

export interface CloudDraft {
  state: BoardState;
  baseRevision: number | null;
  savedAt: string;
}

export type WorkspaceMode = "cloud" | "cloud-draft" | "local";
export type PersistenceStatus =
  | "cloud"
  | "draft"
  | "local"
  | "saving"
  | "offline";
