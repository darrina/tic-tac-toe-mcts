import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

/** A non-null tic-tac-toe marker. */
export const ticTacToeMarkerSchema = z.enum(['X', 'O']);

/** A single tic-tac-toe board cell value. */
export const ticTacToeCellSchema = z.union([ticTacToeMarkerSchema, z.null()]);

/** A 9-cell tic-tac-toe board represented as a flat array. */
export const ticTacToeBoardSchema = z.array(ticTacToeCellSchema).length(9);

/** Request payload for computing the AI's next move with MCTS. */
export const nextMoveRequestSchema = z.object({
  board: ticTacToeBoardSchema,
  aiPlayer: ticTacToeMarkerSchema,
  iterations: z.number().int().min(1).max(20000).optional(),
});

/** Response payload containing the chosen move index. */
export const nextMoveResponseSchema = z.object({
  move: z.number().int().min(-1).max(8),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type NextMoveRequest = z.infer<typeof nextMoveRequestSchema>;
export type NextMoveResponse = z.infer<typeof nextMoveResponseSchema>;
