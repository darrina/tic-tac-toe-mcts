import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { QueryClient } from "@tanstack/react-query";

describe("apiRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("makes a GET request without a body", async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const res = await apiRequest("GET", "/api/test");
    expect(fetchSpy).toHaveBeenCalledWith("/api/test", {
      method: "GET",
      headers: {},
      body: undefined,
      credentials: "include",
    });
    expect(res.status).toBe(200);
  });

  it("makes a POST request with a JSON body", async () => {
    const mockResponse = new Response("{}", { status: 200 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    await apiRequest("POST", "/api/data", { name: "test" });
    expect(fetchSpy).toHaveBeenCalledWith("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test" }),
      credentials: "include",
    });
  });

  it("throws when the response is not ok", async () => {
    const mockResponse = new Response("Not Found", { status: 404 });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    await expect(apiRequest("GET", "/api/missing")).rejects.toThrow("404");
  });
});

describe("getQueryFn", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and returns JSON on success", async () => {
    const data = { value: 42 };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(data), { status: 200 })
    );

    const fn = getQueryFn<{ value: number }>({ on401: "throw" });
    const result = await fn({ queryKey: ["/api/test"], signal: new AbortController().signal, meta: undefined });
    expect(result).toEqual(data);
  });

  it("returns null on 401 when on401 is returnNull", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Unauthorized", { status: 401 })
    );

    const fn = getQueryFn<unknown>({ on401: "returnNull" });
    const result = await fn({ queryKey: ["/api/protected"], signal: new AbortController().signal, meta: undefined });
    expect(result).toBeNull();
  });

  it("throws on 401 when on401 is throw", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Unauthorized", { status: 401 })
    );

    const fn = getQueryFn<unknown>({ on401: "throw" });
    await expect(
      fn({ queryKey: ["/api/protected"], signal: new AbortController().signal, meta: undefined })
    ).rejects.toThrow("401");
  });

  it("throws on non-401 error responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Internal Server Error", { status: 500 })
    );

    const fn = getQueryFn<unknown>({ on401: "returnNull" });
    await expect(
      fn({ queryKey: ["/api/error"], signal: new AbortController().signal, meta: undefined })
    ).rejects.toThrow("500");
  });
});

describe("queryClient", () => {
  it("is an instance of QueryClient", () => {
    expect(queryClient).toBeInstanceOf(QueryClient);
  });

  it("has staleTime set to Infinity", () => {
    const options = queryClient.getDefaultOptions();
    expect(options.queries?.staleTime).toBe(Infinity);
  });

  it("has retry set to false for queries", () => {
    const options = queryClient.getDefaultOptions();
    expect(options.queries?.retry).toBe(false);
  });

  it("has retry set to false for mutations", () => {
    const options = queryClient.getDefaultOptions();
    expect(options.mutations?.retry).toBe(false);
  });
});
