# GitHub Copilot Instructions

These instructions define the code quality, commit, and documentation standards for this project.
All contributors (human and AI) must follow these guidelines.

---

## Project Overview

This is a Tic-Tac-Toe game powered by a Monte Carlo Tree Search (MCTS) AI, built with:

- **Frontend**: React 19 + TypeScript, Tailwind CSS v4, Framer Motion, Radix UI / shadcn components
- **Backend**: Express 5 + TypeScript, Drizzle ORM
- **Testing**: Vitest + React Testing Library
- **Tooling**: Vite, `tsx`, `tsc`, `drizzle-kit`

Key source locations:

| Path | Purpose |
|------|---------|
| `client/src/lib/mcts.ts` | MCTS algorithm and board logic |
| `client/src/pages/Game.tsx` | Main game UI |
| `client/src/components/ui/` | Reusable shadcn/Radix UI components |
| `server/` | Express API and storage layer |
| `shared/schema.ts` | Drizzle ORM schema and Zod types shared across client/server |

---

## Code Quality

### TypeScript

- Always use **strict TypeScript** — `strict: true` is enforced in `tsconfig.json`.
- Prefer explicit return types on all exported functions and React component props.
- Use `type` for object shapes and union types; use `interface` only when extension via `extends` is needed.
- Never use `any`; use `unknown` and narrow with type guards instead.
- Prefer `const` over `let`; never use `var`.
- Use optional chaining (`?.`) and nullish coalescing (`??`) over manual null checks.

```typescript
// ✅ Good
export function checkWinner(board: Board): Player | 'Draw' | null { ... }

// ❌ Bad
export function checkWinner(board: any) { ... }
```

### React & Components

- Write all React components as **named function declarations** or arrow function constants — never anonymous defaults.
- Use React hooks at the top level only; never inside conditionals or loops.
- Prefer `useCallback` and `useMemo` for functions and values passed as props or used in effect dependencies.
- Always clean up side effects (timers, subscriptions) in the `useEffect` return function.
- Add `data-testid` attributes to interactive elements to support testing without coupling to CSS classes.

```tsx
// ✅ Good
export default function Game(): JSX.Element {
  const handleMove = useCallback((index: number) => { ... }, [deps]);
  ...
}

// ❌ Bad
export default () => { ... }
```

### Styling

- Use **Tailwind CSS utility classes** exclusively; avoid inline `style` props for layout/colour.
- Use CSS custom properties (e.g., `hsl(var(--color-primary))`) for theme colours instead of hard-coded values.
- Compose class names with `clsx` / `cn` (from `@/lib/utils`); do not concatenate strings manually.
- Responsive-first: use Tailwind breakpoint prefixes (`sm:`, `md:`, `lg:`) instead of media query blocks in CSS files.

### General Style

- Keep functions small and focused — one responsibility per function.
- Maximum line length: **100 characters**.
- Use **2-space indentation** and single quotes for TypeScript/TSX string literals.
- No trailing whitespace; files must end with a single newline.
- Remove all `console.log` / `console.debug` calls before merging; use the `log()` helper in `server/index.ts` for server-side logging.

---

## MCTS Algorithm Guidelines

The `client/src/lib/mcts.ts` module is the core of the project.

- The four MCTS phases — **Selection**, **Expansion**, **Simulation**, **Backpropagation** — must remain clearly separated and labelled with inline comments.
- All wins/losses are stored from the **AI player's perspective** (1 = AI win, 0.5 = draw, 0 = AI loss).
- When modifying UCB1, document the formula and its constants (exploration constant `c = √2 ≈ 1.414`).
- `getBestMoveMCTS` must remain a **pure function** with respect to board state — no mutations to the input `board` array.
- Any new heuristic or optimisation must include a JSDoc comment explaining the rationale.

---

## Testing

- All new logic must be covered by **Vitest unit tests** in `client/src/test/`.
- Coverage thresholds (lines, functions, branches, statements) are all set to **90%** — do not lower them.
- Use **React Testing Library** for component tests; query by role or `data-testid`, never by CSS class.
- Tests must be deterministic — mock `Math.random()` and timers (`vi.useFakeTimers()`) where needed.
- Each test file must import only from the module under test and its declared dependencies.
- Test names must use the pattern: `"<unit> <behaviour> <expected outcome>"`.

```typescript
// ✅ Good
it('checkWinner returns winning player when a row is complete', () => { ... });

// ❌ Bad
it('works correctly', () => { ... });
```

Run tests locally before pushing:

```bash
npm test             # run all tests once
npm run test:coverage  # run with coverage report
```

---

## Commits

Follow the **Conventional Commits** specification: `<type>(<scope>): <short description>`.

### Allowed Types

| Type | When to use |
|------|------------|
| `feat` | A new feature visible to the user |
| `fix` | A bug fix |
| `perf` | A performance improvement |
| `refactor` | Code restructure with no behaviour change |
| `test` | Adding or updating tests only |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, semicolons — no logic change |
| `chore` | Build scripts, config, dependency updates |
| `ci` | Changes to CI/CD configuration |
| `revert` | Reverting a previous commit |

### Rules

- Subject line: **imperative mood**, no trailing period, max 72 characters.
- Body (optional): explain *why*, not *what*; wrap at 72 characters.
- Footer (optional): reference issues with `Closes #<n>` or `Fixes #<n>`.
- **Never** commit directly to `main`; always open a pull request.
- One logical change per commit — do not bundle unrelated changes.

```
# ✅ Good
feat(mcts): add alpha-beta pruning for opening moves

Reduces average decision time by ~30% on the first three moves
without changing the final move quality.

Closes #42

# ❌ Bad
fixed stuff and updated readme
```

---

## Documentation

### JSDoc

- Every **exported** function, class, type alias, and constant must have a JSDoc block.
- Use `@param`, `@returns`, and `@throws` tags where applicable.
- Describe *behaviour* and *edge cases*, not implementation details.

```typescript
/**
 * Runs Monte Carlo Tree Search to find the best move for the given player.
 *
 * @param board - Current 9-element board state; `null` = empty cell.
 * @param aiPlayer - The token the AI controls (`'X'` or `'O'`).
 * @param iterations - Number of MCTS simulations (higher = stronger, slower).
 * @returns The 0-based board index of the best move, or `-1` if no moves exist.
 */
export function getBestMoveMCTS(board: Board, aiPlayer: 'X' | 'O', iterations = 3000): number
```

### Inline Comments

- Explain **why**, not **what** — the code already shows what.
- Use `// TODO: <description>` for known gaps; include a tracking issue number when possible.
- Remove commented-out code before merging.

### README

- Keep `README.md` up to date with any change to setup steps, environment variables, or scripts.
- New features must be mentioned in the relevant section of `README.md`.

---

## Pull Requests

- Title must follow Conventional Commits format (same as commit subject line).
- Description must include:
  1. **What** changed and **why**.
  2. **How to test** the change locally.
  3. Screenshots or screen recordings for any UI change.
- Link all related issues.
- All CI checks must pass before requesting review.
- Resolve all review comments before merging; do not force-push after review has started.

---

## Security

- Never commit secrets, API keys, or credentials. Use environment variables.
- Sanitise all user inputs on both client and server before use.
- Keep dependencies up to date; run `npm audit` before shipping a new dependency.
- Do not disable TypeScript strict checks or ESLint rules with inline suppressions without a documented reason.
