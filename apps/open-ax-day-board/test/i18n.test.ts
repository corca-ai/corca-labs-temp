import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLocale, setLocale, t } from "../src/i18n";

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
  setLocale("ko");
});

describe("board localization", () => {
  it("uses Korean by default and interpolates values", () => {
    expect(getLocale()).toBe("ko");
    expect(t("count.people", { count: 16 })).toBe("16명");
    expect(t("toast.randomized", { count: 3 })).toContain("3개 그룹");
  });

  it("switches to English and persists the preference", () => {
    setLocale("en");

    expect(t("count.people", { count: 1 })).toBe("1 person");
    expect(t("count.people", { count: 16 })).toBe("16 people");
    expect(localStorage.getItem("openAxPeopleBoard:locale")).toBe("en");
  });
});
