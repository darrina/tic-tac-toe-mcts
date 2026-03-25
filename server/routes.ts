import type { Express } from 'express';
import type { Server } from 'http';
import {
  nextMoveRequestSchema,
  nextMoveResponseSchema,
  type NextMoveResponse,
} from '@shared/schema';
import { getBestMoveMCTS } from './lib/mcts';
import { storage } from './storage';

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post('/api/mcts/next-move', (req, res) => {
    const parsedRequest = nextMoveRequestSchema.safeParse(req.body);
    if (!parsedRequest.success) {
      return res.status(400).json({
        message: 'Invalid request body',
        errors: parsedRequest.error.flatten(),
      });
    }

    const { board, aiPlayer, iterations } = parsedRequest.data;
    const move = getBestMoveMCTS(board, aiPlayer, iterations ?? 3000);
    const response: NextMoveResponse = { move };

    return res.json(nextMoveResponseSchema.parse(response));
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  return httpServer;
}
