import { z } from 'zod';
import { messageSchema } from '../../../../../lib/bun-ws-router'; // Adjust this import path to your project structure

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
 * Schema for a single bet.
 */
const BetSchema = z.object({
    amount: z.number().nullable(),
    payout: z.number().nullable(),
    multiplier: z.number().nullable(),
    user: FormattedUserSchema,
    updatedAt: z.date(),
    createdAt: z.date(),
    method: z.string(),
});

/**
 * Schema for the collection of bets.
 */
const BetsSchema = z.object({
    all: z.array(BetSchema),
    whale: z.array(BetSchema),
    lucky: z.array(BetSchema),
    my: z.array(BetSchema),
});

// Message sent from client to request the latest bets data.
export const GetBetsDataMessage = messageSchema('GET_BETS_DATA');

// Message sent from server to client with the bets data.
export const BetsDataMessage = messageSchema('BETS_DATA', BetsSchema);

// Message broadcast from server when a new bet is made.
export const NewBetMessage = messageSchema('NEW_BET', BetSchema);
