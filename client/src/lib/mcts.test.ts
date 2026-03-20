import { describe, it, expect } from 'vitest';
import { checkWinner, getWinningLine, getBestMoveMCTS, type Board } from './mcts';

describe('checkWinner', () => {
  it('returns null for an empty board', () => {
    const board: Board = Array(9).fill(null);
    expect(checkWinner(board)).toBeNull();
  });

  it('detects a row win for X', () => {
    const board: Board = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(checkWinner(board)).toBe('X');
  });

  it('detects a column win for O', () => {
    const board: Board = ['O', null, null, 'O', null, null, 'O', null, null];
    expect(checkWinner(board)).toBe('O');
  });

  it('detects a diagonal win for X', () => {
    const board: Board = ['X', null, null, null, 'X', null, null, null, 'X'];
    expect(checkWinner(board)).toBe('X');
  });

  it('returns Draw when the board is full with no winner', () => {
    // X O X
    // X X O
    // O X O
    const board: Board = ['X', 'O', 'X', 'X', 'X', 'O', 'O', 'X', 'O'];
    expect(checkWinner(board)).toBe('Draw');
  });

  it('returns null when the game is still in progress', () => {
    const board: Board = ['X', 'O', null, null, null, null, null, null, null];
    expect(checkWinner(board)).toBeNull();
  });
});

describe('getWinningLine', () => {
  it('returns null when there is no winner', () => {
    const board: Board = Array(9).fill(null);
    expect(getWinningLine(board)).toBeNull();
  });

  it('returns the winning line indices', () => {
    const board: Board = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(getWinningLine(board)).toEqual([0, 1, 2]);
  });

  it('returns the anti-diagonal winning line', () => {
    const board: Board = [null, null, 'O', null, 'O', null, 'O', null, null];
    expect(getWinningLine(board)).toEqual([2, 4, 6]);
  });
});

describe('getBestMoveMCTS', () => {
  it('returns -1 for a full board', () => {
    const board: Board = ['X', 'O', 'X', 'X', 'X', 'O', 'O', 'X', 'O'];
    expect(getBestMoveMCTS(board)).toBe(-1);
  });

  it('returns the only available move on a near-full board', () => {
    const board: Board = ['X', 'O', 'X', 'X', 'X', 'O', 'O', 'X', null];
    expect(getBestMoveMCTS(board)).toBe(8);
  });

  it('blocks an immediate human win', () => {
    // O about to win across the bottom row (indices 6, 7) - AI must play 8
    const board: Board = ['X', null, null, null, 'X', null, 'O', 'O', null];
    const move = getBestMoveMCTS(board, 'X');
    expect(move).toBe(8);
  });

  it('takes an immediate winning move', () => {
    // AI (O) can win at index 2
    const board: Board = ['O', 'O', null, 'X', 'X', null, null, null, null];
    const move = getBestMoveMCTS(board, 'O');
    expect(move).toBe(2);
  });

  it('returns a valid board index for a standard mid-game position', () => {
    const board: Board = ['X', null, null, null, 'O', null, null, null, 'X'];
    const move = getBestMoveMCTS(board, 'O', 500);
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(9);
    expect(board[move]).toBeNull();
  });
});
