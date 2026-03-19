import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Board, Player, checkWinner, getBestMoveMCTS } from "@/lib/mcts";

export default function Game() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isHumanTurn, setIsHumanTurn] = useState(true);
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [difficulty] = useState<number>(3000); // MCTS iterations

  const checkWinState = useCallback((currentBoard: Board) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        setWinner(currentBoard[a] as Player);
        setWinningLine(lines[i]);
        return currentBoard[a] as Player;
      }
    }
    
    if (!currentBoard.includes(null)) {
      setWinner('Draw');
      return 'Draw';
    }
    
    return null;
  }, []);

  const handleCellClick = (index: number) => {
    if (board[index] || winner || !isHumanTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    
    const result = checkWinState(newBoard);
    if (!result) {
      setIsHumanTurn(false);
    }
  };

  useEffect(() => {
    if (!isHumanTurn && !winner) {
      const timer = setTimeout(() => {
        const bestMove = getBestMoveMCTS(board, 'O', difficulty);
        const newBoard = [...board];
        newBoard[bestMove] = 'O';
        setBoard(newBoard);
        
        const result = checkWinState(newBoard);
        if (!result) {
          setIsHumanTurn(true);
        }
      }, 500); // Small delay for UX

      return () => clearTimeout(timer);
    }
  }, [isHumanTurn, winner, board, checkWinState, difficulty]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine(null);
    setIsHumanTurn(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 flex flex-col items-center relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight uppercase">Quantum Tic-Tac-Toe</h1>
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            Human (X) vs MCTS AI (O)
          </p>
        </div>

        {/* Turn indicator */}
        <div className="flex w-full justify-between items-center mb-8 px-4 relative z-10">
          <div className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${isHumanTurn && !winner ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isHumanTurn && !winner ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]' : 'bg-secondary text-muted-foreground'}`}>
              <User size={24} />
            </div>
            <span className="text-xs font-mono font-medium tracking-wider">YOU (X)</span>
          </div>
          
          <div className="text-xl font-bold text-muted-foreground">VS</div>

          <div className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${!isHumanTurn && !winner ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${!isHumanTurn && !winner ? 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(var(--color-accent),0.3)]' : 'bg-secondary text-muted-foreground'}`}>
              <Bot size={24} />
            </div>
            <span className="text-xs font-mono font-medium tracking-wider">AI (O)</span>
          </div>
        </div>

        {/* Game Board */}
        <div className="relative z-10 mb-8 aspect-square w-full max-w-[320px] grid grid-cols-3 grid-rows-3 gap-3">
          {board.map((cell, idx) => {
            const isWinningCell = winningLine?.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={!!cell || !!winner || !isHumanTurn}
                data-testid={`cell-${idx}`}
                className={`game-cell rounded-2xl flex items-center justify-center text-5xl font-bold cursor-pointer relative overflow-hidden
                  ${isWinningCell ? (cell === 'X' ? 'bg-primary/20 shadow-[0_0_20px_rgba(var(--color-primary),0.3)]' : 'bg-accent/20 shadow-[0_0_20px_rgba(var(--color-accent),0.3)]') : ''}
                `}
              >
                <AnimatePresence>
                  {cell && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0, rotate: -45 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`${cell === 'X' ? 'cell-x' : 'cell-o'}`}
                    >
                      {cell}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {/* Game Status / Reset */}
        <div className="h-16 w-full flex items-center justify-center relative z-10">
          <AnimatePresence mode="wait">
            {winner ? (
              <motion.div
                key="winner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center w-full"
              >
                <div className="text-xl font-bold mb-4">
                  {winner === 'Draw' ? (
                    <span className="text-muted-foreground">It's a Draw!</span>
                  ) : winner === 'X' ? (
                    <span className="text-primary">You Won!</span>
                  ) : (
                    <span className="text-accent">AI Won!</span>
                  )}
                </div>
                <Button 
                  onClick={resetGame} 
                  className="w-full rounded-xl py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                  data-testid="button-reset"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Play Again
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground text-sm font-mono flex items-center gap-2"
              >
                {!isHumanTurn && (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                    </span>
                    AI is thinking...
                  </>
                )}
                {isHumanTurn && "Your turn"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      </div>
    </div>
  );
}