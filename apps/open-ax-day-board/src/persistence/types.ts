export type BoardState = Record<string, unknown>;

export interface BoardPersistenceAdapter {
  load(boardId: string): Promise<BoardState | null>;
  save(boardId: string, state: BoardState): Promise<void>;
}

export type PersistenceStatus = "local" | "syncing" | "synced" | "offline";

