import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const boardUrl = "https://example.com/boards/test-board-123";

describe("board API", () => {
  it("stores and retrieves an isolated board", async () => {
    const state = { positions: { alpha: { x: 10, y: 20 } }, notes: { alpha: "hello" } };
    const put = await SELF.fetch(boardUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    expect(put.status).toBe(200);
    expect((await put.json()) as { revision: number }).toMatchObject({ revision: 1 });

    const get = await SELF.fetch(boardUrl);
    expect(get.status).toBe(200);
    expect((await get.json()) as { state: unknown }).toMatchObject({ state });
  });

  it("rejects malformed and oversized access paths", async () => {
    expect((await SELF.fetch("https://example.com/boards/x")).status).toBe(404);
    expect(
      (
        await SELF.fetch(boardUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: [] }),
        })
      ).status,
    ).toBe(400);
  });

  it("returns permissive CORS headers for possession-based access", async () => {
    const response = await SELF.fetch(boardUrl, { method: "OPTIONS" });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("PUT");
  });
});

