import type { BoardPersistenceAdapter, BoardState } from "./types";

interface BoardEnvelope {
  state: BoardState | null;
}

export class CloudflareBoardAdapter implements BoardPersistenceAdapter {
  constructor(private readonly apiBaseUrl: string) {}

  async load(boardId: string): Promise<BoardState | null> {
    const response = await fetch(this.boardUrl(boardId), {
      headers: { Accept: "application/json" },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Board load failed: ${response.status}`);
    const envelope = (await response.json()) as BoardEnvelope;
    return envelope.state;
  }

  async save(boardId: string, state: BoardState): Promise<void> {
    const response = await fetch(this.boardUrl(boardId), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    if (!response.ok) throw new Error(`Board save failed: ${response.status}`);
  }

  private boardUrl(boardId: string): string {
    return `${this.apiBaseUrl.replace(/\/$/, "")}/boards/${encodeURIComponent(boardId)}`;
  }
}

