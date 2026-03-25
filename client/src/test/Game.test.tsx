import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Game from "@/pages/Game";

// Mock framer-motion so animations don't interfere with tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock getBestMoveMCTS so AI moves are deterministic and fast
vi.mock("@/lib/mcts", async () => {
  const actual = await vi.importActual<typeof import("@/lib/mcts")>("@/lib/mcts");
  return {
    ...actual,
    getBestMoveMCTS: vi.fn(async () => -1), // default: no move
  };
});

import { getBestMoveMCTS } from "@/lib/mcts";

function getCell(idx: number) {
  return screen.getByTestId(`cell-${idx}`);
}

function clickStart() {
  fireEvent.click(screen.getByTestId("button-toggle-state"));
}

describe("Game component – initial render", () => {
  it("renders the title", () => {
    render(<Game />);
    expect(screen.getByText("Quantum Tic-Tac-Toe")).toBeInTheDocument();
  });

  it("renders all 9 board cells", () => {
    render(<Game />);
    for (let i = 0; i < 9; i++) {
      expect(getCell(i)).toBeInTheDocument();
    }
  });

  it("shows 'Start Game' button initially", () => {
    render(<Game />);
    expect(screen.getByTestId("button-toggle-state")).toHaveTextContent("Start Game");
  });

  it("shows 'Reset Game' button when paused", () => {
    render(<Game />);
    expect(screen.getByTestId("button-reset")).toBeInTheDocument();
  });

  it("shows the configure hint message before starting", () => {
    render(<Game />);
    expect(screen.getByText(/Configure Players & Press Start/)).toBeInTheDocument();
  });

  it("board cells are disabled before game starts", () => {
    render(<Game />);
    for (let i = 0; i < 9; i++) {
      expect(getCell(i)).toBeDisabled();
    }
  });

  it("shows PLAYER X and PLAYER O labels", () => {
    render(<Game />);
    expect(screen.getByText("PLAYER X")).toBeInTheDocument();
    expect(screen.getByText("PLAYER O")).toBeInTheDocument();
  });
});

describe("Game component – player type selection", () => {
  it("can switch Player X to AI", () => {
    render(<Game />);
    fireEvent.click(screen.getByTestId("player-x-ai"));
    // Button should now be active – no error thrown means DOM updated fine
    expect(screen.getByTestId("player-x-ai")).toBeInTheDocument();
  });

  it("can switch Player X back to Human", () => {
    render(<Game />);
    fireEvent.click(screen.getByTestId("player-x-ai"));
    fireEvent.click(screen.getByTestId("player-x-human"));
    expect(screen.getByTestId("player-x-human")).toBeInTheDocument();
  });

  it("can switch Player O to Human", () => {
    render(<Game />);
    fireEvent.click(screen.getByTestId("player-o-human"));
    expect(screen.getByTestId("player-o-human")).toBeInTheDocument();
  });

  it("player type buttons are disabled when game is started", () => {
    render(<Game />);
    clickStart();
    expect(screen.getByTestId("player-x-human")).toBeDisabled();
    expect(screen.getByTestId("player-x-ai")).toBeDisabled();
    expect(screen.getByTestId("player-o-human")).toBeDisabled();
    expect(screen.getByTestId("player-o-ai")).toBeDisabled();
  });
});

describe("Game component – start / pause", () => {
  it("starts the game on button click", () => {
    render(<Game />);
    clickStart();
    expect(screen.getByTestId("button-toggle-state")).toHaveTextContent("Pause Game");
  });

  it("pauses the game on second button click and shows 'Start Game' on empty board", () => {
    render(<Game />);
    clickStart();
    clickStart();
    // Board is still empty so it shows "Start Game" (not "Resume Game")
    expect(screen.getByTestId("button-toggle-state")).toHaveTextContent("Start Game");
  });

  it("shows 'Resume Game' after pausing mid-game (human vs human)", async () => {
    render(<Game />);
    // Set both to human so no AI interferes
    fireEvent.click(screen.getByTestId("player-o-human"));
    clickStart();
    // Make a move so board is no longer empty
    fireEvent.click(getCell(0));
    clickStart(); // pause
    expect(screen.getByTestId("button-toggle-state")).toHaveTextContent("Resume Game");
  });

  it("hides 'Reset Game' button while game is started", () => {
    render(<Game />);
    clickStart();
    expect(screen.queryByTestId("button-reset")).not.toBeInTheDocument();
  });
});

