import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

function mockMatchMedia(innerWidth: number) {
  let changeListener: (() => void) | null = null;

  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: innerWidth,
  });

  const mockMql = {
    matches: innerWidth < 768,
    addEventListener: vi.fn((_event: string, cb: () => void) => {
      changeListener = cb;
    }),
    removeEventListener: vi.fn(),
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn(() => mockMql),
  });

  return { mockMql, getChangeListener: () => changeListener };
}

describe("useIsMobile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when window is wider than 768px", () => {
    mockMatchMedia(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when window width is below 768px", () => {
    mockMatchMedia(375);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates when the media query change event fires", () => {
    const { getChangeListener } = mockMatchMedia(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate a resize to mobile width
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });
      getChangeListener()?.();
    });

    expect(result.current).toBe(true);
  });

  it("removes event listener on unmount", () => {
    const { mockMql } = mockMatchMedia(1024);
    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(mockMql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });
});
