import type { BoardPersistenceAdapter, BoardState } from "./types";

const keyFor = (boardId: string) => `openAxPeopleBoard:${boardId}`;

export class LocalStorageAdapter implements BoardPersistenceAdapter {
  async load(boardId: string): Promise<BoardState | null> {
    const serialized = localStorage.getItem(keyFor(boardId));
    if (!serialized) return null;

    try {
      return JSON.parse(serialized) as BoardState;
    } catch {
      localStorage.removeItem(keyFor(boardId));
      return null;
    }
  }

  async save(boardId: string, state: BoardState): Promise<void> {
    localStorage.setItem(keyFor(boardId), JSON.stringify(state));
  }
}

