import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, RotateCcw, Sparkles, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Board, Player, checkWinner, getWinningLine, getBestMoveMCTS } from "@/lib/mcts";

export default function Game() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [playerXType, setPlayerXType] = useState<'human' | 'ai'>('human');
  const [playerOType, setPlayerOType] = useState<'human' | 'ai'>('ai');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [difficulty] = useState<number>(3000); // MCTS iterations
  
  const [gameState, setGameState] = useState<'paused' | 'started'>('paused');
  const aiMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkWinState = useCallback((currentBoard: Board) => {
    const result = checkWinner(currentBoard);
    if (result !== null) {
      setWinner(result);
      setWinningLine(getWinningLine(currentBoard));
      setGameState('paused');
    }
    return result;
  }, []);

  const handleMove = useCallback((index: number, player: 'X' | 'O') => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);
    
    const result = checkWinState(newBoard);
    if (!result) {
      setCurrentPlayer(player === 'X' ? 'O' : 'X');
    }
  }, [board, winner, checkWinState]);

  const handleCellClick = (index: number) => {
    if (gameState === 'paused' || winner) return;

    const isHumanTurn = (currentPlayer === 'X' && playerXType === 'human') || 
                        (currentPlayer === 'O' && playerOType === 'human');
    if (!isHumanTurn) return;
    
    handleMove(index, currentPlayer);
  };

  useEffect(() => {
    let cancelled = false;

    // Clear any existing timeout
    if (aiMoveTimeoutRef.current) {
      clearTimeout(aiMoveTimeoutRef.current);
      aiMoveTimeoutRef.current = null;
    }

    if (winner || gameState === 'paused') return;

    const isAITurn = (currentPlayer === 'X' && playerXType === 'ai') || 
                     (currentPlayer === 'O' && playerOType === 'ai');

    if (isAITurn) {
      aiMoveTimeoutRef.current = setTimeout(() => {
        void (async () => {
          try {
            const bestMove = await getBestMoveMCTS(board, currentPlayer, difficulty);
            if (!cancelled && bestMove !== -1) {
              handleMove(bestMove, currentPlayer);
            }
          } catch {
            // Keep the current state untouched on network or parse errors.
          }
        })();
      }, 600); // Delay for visualization
    }

    return () => {
      cancelled = true;
      if (aiMoveTimeoutRef.current) {
        clearTimeout(aiMoveTimeoutRef.current);
        aiMoveTimeoutRef.current = null;
      }
    };
  }, [currentPlayer, playerXType, playerOType, board, winner, difficulty, handleMove, gameState]);

  const resetGame = () => {
    if (aiMoveTimeoutRef.current) {
      clearTimeout(aiMoveTimeoutRef.current);
    }
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine(null);
    setCurrentPlayer('X');
    setGameState('paused');
  };

  const isGameEmpty = board.every(c => c === null);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 flex flex-col items-center relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight uppercase">Quantum Tic-Tac-Toe</h1>
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
        </div>

        {/* Player Configuration */}
        <div className="flex w-full justify-between items-center mb-6 relative z-10">
          {/* Player X */}
          <div className="flex flex-col items-center gap-3">
            <div className={`text-sm font-mono font-bold transition-colors ${currentPlayer === 'X' && !winner ? 'text-primary' : 'text-muted-foreground'}`}>
              PLAYER X
            </div>
            <div className={`flex p-1 rounded-xl bg-background/50 border transition-all duration-300 ${gameState === 'started' ? 'border-transparent opacity-50 grayscale pointer-events-none' : 'border-white/10'}`}>
              <button 
                onClick={() => setPlayerXType('human')}
                disabled={gameState === 'started'}
                data-testid="player-x-human"
                className={`p-2 rounded-lg transition-all ${playerXType === 'human' ? 'bg-primary/20 text-primary shadow-[0_0_10px_hsl(var(--color-primary)/0.2)]' : 'text-muted-foreground hover:text-foreground'}`}
                title="Human"
              >
                <User className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPlayerXType('ai')}
                disabled={gameState === 'started'}
                data-testid="player-x-ai"
                className={`p-2 rounded-lg transition-all ${playerXType === 'ai' ? 'bg-primary/20 text-primary shadow-[0_0_10px_hsl(var(--color-primary)/0.2)]' : 'text-muted-foreground hover:text-foreground'}`}
                title="AI"
              >
                <Bot className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-xl font-black text-white/10 mt-6">VS</div>

          {/* Player O */}
          <div className="flex flex-col items-center gap-3">
            <div className={`text-sm font-mono font-bold transition-colors ${currentPlayer === 'O' && !winner ? 'text-accent' : 'text-muted-foreground'}`}>
              PLAYER O
            </div>
            <div className={`flex p-1 rounded-xl bg-background/50 border transition-all duration-300 ${gameState === 'started' ? 'border-transparent opacity-50 grayscale pointer-events-none' : 'border-white/10'}`}>
              <button 
                onClick={() => setPlayerOType('human')}
                disabled={gameState === 'started'}
                data-testid="player-o-human"
                className={`p-2 rounded-lg transition-all ${playerOType === 'human' ? 'bg-accent/20 text-accent shadow-[0_0_10px_hsl(var(--color-accent)/0.2)]' : 'text-muted-foreground hover:text-foreground'}`}
                title="Human"
              >
                <User className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPlayerOType('ai')}
                disabled={gameState === 'started'}
                data-testid="player-o-ai"
                className={`p-2 rounded-lg transition-all ${playerOType === 'ai' ? 'bg-accent/20 text-accent shadow-[0_0_10px_hsl(var(--color-accent)/0.2)]' : 'text-muted-foreground hover:text-foreground'}`}
                title="AI"
              >
                <Bot className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="h-12 w-full flex items-center justify-center relative z-10 mb-2">
          <AnimatePresence mode="wait">
            {winner ? (
              <motion.div
                key="winner"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-xl font-bold"
              >
                {winner === 'Draw' ? (
                  <span className="text-muted-foreground">It's a Draw!</span>
                ) : winner === 'X' ? (
                  <span className="text-primary drop-shadow-[0_0_8px_hsl(var(--color-primary)/0.5)]">Player X Wins!</span>
                ) : (
                  <span className="text-accent drop-shadow-[0_0_8px_hsl(var(--color-accent)/0.5)]">Player O Wins!</span>
                )}
              </motion.div>
            ) : gameState === 'paused' ? (
              <motion.div
                key="paused-status"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-amber-500/80 font-mono font-medium flex items-center gap-2"
              >
                {isGameEmpty ? (
                  <>Configure Players & Press Start</>
                ) : (
                  <><Pause className="w-4 h-4" /> Game Paused</>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={`turn-${currentPlayer}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 text-sm font-mono"
              >
                {currentPlayer === 'X' ? (
                  <span className="text-primary font-bold">X's Turn</span>
                ) : (
                  <span className="text-accent font-bold">O's Turn</span>
                )}
                <span className="text-muted-foreground opacity-70">
                  ({currentPlayer === 'X' ? (playerXType === 'ai' ? 'Thinking...' : 'Human') : (playerOType === 'ai' ? 'Thinking...' : 'Human')})
                </span>
                {((currentPlayer === 'X' && playerXType === 'ai') || (currentPlayer === 'O' && playerOType === 'ai')) && (
                  <span className="relative flex h-2 w-2 ml-1">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentPlayer === 'X' ? 'bg-primary' : 'bg-accent'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${currentPlayer === 'X' ? 'bg-primary' : 'bg-accent'}`}></span>
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Game Board */}
        <div className="relative z-10 aspect-square w-full max-w-[320px] grid grid-cols-3 grid-rows-3 gap-3 mb-8">
          {board.map((cell, idx) => {
            const isWinningCell = winningLine?.includes(idx);
            const isHumanTurn = (currentPlayer === 'X' && playerXType === 'human') || 
                                (currentPlayer === 'O' && playerOType === 'human');
            const isDisabled = gameState === 'paused' || !!cell || !!winner || !isHumanTurn;
                                
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={isDisabled}
                data-testid={`cell-${idx}`}
                className={`game-cell rounded-2xl flex items-center justify-center text-5xl font-bold relative overflow-hidden
                  ${isWinningCell ? (cell === 'X' ? 'bg-primary/20 shadow-[0_0_20px_hsl(var(--color-primary)/0.3)]' : 'bg-accent/20 shadow-[0_0_20px_hsl(var(--color-accent)/0.3)]') : ''}
                  ${isDisabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:-translate-y-1'}
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

        {/* Controls */}
        <div className="w-full relative z-10 flex flex-col gap-3">
          <Button 
            onClick={() => setGameState(gameState === 'started' ? 'paused' : 'started')} 
            className={`w-full rounded-xl py-6 font-mono font-medium text-lg transition-all ${
              gameState === 'started' 
                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_hsl(var(--color-primary)/0.3)]'
            }`}
            data-testid="button-toggle-state"
          >
            {gameState === 'started' ? (
              <><Pause className="mr-2 h-5 w-5" /> Pause Game</>
            ) : (
              <><Play className="mr-2 h-5 w-5" /> {isGameEmpty ? 'Start Game' : 'Resume Game'}</>
            )}
          </Button>

          <AnimatePresence>
            {gameState === 'paused' && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                className="overflow-hidden"
              >
                <Button 
                  onClick={resetGame} 
                  variant="outline"
                  className="w-full rounded-xl py-6 bg-white/5 border-white/10 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50 transition-all font-mono font-medium mt-2"
                  data-testid="button-reset"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Game
                </Button>
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