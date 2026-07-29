import type { BoardState, CloudBoard } from "./types";

interface ConflictEnvelope {
  current: CloudBoard | null;
}

export class CloudConflictError extends Error {
  constructor(readonly current: CloudBoard | null) {
    super("The cloud board changed after this draft was created");
    this.name = "CloudConflictError";
  }
}

export class CloudflareBoardAdapter {
  constructor(private readonly apiBaseUrl: string) {}

  async load(boardId: string): Promise<CloudBoard | null> {
    const response = await fetch(this.boardUrl(boardId), {
      headers: { Accept: "application/json" },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Board load failed: ${response.status}`);
    return (await response.json()) as CloudBoard;
  }

  async save(
    boardId: string,
    state: BoardState,
    expectedRevision: number | null,
    force = false,
  ): Promise<CloudBoard> {
    const response = await fetch(this.boardUrl(boardId), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, expectedRevision, force }),
    });
    if (response.status === 409) {
      const envelope = (await response.json()) as ConflictEnvelope;
      throw new CloudConflictError(envelope.current);
    }
    if (!response.ok) throw new Error(`Board save failed: ${response.status}`);
    return (await response.json()) as CloudBoard;
  }

  private boardUrl(boardId: string): string {
    return `${this.apiBaseUrl.replace(/\/$/, "")}/boards/${encodeURIComponent(boardId)}`;
  }
}
