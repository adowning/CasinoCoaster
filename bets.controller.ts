import { PrismaClient } from '../client';
import type { Env, Server } from 'bun';
import type { MessageContext } from 'bun-ws-router'; // Adjust path
import { publish } from 'bun-ws-router'; // Adjust path
import { BetsDataMessage, NewBetMessage } from './bets.schema';
import type { AppSocketData, Bet, Bets } from './bets.types';
import { formatUser } from './bets.utils';

const prisma = new PrismaClient();

// In-memory cache for bets to avoid frequent database calls for all users.
let generalBets: Omit<Bets, 'my'> = { all: [], whale: [], lucky: [] };

/**
 * Fetches bets for a specific user.
 * @param userId - The ID of the user to fetch bets for.
 * @returns An array of the user's most recent bets.
 */
async function fetchUserBets(userId: string): Promise<Bet[]> {
    const [
        crashBets,
        rollBets,
        blackjackBets,
        duelsBets,
        minesGames,
        towersGames,
        unboxGames,
        battlesBets,
    ] = await Promise.all([
        prisma.crashBet.findMany({ where: { userId, payout: { not: null } }, orderBy: { updatedAt: 'desc' }, take: 15, include: { user: true } }),
        prisma.rollBet.findMany({ where: { userId, payout: { not: null } }, orderBy: { updatedAt: 'desc' }, take: 15, include: { user: true } }),
        prisma.blackjackBet.findMany({ where: { userId, payout: { not: null } }, orderBy: { updatedAt: 'desc' }, take: 15, include: { user: true } }),
        prisma.duelsBet.findMany({ where: { userId, payout: { not: null }, bot: false }, orderBy: { updatedAt: 'desc' }, take: 15, include: { user: true } }),
        prisma.minesGame.findMany({ where: { userId, payout: { not: null } }, orderBy: { updatedAt: 'desc' }, take: 15, include: { user: true } }),
        prisma.towersGame.findMany({ where: { userId, payout: { not: null } }, orderBy: { updatedAt: 'desc' }, take: 15, include: { user: true } }),
        prisma.unboxGame.findMany({ where: { userId, payout: { not: null } }, orderBy: { updatedAt: 'desc' }, take: 15, include: { user: true } }),
        prisma.battlesBet.findMany({ where: { userId, payout: { not: null }, bot: false }, orderBy: { updatedAt: 'desc' }, take: 15, include: { user: true } }),
    ]);

    const allUserBets: Bet[] = [
        ...crashBets.map((bet): Bet => ({ ...bet, user: formatUser(bet.user), method: 'crash' })),
        ...rollBets.map((bet): Bet => ({ ...bet, user: formatUser(bet.user), method: 'roll' })),
        ...blackjackBets.map((bet): Bet => ({ ...bet, amount: bet.amount.main, user: formatUser(bet.user), method: 'blackjack' })),
        ...duelsBets.map((bet): Bet => ({ ...bet, user: formatUser(bet.user), method: 'duels' })),
        ...minesGames.map((bet): Bet => ({ ...bet, user: formatUser(bet.user), method: 'mines' })),
        ...towersGames.map((bet): Bet => ({ ...bet, user: formatUser(bet.user), method: 'towers' })),
        ...unboxGames.map((bet): Bet => ({ ...bet, user: formatUser(bet.user), method: 'unbox' })),
        ...battlesBets.map((bet): Bet => ({ ...bet, user: formatUser(bet.user), method: 'battles' })),
    ];

    return allUserBets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 15);
}

/**
 * Handles the 'GET_BETS_DATA' message from a client.
 * Fetches user-specific bets if a user is authenticated and sends back the full bets list.
 * @param ctx - The message context from the WebSocket router.
 */
