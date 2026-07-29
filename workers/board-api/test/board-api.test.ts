import { env, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const boardUrl = "https://example.com/boards/test-board-123";

describe("board API", () => {
  it("stores and retrieves an isolated board", async () => {
    const state = { positions: { alpha: { x: 10, y: 20 } }, notes: { alpha: "hello" } };
    const put = await SELF.fetch(boardUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, expectedRevision: null }),
    });
    expect(put.status).toBe(200);
    expect((await put.json()) as { revision: number }).toMatchObject({ revision: 1 });

    const get = await SELF.fetch(boardUrl);
    expect(get.status).toBe(200);
    expect((await get.json()) as { state: unknown }).toMatchObject({ state });
  });

  it("rejects stale revisions unless overwrite is explicit", async () => {
    const initial = await SELF.fetch("https://example.com/boards/conflict-board", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: { value: "first" }, expectedRevision: null }),
    });
    expect(initial.status).toBe(200);

    const stale = await SELF.fetch("https://example.com/boards/conflict-board", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: { value: "stale" }, expectedRevision: null }),
    });
    expect(stale.status).toBe(409);
    expect((await stale.json()) as { current: { state: unknown } }).toMatchObject({
      current: { state: { value: "first" } },
    });

    const forced = await SELF.fetch("https://example.com/boards/conflict-board", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: { value: "forced" }, expectedRevision: null, force: true }),
    });
    expect(forced.status).toBe(200);
    expect((await forced.json()) as { revision: number }).toMatchObject({ revision: 2 });
  });

  it("caps newly reserved cloud boards at 100", async () => {
    const registry = env.REGISTRY.getByName("cap-test");
    for (let index = 0; index < 100; index += 1) {
      expect(await registry.reserveBoard(`board-${index}`)).toMatchObject({ accepted: true });
    }
    expect(await registry.reserveBoard("board-100")).toEqual({
      accepted: false,
      newlyReserved: false,
    });
    expect(await registry.reserveBoard("board-0")).toEqual({
      accepted: true,
      newlyReserved: false,
    });
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
