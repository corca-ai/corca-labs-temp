import { DurableObject } from "cloudflare:workers";

const MAX_CLOUD_BOARDS = 100;

interface CountRow extends Record<string, SqlStorageValue> {
  count: number;
}

export interface BoardReservation {
  accepted: boolean;
  newlyReserved: boolean;
}

export class BoardRegistryDurableObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS cloud_boards (
        board_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL
      )
    `);
  }

  reserveBoard(boardId: string): BoardReservation {
    const exists = this.ctx.storage.sql
      .exec("SELECT board_id FROM cloud_boards WHERE board_id = ? LIMIT 1", boardId)
      .toArray().length > 0;
    if (exists) return { accepted: true, newlyReserved: false };

    const count = this.ctx.storage.sql
      .exec<CountRow>("SELECT COUNT(*) AS count FROM cloud_boards")
      .one().count;
    if (count >= MAX_CLOUD_BOARDS) {
      return { accepted: false, newlyReserved: false };
    }

    this.ctx.storage.sql.exec(
      "INSERT INTO cloud_boards (board_id, created_at) VALUES (?, ?)",
      boardId,
      new Date().toISOString(),
    );
    return { accepted: true, newlyReserved: true };
  }
}
