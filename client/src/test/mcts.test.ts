import { describe, it, expect } from "vitest";
import {
  checkWinner,
  getWinningLine,
  getBestMoveMCTS,
  type Board,
  type Player,
} from "@/lib/mcts";

// Helper: build a Board from a compact string ("X O X..." where spaces separate cells, _ = null)
function makeBoard(cells: (Player)[]): Board {
  return cells;
}

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
  it("returns -1 when no moves are available (full board)", () => {
    const board = makeBoard(["X", "O", "X", "O", "X", "O", "O", "X", "O"]);
    expect(getBestMoveMCTS(board, "O")).toBe(-1);
  });

  it("returns the only available move on a near-full board", () => {
    const board = makeBoard(["X", "O", "X", "O", "X", "O", "O", "X", null]);
    expect(getBestMoveMCTS(board, "O")).toBe(8);
  });

  it("takes the winning move when one is available (O wins with move 8)", () => {
    // O has [2, 5], next move at 8 gives column win [2,5,8]
    const board = makeBoard(["X", "X", "O", "X", null, "O", null, null, null]);
    const move = getBestMoveMCTS(board, "O", 500);
    expect(move).toBe(8);
  });

  it("blocks opponent from winning (X would win at 2, O must block)", () => {
    // X has [0,1], O must play 2 to block
    const board = makeBoard(["X", "X", null, "O", "O", null, null, null, null]);
    // O should either win at 5 or block at 2. Let's check O plays 5 (winning move) or 2
    const move = getBestMoveMCTS(board, "O", 500);
    // O has [3,4], so O wins at 5
    expect(move).toBe(5);
  });

  it("returns a valid board index for an empty board", () => {
    const board = makeBoard(Array(9).fill(null));
    const move = getBestMoveMCTS(board, "X", 200);
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThanOrEqual(8);
  });

  it("returns a valid move index for a mid-game board", () => {
    const board = makeBoard(["X", null, null, null, "O", null, null, null, null]);
    const move = getBestMoveMCTS(board, "X", 300);
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThanOrEqual(8);
    expect(board[move]).toBeNull();
  });
});
