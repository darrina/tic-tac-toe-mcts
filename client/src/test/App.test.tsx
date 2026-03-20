import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";

// Avoid MCTS heavy computation in App-level tests
vi.mock("@/lib/mcts", async () => {
  const actual = await vi.importActual<typeof import("@/lib/mcts")>("@/lib/mcts");
  return {
    ...actual,
    getBestMoveMCTS: vi.fn(() => -1),
  };
});

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

describe("App", () => {
  it("renders the Game page at '/'", () => {
    render(<App />);
    expect(screen.getByText("Quantum Tic-Tac-Toe")).toBeInTheDocument();
  });
});
