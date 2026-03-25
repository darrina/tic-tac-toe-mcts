import {
  nextMoveResponseSchema,
  type NextMoveRequest,
} from '@shared/schema';
import { apiRequest } from './queryClient';

export type Player = 'X' | 'O' | null;
export type Board = Player[];

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

/** Returns the winning player, 'Draw', or null if the game is still in progress. */
export function checkWinner(board: Board): Player | 'Draw' | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }

  if (!board.includes(null)) {
    return 'Draw';
  }

  return null;
}

/** Returns the three board indices that form the winning line, or null if there is no winner yet. */
export function getWinningLine(board: Board): number[] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [...line];
    }
  }

  return null;
}

/**
 * Asks the server to run MCTS and return the best move index.
 *
 * @param board - Current board state.
 * @param aiPlayer - The player marker controlled by the AI.
 * @param iterations - Number of MCTS simulations to run on the server.
 * @returns The best move index, or -1 when there are no legal moves.
 */
export async function getBestMoveMCTS(
  board: Board,
  aiPlayer: 'X' | 'O' = 'O',
  iterations = 3000,
): Promise<number> {
  const payload: NextMoveRequest = {
    board: [...board],
    aiPlayer,
    iterations,
  };

  const response = await apiRequest('POST', '/api/mcts/next-move', payload);
  const json = await response.json();
  const parsedResponse = nextMoveResponseSchema.safeParse(json);

  if (!parsedResponse.success) {
    throw new Error('Invalid response from /api/mcts/next-move');
  }

  return parsedResponse.data.move;
}
