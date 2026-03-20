import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("returns an empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("merges a single class name", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  it("resolves Tailwind conflicts (last one wins)", () => {
    // tailwind-merge resolves conflicting utility classes
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles conditional object syntax", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe(
      "text-red-500"
    );
  });

  it("handles array syntax", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});
