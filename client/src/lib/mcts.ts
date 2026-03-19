export type Player = 'X' | 'O' | null;
export type Board = Player[];

export function checkWinner(board: Board): Player | 'Draw' | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }
  if (!board.includes(null)) return 'Draw';
  return null;
}

function getAvailableMoves(board: Board): number[] {
  const moves: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) moves.push(i);
  }
  return moves;
}

class Node {
  board: Board;
  player: 'X' | 'O'; // The player whose turn it is to play from this node
  move: number | null; // The move that led to this node
  parent: Node | null;
  children: Node[];
  wins: number; // Wins from the perspective of AI
  visits: number;
  unexploredMoves: number[];

  constructor(board: Board, player: 'X' | 'O', move: number | null = null, parent: Node | null = null) {
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

function simulate(board: Board, playerTurn: 'X' | 'O', aiPlayer: 'X' | 'O'): number {
  let currentBoard = [...board];
  let currentPlayer = playerTurn;
  
  while (true) {
    const result = checkWinner(currentBoard);
    if (result !== null) {
      if (result === 'Draw') return 0.5; // Draw is 0.5 points
      if (result === aiPlayer) return 1; // AI win is 1 point
      return 0; // AI loss is 0 points
    }
    
    const moves = getAvailableMoves(currentBoard);
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    currentBoard[randomMove] = currentPlayer;
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  }
}

function backpropagate(node: Node, result: number) {
  let current: Node | null = node;
  while (current !== null) {
    current.visits += 1;
    current.wins += result;
    current = current.parent;
  }
}

export function getBestMoveMCTS(board: Board, aiPlayer: 'X' | 'O' = 'O', iterations: number = 3000): number {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return -1;
  if (availableMoves.length === 1) return availableMoves[0];
  
  const root = new Node(board, aiPlayer);
  
  for (let i = 0; i < iterations; i++) {
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
  
  // Choose the move with the highest visit count (robust child)
  let bestVisit = -1;
  let bestMove: number | null = null;
  for (const child of root.children) {
    if (child.visits > bestVisit) {
      bestVisit = child.visits;
      bestMove = child.move;
    }
  }
  
  return bestMove !== null ? bestMove : availableMoves[0];
}

function getBestChildPerspective(node: Node, aiPlayer: 'X' | 'O', c: number = 1.414): Node {
  let bestValue = -Infinity;
  let bestNodes: Node[] = [];
  
  // Is it AI's turn from this node?
  const maximizeAI = node.player === aiPlayer;

  for (const child of node.children) {
    // child.wins stores the sum of rewards from the perspective of AI winning.
    let exploitation = child.wins / child.visits;
    
    if (!maximizeAI) {
      // If it's human's turn, they want to MINIMIZE AI's win rate, so they try to MAXIMIZE (1 - AI win rate)
      exploitation = 1 - exploitation; 
    }
    
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