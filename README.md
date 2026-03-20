# Quantum Tic-Tac-Toe (MCTS)

A polished Tic-Tac-Toe game where the AI opponent is powered by a **Monte Carlo Tree Search (MCTS)** algorithm. Play against the AI, watch two AIs battle each other, or pit two humans against one another — all in a sleek, animated interface.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [How MCTS Works](#how-mcts-works)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Running Tests](#running-tests)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- 🤖 **MCTS AI opponent** — strength is tunable via simulation count (default 3,000 iterations)
- 🎮 **Flexible game modes** — Human vs AI, AI vs AI, or Human vs Human
- ⏯ **Start / Pause / Resume** — freeze the game at any point without losing state
- ✨ **Animated UI** — smooth piece placement and win-highlight animations via Framer Motion
- 📱 **Responsive design** — works on mobile, tablet, and desktop
- 🌙 **Dark-first theme** — built with Tailwind CSS v4 and CSS custom properties

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 + TypeScript |
| Styling | Tailwind CSS v4, CSS custom properties |
| UI Components | Radix UI primitives wrapped as shadcn/ui components |
| Animations | Framer Motion |
| Icons | Lucide React |
| Routing | Wouter |
| Server | Express 5 + TypeScript |
| Database ORM | Drizzle ORM + `drizzle-kit` |
| Validation | Zod + `drizzle-zod` |
| Build tool | Vite 7 + `tsx` |
| Testing | Vitest + React Testing Library + jsdom |

---

## How MCTS Works

Monte Carlo Tree Search is a **game-tree search algorithm** that makes decisions by running random simulations rather than exhaustively evaluating every possible game state.

Each iteration of MCTS consists of four phases:

```
Root (current board state)
│
├─ 1. SELECTION   – Traverse the tree using UCB1 to balance exploration/exploitation
│                   until a node is either terminal or not fully expanded.
│
├─ 2. EXPANSION   – Add one new child node for an unexplored move.
│
├─ 3. SIMULATION  – Play out the game randomly ("rollout") from the new node.
│
└─ 4. BACKPROPAGATION – Propagate the result back up the tree, updating
                         visit counts and win scores at every ancestor.
```

After the configured number of iterations the move with the **highest visit count** (the "robust child") is chosen — it is statistically the most reliable choice.

### UCB1 Formula

The **Upper Confidence Bound** formula balances exploitation (picking the known-good move) with exploration (trying less-visited moves):

```
UCB1 = (wins / visits) + c × √(ln(parent_visits) / visits)
```

- `wins / visits` — exploitation: win rate of this move
- `c × √(ln(N) / n)` — exploration bonus (c ≈ √2 ≈ 1.414 by default)

When it is the **human's turn** in the tree, the formula is adjusted to `(1 − win_rate)` so the search correctly models an opponent trying to *minimise* the AI's score.

### Reward scheme

| Outcome | Score |
|---------|-------|
| AI wins | 1.0 |
| Draw | 0.5 |
| AI loses | 0.0 |

All rewards are stored from the **AI player's perspective** regardless of which player the AI controls (X or O).

---

## Project Structure

```
.
├── client/                   # React frontend
│   ├── public/               # Static assets (favicon, OG image)
│   ├── src/
│   │   ├── components/ui/    # Reusable Radix/shadcn UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/
│   │   │   ├── mcts.ts       # ⭐ MCTS algorithm & board logic
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── Game.tsx      # Main game page
│   │   │   └── not-found.tsx
│   │   ├── test/             # Vitest test files
│   │   ├── App.tsx
│   │   ├── index.css         # Global styles + Tailwind layers
│   │   └── main.tsx
│   └── index.html
├── server/                   # Express backend
│   ├── index.ts              # App entry point & middleware
│   ├── routes.ts             # API route registration
│   ├── storage.ts            # Storage interface + in-memory implementation
│   ├── static.ts             # Static file serving for production
│   └── vite.ts               # Vite dev-server integration
├── shared/
│   └── schema.ts             # Drizzle schema + Zod types (shared client/server)
├── script/
│   └── build.ts              # Production build script
├── .github/
│   └── copilot-instructions.md  # AI assistant & contributor guidelines
├── drizzle.config.ts
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20 (LTS recommended)
- **npm** ≥ 10

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/darrina/tic-tac-toe-mcts.git
cd tic-tac-toe-mcts

# 2. Install dependencies
npm install
```

### Development

```bash
npm run dev
```

This starts the Express server (with Vite middleware for HMR) on **port 5000**.  
Open [http://localhost:5000](http://localhost:5000) in your browser.

> The `PORT` environment variable overrides the default port if needed.

### Production build

```bash
npm run build   # compiles client + server into dist/
npm start       # serves the production build
```

### Database (optional)

The app ships with an in-memory storage layer by default, so no database is required to run locally. If you want to use PostgreSQL:

1. Set the `DATABASE_URL` environment variable.
2. Run `npm run db:push` to sync the Drizzle schema.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with HMR on port 5000 |
| `npm run build` | Production build (client + server) |
| `npm start` | Serve production build |
| `npm run check` | TypeScript type-check (no emit) |
| `npm run db:push` | Push Drizzle schema to the database |
| `npm test` | Run all Vitest tests once |
| `npm run test:coverage` | Run tests with V8 coverage report |

---

## Running Tests

```bash
npm test
```

Tests live in `client/src/test/` and cover:

| File | What is tested |
|------|---------------|
| `mcts.test.ts` | `checkWinner`, `getWinningLine`, `getBestMoveMCTS` |
| `Game.test.tsx` | Human move handling, AI move triggering, reset, pause/resume |
| `App.test.tsx` | Routing integration |
| `use-toast.test.ts` | Toast hook state |
| `use-mobile.test.tsx` | Responsive hook |
| `utils.test.ts` | `cn` class-name utility |
| `queryClient.test.ts` | React Query client config |
| `not-found.test.tsx` | 404 page rendering |

Coverage thresholds are enforced at **90%** for lines, functions, branches, and statements.

---

## Architecture

```
Browser
  │  HTTP / WebSocket
  ▼
Express server (server/index.ts)
  │  /api/* routes
  ├─► Route handlers (server/routes.ts)
  │     └─► Storage layer (server/storage.ts)
  │           ├─ MemStorage (in-memory, default)
  │           └─ DatabaseStorage (PostgreSQL via Drizzle)
  │
  └─► Static / Vite middleware
        └─► React SPA (client/)
              └─► Game.tsx ──► mcts.ts (runs entirely in the browser)
```

The MCTS algorithm runs **entirely client-side** — no server round-trip is needed for AI moves. This keeps latency low and the app functional offline.

---

## Contributing

Contributions are welcome! Please read [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for the full coding standards, commit conventions, and documentation guidelines before opening a pull request.

### Quick guide

1. Fork the repository and create a feature branch from `main`.
2. Make your changes following the project's coding standards.
3. Add or update tests to maintain ≥ 90% coverage.
4. Run `npm test` and `npm run check` — both must pass.
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `feat(scope): description`.
6. Open a pull request with a clear description and, for UI changes, screenshots.

---

## License

This project is licensed under the **MIT License**. See [`package.json`](package.json) for details.