export const getBetsDataHandler = async (ctx: MessageContext<any, AppSocketData>) => {
    const { ws, send } = ctx;
    const user = ws.data.user;

    let myBets: Bet[] = [];

    if (user) {
        myBets = await fetchUserBets(user.id);

    const betsPayload: Bets = {
        ...generalBets,
        my: myBets,
    };

    send(BetsDataMessage, betsPayload);
    }
}
/**
 * Adds a new bet to the cached lists and publishes it to all clients.
 * @param server - The Bun server instance.
 * @param bet - The new bet to add and publish.
 */ 
export const publishNewBet = (server: Server, bet: Bet) => {
    try {
        // Add to "all" list
        generalBets.all.unshift(bet);
        if (generalBets.all.length > 15) {
            generalBets.all.pop();
        }

        // Add to "whale" list if applicable
        if (bet.payout && bet.payout >= 100000) { // Assuming payout is in cents
            generalBets.whale.unshift(bet);
            if (generalBets.whale.length > 15) {
                generalBets.whale.pop();
            }
        }

        // Add to "lucky" list if applicable
        if (bet.payout && bet.payout >= 1000 && bet.multiplier && bet.multiplier >= 5) { // Payout >= $10, multiplier >= 5x
            generalBets.lucky.unshift(bet);
            if (generalBets.lucky.length > 15) {
                generalBets.lucky.pop();
            }
        }
        
        // Publish the new bet to the 'bets' topic
        publish(server as any, 'bets', NewBetMessage, bet);

    } catch (err) {
        console.error("Error in publishNewBet:", err);
    }
};
// ValidatorAdapter
/**
 * Initializes the in-memory bet caches on server startup.
 */
export const initBets = async () => {
    try {
    console.log("Initializing bets cache...");

    const take = 15;
    const orderBy = { updatedAt: "desc" as const };
    const includeUser = { user: true };

    const betModels = {
      crash: prisma.crashBet,
      roll: prisma.rollBet,
      blackjack: prisma.blackjackBet,
      duels: prisma.duelsBet,
      mines: prisma.minesGame,
      towers: prisma.towersGame,
      unbox: prisma.unboxGame,
      battles: prisma.battlesBet,
    };

    const fetchDataForCategory = async (condition: object) => {
      const queries = Object.entries(betModels).map(([method, model]) => {
        let where: any = { ...condition };
        if (method === "duels" || method === "battles") {
          where.bot = false;
        }
        // The 'any' cast is needed because the generic Prisma.ModelDelegate doesn't have a 'findMany' with these specific args.
        return (model as any).findMany({ where, orderBy, take, include: includeUser });
      });
      return Promise.all(queries);
    };

    const [allBetsResult, whaleBetsResult, luckyBetsResult] = await Promise.all([
      fetchDataForCategory({ payout: { not: null } }),
      fetchDataForCategory({ payout: { gte: 100000 } }), // Whale bets: Payout >= $1000
      fetchDataForCategory({ payout: { gte: 1000 }, multiplier: { gte: 5 } }), // Lucky bets: Payout >= $10 and Multiplier >= 5x
    ]);

    const mapAndSortResults = (results: any[][]): Bet[] => {
      const methods = Object.keys(betModels);
      let combined: Bet[] = [];
      results.forEach((result, i) => {
        const method = methods[i];
        result.forEach((bet: any) => {
          let amount = bet.amount;
          // Blackjack bets have a structured amount, we only need the main bet value.
          if (method === "blackjack" && typeof bet.amount === "object" && bet.amount !== null) {
            amount = (bet.amount as { main: number }).main;
          }
          combined.push({ ...bet, amount, user: formatUser(bet.user), method });
        });
      });
      return combined.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, take);
    };

    generalBets.all = mapAndSortResults(allBetsResult);
    generalBets.whale = mapAndSortResults(whaleBetsResult);
    generalBets.lucky = mapAndSortResults(luckyBetsResult);

    console.log(`Bets cache initialized: ${generalBets.all.length} all, ${generalBets.whale.length} whale, ${generalBets.lucky.length} lucky.`);
  } catch (err) {
    console.error("Failed to initialize bets cache:", err);
  }
};