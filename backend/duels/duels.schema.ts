import { z } from 'zod';
import { messageSchema } from '../../../../lib/bun-ws-router'; // Adjust this import path to your project structure

/**
 * Schema for a single formatted user.
 */
const FormattedUserSchema = z.object({
    id: z.string(),
    username: z.string().nullable(),
    avatar: z.string().nullable(),
    rank: z.string(),
    anonymous: z.boolean(),
}).nullable();

/**
 * Schema for a single duel bet.
 */
const DuelBetSchema = z.object({
    id: z.string(),
    amount: z.number(),
    payout: z.number().nullable(),
    multiplier: z.number().nullable(),
    roll: z.number().nullable(),
    gameId: z.string(),
    userId: z.string(),
    bot: z.boolean(),
    updatedAt: z.date(),
    createdAt: z.date(),
    user: FormattedUserSchema,
});

/**
 * Schema for a single duel game.
 */
const DuelGameSchema = z.object({
    id: z.string(),
    amount: z.number(),
    playerCount: z.number(),
    winnerId: z.string().nullable(),
    fair: z.any(), // You might want to define a more specific schema for this
    state: z.string(),
    updatedAt: z.date(),
    createdAt: z.date(),
    bets: z.array(DuelBetSchema),
    winner: DuelBetSchema.nullable(),
});

// Message sent from client to request the latest duels data.
export const GetDuelsDataMessage = messageSchema('GET_DUELS_DATA');

// Message sent from server to client with the duels data.
export const DuelsDataMessage = messageSchema('DUELS_DATA', z.object({
    games: z.array(DuelGameSchema),
    history: z.array(DuelGameSchema),
}));

// Message sent from client to create a new duel game.
export const CreateDuelMessage = messageSchema('CREATE_DUEL', z.object({
    amount: z.number(),
    playerCount: z.number(),
}));

// Message sent from client to join a duel game.
export const JoinDuelMessage = messageSchema('JOIN_DUEL', z.object({
    gameId: z.string(),
}));

// Message sent from client to cancel a duel game.
export const CancelDuelMessage = messageSchema('CANCEL_DUEL', z.object({
    gameId: z.string(),
}));

// Message sent from client to call a bot for a duel game.
export const CallBotMessage = messageSchema('CALL_BOT', z.object({
    gameId: z.string(),
}));

// Message broadcast from server when a new game is created or updated.
export const DuelGameMessage = messageSchema('DUEL_GAME', DuelGameSchema);
