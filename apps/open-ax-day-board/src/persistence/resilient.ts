import type {
  BoardPersistenceAdapter,
  BoardState,
  PersistenceStatus,
} from "./types";

export class ResilientPersistenceAdapter implements BoardPersistenceAdapter {
  constructor(
    private readonly local: BoardPersistenceAdapter,
    private readonly remote: BoardPersistenceAdapter | null,
    private readonly onStatus: (status: PersistenceStatus) => void,
  ) {}

  async load(boardId: string): Promise<BoardState | null> {
    if (!this.remote) {
      this.onStatus("local");
      return this.local.load(boardId);
    }

    try {
      const remoteState = await this.remote.load(boardId);
      if (remoteState) await this.local.save(boardId, remoteState);
      this.onStatus("synced");
      return remoteState ?? this.local.load(boardId);
    } catch {
      this.onStatus("offline");
      return this.local.load(boardId);
    }
  }

  async save(boardId: string, state: BoardState): Promise<void> {
    await this.local.save(boardId, state);
    if (!this.remote) {
      this.onStatus("local");
      return;
    }

    this.onStatus("syncing");
    try {
      await this.remote.save(boardId, state);
      this.onStatus("synced");
    } catch {
      this.onStatus("offline");
    }
  }
}

export class DebouncedPersistenceAdapter implements BoardPersistenceAdapter {
  private timer: number | undefined;
  private pending: { boardId: string; state: BoardState } | null = null;

  constructor(
    private readonly target: BoardPersistenceAdapter,
    private readonly delayMs = 350,
  ) {}

  load(boardId: string): Promise<BoardState | null> {
    return this.target.load(boardId);
  }

  async save(boardId: string, state: BoardState): Promise<void> {
    this.pending = { boardId, state: structuredClone(state) };
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      const pending = this.pending;
      this.pending = null;
      if (pending) void this.target.save(pending.boardId, pending.state);
    }, this.delayMs);
  }

  async flush(): Promise<void> {
    window.clearTimeout(this.timer);
    const pending = this.pending;
    this.pending = null;
    if (pending) await this.target.save(pending.boardId, pending.state);
  }
}
