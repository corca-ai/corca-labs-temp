export { BoardDurableObject } from "./board-durable-object";

const MAX_BODY_BYTES = 1_048_576;
const BOARD_ID_PATTERN = /^[a-zA-Z0-9_-]{8,80}$/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
};

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value);
  return Response.json(data, { ...init, headers });
}

async function readBoundedJson(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("Missing request body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError("Request body too large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

function isBoardState(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    const match = /^\/boards\/([^/]+)$/.exec(url.pathname);
    const boardId = match?.[1];
    if (!boardId || !BOARD_ID_PATTERN.test(boardId)) {
      return json({ error: "Not found" }, { status: 404 });
    }

    const board = env.BOARDS.getByName(boardId);
    if (request.method === "GET") {
      const stored = await board.getBoard();
      return stored ? json(stored) : json({ error: "Board not found" }, { status: 404 });
    }

    if (request.method === "PUT") {
      try {
        const body = await readBoundedJson(request);
        if (!isBoardState(body) || !isBoardState(body.state)) {
          return json({ error: "Expected a JSON object with a state object" }, { status: 400 });
        }
        const stored = await board.putBoard(body.state);
        return json(stored);
      } catch (error) {
        if (error instanceof RangeError) {
          return json({ error: error.message }, { status: 413 });
        }
        return json({ error: "Invalid JSON body" }, { status: 400 });
      }
    }

    return json({ error: "Method not allowed" }, { status: 405 });
  },
} satisfies ExportedHandler<Env>;

