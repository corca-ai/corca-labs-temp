import { DurableObject } from "cloudflare:workers";

export interface StoredBoard {
  state: Record<string, unknown>;
  revision: number;
  updatedAt: string;
}

interface BoardRow extends Record<string, SqlStorageValue> {
  state_json: string;
  revision: number;
  updated_at: string;
}

export class BoardDurableObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS board_state (
        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
        state_json TEXT NOT NULL,
        revision INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  getBoard(): StoredBoard | null {
    const row = this.ctx.storage.sql
      .exec<BoardRow>(
        "SELECT state_json, revision, updated_at FROM board_state WHERE singleton = 1",
      )
      .toArray()[0];
    if (!row) return null;
    return {
      state: JSON.parse(row.state_json) as Record<string, unknown>,
      revision: row.revision,
      updatedAt: row.updated_at,
    };
  }

  putBoard(
    state: Record<string, unknown>,
    expectedRevision: number,
    force: boolean,
  ): StoredBoard | null {
    const current = this.getBoard();
    if (!force && expectedRevision !== (current?.revision ?? -1)) {
      return null;
    }

    const stateJson = JSON.stringify(state);
    const updatedAt = new Date().toISOString();
    const row = this.ctx.storage.sql
      .exec<BoardRow>(
        `INSERT INTO board_state (singleton, state_json, revision, updated_at)
         VALUES (1, ?, 1, ?)
         ON CONFLICT(singleton) DO UPDATE SET
           state_json = excluded.state_json,
           revision = board_state.revision + 1,
           updated_at = excluded.updated_at
         RETURNING state_json, revision, updated_at`,
        stateJson,
        updatedAt,
      )
      .one();
    return {
      state,
      revision: row.revision,
      updatedAt: row.updated_at,
    };
  }
}
