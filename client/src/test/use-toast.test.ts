import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { reducer, useToast, toast } from "@/hooks/use-toast";
import type { ToastProps } from "@/components/ui/toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: string;
  description?: string;
};

const makeToast = (overrides: Partial<ToasterToast> = {}): ToasterToast => ({
  id: "1",
  open: true,
  ...overrides,
});

describe("use-toast reducer", () => {
  it("ADD_TOAST adds a toast to an empty list", () => {
    const t = makeToast({ id: "a" });
    const state = reducer({ toasts: [] }, { type: "ADD_TOAST", toast: t });
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].id).toBe("a");
  });

  it("ADD_TOAST respects TOAST_LIMIT (1)", () => {
    const existing = makeToast({ id: "old" });
    const incoming = makeToast({ id: "new" });
    const state = reducer(
      { toasts: [existing] },
      { type: "ADD_TOAST", toast: incoming }
    );
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].id).toBe("new");
  });

  it("UPDATE_TOAST updates the matching toast", () => {
    const t = makeToast({ id: "1", title: "Original" });
    const updated = reducer(
      { toasts: [t] },
      { type: "UPDATE_TOAST", toast: { id: "1", title: "Updated" } }
    );
    expect(updated.toasts[0].title).toBe("Updated");
  });

  it("UPDATE_TOAST leaves non-matching toasts unchanged", () => {
    const t = makeToast({ id: "2", title: "Other" });
    const updated = reducer(
      { toasts: [t] },
      { type: "UPDATE_TOAST", toast: { id: "99", title: "Irrelevant" } }
    );
    expect(updated.toasts[0].title).toBe("Other");
  });

  it("DISMISS_TOAST marks a specific toast as closed", () => {
    const t = makeToast({ id: "5", open: true });
    const next = reducer(
      { toasts: [t] },
      { type: "DISMISS_TOAST", toastId: "5" }
    );
    expect(next.toasts[0].open).toBe(false);
  });

  it("DISMISS_TOAST without id closes all toasts", () => {
    const t1 = makeToast({ id: "a", open: true });
    const t2 = makeToast({ id: "b", open: true });
    const next = reducer({ toasts: [t1, t2] }, { type: "DISMISS_TOAST" });
    expect(next.toasts.every((t) => t.open === false)).toBe(true);
  });

  it("REMOVE_TOAST removes the toast with the given id", () => {
    const t = makeToast({ id: "r1" });
    const next = reducer(
      { toasts: [t] },
      { type: "REMOVE_TOAST", toastId: "r1" }
    );
    expect(next.toasts).toHaveLength(0);
  });

  it("REMOVE_TOAST without id removes all toasts", () => {
    const t1 = makeToast({ id: "x" });
    const t2 = makeToast({ id: "y" });
    const next = reducer({ toasts: [t1, t2] }, { type: "REMOVE_TOAST" });
    expect(next.toasts).toHaveLength(0);
  });
});

describe("toast() function", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("creates a toast and returns id, dismiss, update", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      const t = toast({ title: "Hello" });
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("dismiss");
      expect(t).toHaveProperty("update");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Hello");
  });

  it("dismiss() on returned toast closes the toast", () => {
    const { result } = renderHook(() => useToast());
    let dismissFn!: () => void;

    act(() => {
      const t = toast({ title: "Dismissible" });
      dismissFn = t.dismiss;
    });

    act(() => {
      dismissFn();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("update() on returned toast updates the toast title", () => {
    const { result } = renderHook(() => useToast());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateFn!: (props: any) => void;
    let toastId!: string;

    act(() => {
      const t = toast({ title: "Original" });
      updateFn = t.update;
      toastId = t.id;
    });

    act(() => {
      updateFn({ id: toastId, title: "Updated", open: true });
    });

    expect(result.current.toasts[0].title).toBe("Updated");
  });

  it("onOpenChange triggers dismiss when open=false", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "Auto-dismiss" });
    });

    const onOpenChange = result.current.toasts[0].onOpenChange;
    act(() => {
      onOpenChange?.(false);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("useToast dismiss() closes all toasts when called without id", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "Toast 1" });
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("useToast dismiss() closes specific toast by id", () => {
    const { result } = renderHook(() => useToast());
    let toastId!: string;

    act(() => {
      const t = toast({ title: "Specific" });
      toastId = t.id;
    });

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });
});

