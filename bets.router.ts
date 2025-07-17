import { WebSocketRouter,  } from 'bun-ws-router'; // Adjust path
import { getBetsDataHandler } from './bets.controller';
import { GetBetsDataMessage } from './bets.schema';

import type { AppSocketData } from './bets.types';
import { User } from '../client';
export type Env = {
//   Variables: {
    user: User;
    // session: SessionData; // & { membership: MembershipSummary | null };
    token: string;
    userId: string;
    currentGameId: string;
//   };
//   Bindings: Bindings;
};

// Create a new router instance with the Zod validator
// export const betsRouter = new WebSocketRouter<Env>(
//     new ZodValidatorAdapter()
// );
export const betsRouter = new WebSocketRouter<Env>();
/**
 * When a client connects, log it and subscribe them to the 'bets' topic.
 * This allows them to receive real-time updates about new bets.
 */
betsRouter.onOpen((ctx) => {
    console.log(`Client connected: ${ctx.ws.data.clientId}`);
    ctx.ws.subscribe('bets');
});

/**
 * When a client disconnects, log it and unsubscribe them from the 'bets' topic.
 */
betsRouter.onClose((ctx) => {
    console.log(`Client disconnected: ${ctx.ws.data.clientId}`);
    ctx.ws.unsubscribe('bets');
});

/**
 * Register a handler for the 'GET_BETS_DATA' message type.
 * When a client sends this message, the getBetsDataHandler will be executed.
 */
betsRouter.onMessage(GetBetsDataMessage, (ctx) => getBetsDataHandler(ctx as any));