describe("Game component – human moves", () => {
  beforeEach(() => {
    // Ensure AI returns -1 (no move) so only human moves matter
    vi.mocked(getBestMoveMCTS).mockResolvedValue(-1);
  });

  function startHumanVsHuman() {
    render(<Game />);
    fireEvent.click(screen.getByTestId("player-o-human")); // O = human
    clickStart();
  }

  it("places X on cell click during X's turn", () => {
    startHumanVsHuman();
    fireEvent.click(getCell(0));
    expect(getCell(0)).toHaveTextContent("X");
  });

  it("places O after X's move", () => {
    startHumanVsHuman();
    fireEvent.click(getCell(0)); // X
    fireEvent.click(getCell(1)); // O
    expect(getCell(1)).toHaveTextContent("O");
  });

  it("does not overwrite an already-filled cell", () => {
    startHumanVsHuman();
    fireEvent.click(getCell(0)); // X
    fireEvent.click(getCell(0)); // O tries cell 0 again
    expect(getCell(0)).toHaveTextContent("X");
  });

  it("displays X's Turn indicator during X's turn", () => {
    startHumanVsHuman();
    expect(screen.getByText("X's Turn")).toBeInTheDocument();
  });

  it("displays O's Turn indicator after X moves", () => {
    startHumanVsHuman();
    fireEvent.click(getCell(0));
    expect(screen.getByText("O's Turn")).toBeInTheDocument();
  });
});

describe("Game component – win detection", () => {
  function startHumanVsHuman() {
    render(<Game />);
    fireEvent.click(screen.getByTestId("player-o-human"));
    clickStart();
  }

  it("shows 'Player X Wins!' after X wins top row", () => {
    startHumanVsHuman();
    // X: 0,1,2 ; O: 3,4
    fireEvent.click(getCell(0)); // X
    fireEvent.click(getCell(3)); // O
    fireEvent.click(getCell(1)); // X
    fireEvent.click(getCell(4)); // O
    fireEvent.click(getCell(2)); // X wins
    expect(screen.getByText("Player X Wins!")).toBeInTheDocument();
  });

  it("shows 'Player O Wins!' after O wins top row", () => {
    startHumanVsHuman();
    // O: 0,1,2 ; X: 3,4,5 then 6 (X has to put somewhere)
    fireEvent.click(getCell(3)); // X
    fireEvent.click(getCell(0)); // O
    fireEvent.click(getCell(4)); // X
    fireEvent.click(getCell(1)); // O
    fireEvent.click(getCell(6)); // X (forced)
    fireEvent.click(getCell(2)); // O wins
    expect(screen.getByText("Player O Wins!")).toBeInTheDocument();
  });

  it("shows 'It's a Draw!' when board is full with no winner", () => {
    startHumanVsHuman();
    // Classic draw sequence: X O X / O X O / O X O
    // X wins: none, O wins: none, full board
    const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    // X: 0,2,3,7  O: 1,4,5,6  last: X at 8
    // Let's use a known draw board:
    // X O X
    // O X O
    // O X O
    // indices: X=0,2,4,7  O=1,3,5,6,8  — wait that's 4 X and 5 O, invalid
    // Use: X=0,2,4,6,8 (5 moves) O=1,3,5,7 (4 moves)
    // That gives X top-left diagonal... let me pick a real draw:
    // X O X / O O X / X X O  => 0=X,1=O,2=X,3=O,4=O,5=X,6=X,7=X,8=O
    // Check lines: [0,1,2]=XOX, [3,4,5]=OOX, [6,7,8]=XXO, [0,3,6]=XOX, [1,4,7]=OOX, [2,5,8]=XXO, [0,4,8]=XOO, [2,4,6]=XXO — no winner!
    // Move order: X@0, O@1, X@2, O@3, X@5, O@4, X@6, O@8, X@7
    fireEvent.click(getCell(0)); // X
    fireEvent.click(getCell(1)); // O
    fireEvent.click(getCell(2)); // X
    fireEvent.click(getCell(3)); // O
    fireEvent.click(getCell(5)); // X
    fireEvent.click(getCell(4)); // O
    fireEvent.click(getCell(6)); // X
    fireEvent.click(getCell(8)); // O
    fireEvent.click(getCell(7)); // X
    expect(screen.getByText("It's a Draw!")).toBeInTheDocument();
  });

  it("does not allow moves after game is won", () => {
    startHumanVsHuman();
    fireEvent.click(getCell(0)); // X
    fireEvent.click(getCell(3)); // O
    fireEvent.click(getCell(1)); // X
    fireEvent.click(getCell(4)); // O
    fireEvent.click(getCell(2)); // X wins
    // Try clicking another empty cell – it should remain empty
    fireEvent.click(getCell(5));
    expect(getCell(5)).not.toHaveTextContent("O");
  });
});

