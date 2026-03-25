type Player = 'X' | 'O' | null;
type Board = Player[];

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

function checkWinner(board: Board): Player | 'Draw' | null {
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

function getAvailableMoves(board: Board): number[] {
  const moves: number[] = [];

  for (let i = 0; i < 9; i += 1) {
    if (board[i] === null) {
      moves.push(i);
    }
  }

  return moves;
}

class Node {
  board: Board;
  player: 'X' | 'O';
  move: number | null;
  parent: Node | null;
  children: Node[];
  wins: number;
  visits: number;
  unexploredMoves: number[];

  constructor(
    board: Board,
    player: 'X' | 'O',
    move: number | null = null,
    parent: Node | null = null,
  ) {
    this.board = [...board];
    this.player = player;
    this.move = move;
    this.parent = parent;
    this.children = [];
    this.wins = 0;
    this.visits = 0;
    this.unexploredMoves = getAvailableMoves(board);
  }

  isFullyExpanded(): boolean {
    return this.unexploredMoves.length === 0;
  }

  isTerminal(): boolean {
    return checkWinner(this.board) !== null;
  }

  expand(): Node {
    const moveIndex = Math.floor(Math.random() * this.unexploredMoves.length);
    const move = this.unexploredMoves.splice(moveIndex, 1)[0];
    const nextBoard = [...this.board];
    nextBoard[move] = this.player;

    const nextPlayer = this.player === 'X' ? 'O' : 'X';
    const childNode = new Node(nextBoard, nextPlayer, move, this);
    this.children.push(childNode);

    return childNode;
  }
}

function simulate(
  board: Board,
  playerTurn: 'X' | 'O',
  aiPlayer: 'X' | 'O',
): number {
  const currentBoard = [...board];
  let currentPlayer = playerTurn;

  while (true) {
    const result = checkWinner(currentBoard);
    if (result !== null) {
      if (result === 'Draw') {
        return 0.5;
      }

      return result === aiPlayer ? 1 : 0;
    }

    const moves = getAvailableMoves(currentBoard);
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    currentBoard[randomMove] = currentPlayer;
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  }
}

function backpropagate(node: Node, result: number): void {
  let current: Node | null = node;

  while (current !== null) {
    current.visits += 1;
    current.wins += result;
    current = current.parent;
  }
}

function getBestChildPerspective(
  node: Node,
  aiPlayer: 'X' | 'O',
  c = 1.414,
): Node {
  let bestValue = -Infinity;
  let bestNodes: Node[] = [];
  const maximizeAI = node.player === aiPlayer;

  for (const child of node.children) {
    let exploitation = child.wins / child.visits;

    if (!maximizeAI) {
      exploitation = 1 - exploitation;
    }

    // UCB1 = exploitation + c * sqrt(ln(parentVisits) / childVisits), c = sqrt(2).
    const ucb1 = exploitation + c * Math.sqrt(Math.log(node.visits) / child.visits);

    if (ucb1 > bestValue) {
      bestValue = ucb1;
      bestNodes = [child];
    } else if (ucb1 === bestValue) {
      bestNodes.push(child);
    }
  }

  return bestNodes[Math.floor(Math.random() * bestNodes.length)];
}

/**
 * Runs Monte Carlo Tree Search to find the best move for the given AI player.
 *
 * @param board - Current 9-cell board state.
 * @param aiPlayer - Marker controlled by the AI.
 * @param iterations - Number of MCTS simulations to run.
 * @returns The best move index, or -1 when no legal moves remain.
 */
export function getBestMoveMCTS(
  board: Board,
  aiPlayer: 'X' | 'O' = 'O',
  iterations = 3000,
): number {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) {
    return -1;
  }

  if (availableMoves.length === 1) {
    return availableMoves[0];
  }

  const root = new Node(board, aiPlayer);

  for (let i = 0; i < iterations; i += 1) {
    let node = root;

    // Selection
    while (!node.isTerminal() && node.isFullyExpanded()) {
      node = getBestChildPerspective(node, aiPlayer);
    }

    // Expansion
    if (!node.isTerminal() && !node.isFullyExpanded()) {
      node = node.expand();
    }

    // Simulation
    const result = simulate(node.board, node.player, aiPlayer);

    // Backpropagation
    backpropagate(node, result);
  }

  let bestVisit = -1;
  let bestMove: number | null = null;

  for (const child of root.children) {
    if (child.visits > bestVisit) {
      bestVisit = child.visits;
      bestMove = child.move;
    }
  }

  return bestMove ?? availableMoves[0];
}
