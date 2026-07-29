import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CloudConflictError,
  CloudflareBoardAdapter,
} from "../src/persistence/cloudflare";
import { LocalWorkspaceStore } from "../src/persistence/local-storage";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage());
  vi.restoreAllMocks();
});

describe("LocalWorkspaceStore", () => {
  it("keeps local boards, cloud drafts, and backups separate", () => {
    const store = new LocalWorkspaceStore();
    const draft = {
      state: { nickname: "Draft" },
      baseRevision: 3,
      savedAt: "2026-07-29T00:00:00.000Z",
    };

    store.saveLocal("local-123", { nickname: "Local" });
    store.saveDraft("cloud-123", draft);
    store.saveBackup("cloud-123", { ...draft, state: { nickname: "Backup" } });

    expect(store.loadLocal("local-123")).toEqual({ nickname: "Local" });
    expect(store.loadDraft("cloud-123")).toEqual(draft);
    expect(store.loadBackup("cloud-123")?.state).toEqual({ nickname: "Backup" });

    store.deleteDraft("cloud-123");
    expect(store.loadDraft("cloud-123")).toBeNull();
    expect(store.loadBackup("cloud-123")?.state).toEqual({ nickname: "Backup" });
  });
});

describe("CloudflareBoardAdapter", () => {
  it("sends the expected revision and explicit overwrite flag", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        state: { nickname: "Saved" },
        revision: 5,
        updatedAt: "2026-07-29T00:00:00.000Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new CloudflareBoardAdapter("https://worker.example/");
    await adapter.save("cloud-123", { nickname: "Saved" }, 4, true);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      state: { nickname: "Saved" },
      expectedRevision: 4,
      force: true,
    });
  });

  it("exposes the latest cloud state on revision conflict", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json(
          {
            error: "Revision conflict",
            current: {
              state: { nickname: "Someone else" },
              revision: 7,
              updatedAt: "2026-07-29T00:00:00.000Z",
            },
          },
          { status: 409 },
        ),
      ),
    );

    const adapter = new CloudflareBoardAdapter("https://worker.example");
    const error = await adapter
      .save("cloud-123", { nickname: "Mine" }, 6)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(CloudConflictError);
    expect((error as CloudConflictError).current?.revision).toBe(7);
  });
});