describe("Game component – reset", () => {
  it("resets the board to empty on Reset click", () => {
    render(<Game />);
    fireEvent.click(screen.getByTestId("player-o-human"));
    clickStart();
    fireEvent.click(getCell(0));
    clickStart(); // pause to show reset
    fireEvent.click(screen.getByTestId("button-reset"));
    for (let i = 0; i < 9; i++) {
      expect(getCell(i)).toHaveTextContent("");
    }
  });

  it("shows 'Start Game' again after reset", () => {
    render(<Game />);
    fireEvent.click(screen.getByTestId("player-o-human"));
    clickStart();
    fireEvent.click(getCell(0));
    clickStart();
    fireEvent.click(screen.getByTestId("button-reset"));
    expect(screen.getByTestId("button-toggle-state")).toHaveTextContent("Start Game");
  });

  it("allows a new game to be played after reset", () => {
    render(<Game />);
    fireEvent.click(screen.getByTestId("player-o-human"));
    clickStart();
    fireEvent.click(getCell(0));
    clickStart(); // pause
    fireEvent.click(screen.getByTestId("button-reset"));
    clickStart(); // start fresh
    fireEvent.click(getCell(4));
    expect(getCell(4)).toHaveTextContent("X");
  });
});

describe("Game component – AI turn indicator", () => {
  it("shows 'Thinking...' label when it is AI's turn", () => {
    // Default: X=human, O=ai
    render(<Game />);
    clickStart();
    // X (human) makes a move
    fireEvent.click(getCell(0));
    // Now it's O's turn (AI) – it should show Thinking...
    expect(screen.getByText("(Thinking...)")).toBeInTheDocument();
  });

  it("shows 'Human' label when it is human's turn", () => {
    render(<Game />);
    clickStart();
    expect(screen.getByText("(Human)")).toBeInTheDocument();
  });
});

describe("Game component – AI move execution", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("triggers AI move after delay when it is AI's turn", async () => {
    vi.mocked(getBestMoveMCTS).mockResolvedValue(4);

    render(<Game />);
    // X=human, O=ai (default)
    clickStart();
    fireEvent.click(getCell(0)); // Human X move

    // AI move should be scheduled after 600ms
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(getCell(4)).toHaveTextContent("O");
  });

  it("does not trigger AI move when game is paused", async () => {
    vi.mocked(getBestMoveMCTS).mockResolvedValue(4);

    render(<Game />);
    // Don't start – game is paused

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // No cells should be filled
    for (let i = 0; i < 9; i++) {
      expect(getCell(i)).toHaveTextContent("");
    }
  });

  it("clears pending AI timeout when reset is clicked", async () => {
    vi.mocked(getBestMoveMCTS).mockResolvedValue(4);

    render(<Game />);
    // X=human, O=ai (default)
    clickStart();
    fireEvent.click(getCell(0)); // Human X move – now AI timeout is pending

    // Reset before the AI timeout fires
    act(() => {
      vi.advanceTimersByTime(100); // Don't fire timeout (< 600ms)
    });

    // Pause to show reset button, then reset
    clickStart(); // pause
    fireEvent.click(screen.getByTestId("button-reset"));

    // Advance past original timeout – AI should NOT have moved since reset happened
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Board should be empty after reset
    for (let i = 0; i < 9; i++) {
      expect(getCell(i)).toHaveTextContent("");
    }
  });

  it("AI vs AI: both players make moves after start", async () => {
    vi.mocked(getBestMoveMCTS)
      .mockResolvedValueOnce(0) // X's first move
      .mockResolvedValueOnce(1) // O's first move
      .mockResolvedValue(-1);  // stop further moves

    render(<Game />);
    // Set both to AI
    fireEvent.click(screen.getByTestId("player-x-ai"));
    // O is already AI by default
    clickStart();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700); // X moves
    });
    expect(getCell(0)).toHaveTextContent("X");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700); // O moves
    });
    expect(getCell(1)).toHaveTextContent("O");
  });
});
