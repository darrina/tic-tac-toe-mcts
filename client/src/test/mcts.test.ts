import { describe, it, expect, vi, afterEach } from "vitest";
import {
  checkWinner,
  getWinningLine,
  getBestMoveMCTS,
  type Board,
  type Player,
} from "../lib/mcts";

// Helper: build a Board from a compact string ("X O X..." where spaces separate cells, _ = null)
function makeBoard(cells: (Player)[]): Board {
  return cells;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkWinner", () => {
  it("returns null for an empty board", () => {
    const board = makeBoard(Array(9).fill(null));
    expect(checkWinner(board)).toBeNull();
  });

  it("returns null when game is still in progress", () => {
    const board = makeBoard(["X", "O", null, null, "X", null, null, null, null]);
    expect(checkWinner(board)).toBeNull();
  });

  it("detects X winning on top row [0,1,2]", () => {
    const board = makeBoard(["X", "X", "X", "O", "O", null, null, null, null]);
    expect(checkWinner(board)).toBe("X");
  });

  it("detects X winning on middle row [3,4,5]", () => {
    const board = makeBoard([null, null, null, "X", "X", "X", "O", "O", null]);
    expect(checkWinner(board)).toBe("X");
  });

  it("detects X winning on bottom row [6,7,8]", () => {
    const board = makeBoard(["O", "O", null, null, null, null, "X", "X", "X"]);
    expect(checkWinner(board)).toBe("X");
  });

  it("detects O winning on left column [0,3,6]", () => {
    const board = makeBoard(["O", "X", null, "O", "X", null, "O", null, null]);
    expect(checkWinner(board)).toBe("O");
  });

  it("detects O winning on middle column [1,4,7]", () => {
    const board = makeBoard(["X", "O", null, "X", "O", null, null, "O", null]);
    expect(checkWinner(board)).toBe("O");
  });

  it("detects O winning on right column [2,5,8]", () => {
    const board = makeBoard(["X", null, "O", "X", null, "O", null, null, "O"]);
    expect(checkWinner(board)).toBe("O");
  });

  it("detects X winning on main diagonal [0,4,8]", () => {
    const board = makeBoard(["X", "O", null, "O", "X", null, null, null, "X"]);
    expect(checkWinner(board)).toBe("X");
  });

  it("detects X winning on anti-diagonal [2,4,6]", () => {
    const board = makeBoard([null, "O", "X", "O", "X", null, "X", null, null]);
    expect(checkWinner(board)).toBe("X");
  });

  it("returns Draw when board is full with no winner", () => {
    // X O X / O X O / O X O  — no winning line
    const board = makeBoard(["X", "O", "X", "O", "X", "O", "O", "X", "O"]);
    expect(checkWinner(board)).toBe("Draw");
  });
});

describe("getWinningLine", () => {
  it("returns null for an empty board", () => {
    expect(getWinningLine(Array(9).fill(null))).toBeNull();
  });

  it("returns null when no winner yet", () => {
    const board = makeBoard(["X", "O", null, null, "X", null, null, null, null]);
    expect(getWinningLine(board)).toBeNull();
  });

  it("returns [0,1,2] for X winning top row", () => {
    const board = makeBoard(["X", "X", "X", "O", "O", null, null, null, null]);
    expect(getWinningLine(board)).toEqual([0, 1, 2]);
  });

  it("returns [3,4,5] for X winning middle row", () => {
    const board = makeBoard([null, null, null, "X", "X", "X", "O", "O", null]);
    expect(getWinningLine(board)).toEqual([3, 4, 5]);
  });

  it("returns [6,7,8] for X winning bottom row", () => {
    const board = makeBoard(["O", "O", null, null, null, null, "X", "X", "X"]);
    expect(getWinningLine(board)).toEqual([6, 7, 8]);
  });

  it("returns [0,3,6] for O winning left column", () => {
    const board = makeBoard(["O", "X", null, "O", "X", null, "O", null, null]);
    expect(getWinningLine(board)).toEqual([0, 3, 6]);
  });

  it("returns [1,4,7] for O winning middle column", () => {
    const board = makeBoard(["X", "O", null, "X", "O", null, null, "O", null]);
    expect(getWinningLine(board)).toEqual([1, 4, 7]);
  });

  it("returns [2,5,8] for O winning right column", () => {
    const board = makeBoard(["X", null, "O", "X", null, "O", null, null, "O"]);
    expect(getWinningLine(board)).toEqual([2, 5, 8]);
  });

  it("returns [0,4,8] for X winning main diagonal", () => {
    const board = makeBoard(["X", "O", null, "O", "X", null, null, null, "X"]);
    expect(getWinningLine(board)).toEqual([0, 4, 8]);
  });

  it("returns [2,4,6] for X winning anti-diagonal", () => {
    const board = makeBoard([null, "O", "X", "O", "X", null, "X", null, null]);
    expect(getWinningLine(board)).toEqual([2, 4, 6]);
  });
});

describe("getBestMoveMCTS", () => {
  it("posts board payload and returns the server move", async () => {
    const board = makeBoard(["X", null, null, null, "O", null, null, null, null]);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ move: 4 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const move = await getBestMoveMCTS(board, "X", 1234);

    expect(move).toBe(4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/mcts/next-move",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );

    const payload = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    ) as { board: Board; aiPlayer: "X" | "O"; iterations: number };
    expect(payload.board).toEqual(board);
    expect(payload.aiPlayer).toBe("X");
    expect(payload.iterations).toBe(1234);

  });

  it("throws when the API returns a non-ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("Bad Request", { status: 400, statusText: "Bad Request" }),
    );
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    await expect(getBestMoveMCTS(makeBoard(Array(9).fill(null)), "O")).rejects.toThrow(
      "400: Bad Request",
    );

  });

  it("throws when the API response shape is invalid", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ bestMove: 2 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    await expect(getBestMoveMCTS(makeBoard(Array(9).fill(null)), "O")).rejects.toThrow(
      "Invalid response from /api/mcts/next-move",
    );

  });
});
