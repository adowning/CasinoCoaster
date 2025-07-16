import { PrismaClient, User } from '../../client';
import type { Server } from 'bun';
import type { MessageContext } from 'bun-ws-router';
import { publish } from 'bun-ws-router';
import {
    CreateDuelMessage,
    JoinDuelMessage,
    CancelDuelMessage,
    CallBotMessage,
    DuelsDataMessage,
    DuelGameMessage
} from './duels.schema';
import type { AppSocketData, DuelGame, DuelBet } from './duels.types';
import {
    duelsCheckGetGameDataData,
    duelsCheckGetGameDataGame,
    duelsCheckSendCreateData,
    duelsCheckSendCreateUser,
    duelsCheckSendBotData,
    duelsCheckSendBotGame,
    duelsCheckSendJoinData,
    duelsCheckSendJoinGame,
    duelsCheckSendJoinUser,
    duelsCheckSendCancelData,
    duelsCheckSendCancelGame,
    duelsGenerateGameFairData,
    duelsGetGameIndex,
    duelsSanitizeGames,
    duelsSanitizeGame,
} from './duels.utils';
import { fairGetData } from '../utils/fair';
import { generalAddBetsList } from '../general/bets'; // This needs to be converted too
import { settingGet } from '../utils/setting'; // This needs to be converted too
import {
    generalUserGetLevel,
    generalUserGetRakeback,
    generalUserGetFormated
} from '../utils/general/user'; // This needs to be converted too


const prisma = new PrismaClient();

let duelsGames: DuelGame[] = [];
let duelsHistory: DuelGame[] = [];
let duelsBlockGame: string[] = [];
let duelsBlockJoin: string[] = [];
let duelsBlockCancel: string[] = [];

export const duelsGetData = () => {
    return { games: duelsSanitizeGames(duelsGames), history: duelsHistory };
};

export const duelsGetGameDataSocket = async (ctx: MessageContext<any, AppSocketData>, data: { gameId: string }) => {
    try {
        duelsCheckGetGameDataData(data);

        let duelsGame = duelsGames[duelsGetGameIndex(duelsGames, data.gameId)];

        if (!duelsGame) {
            duelsGame = await prisma.duelsGame.findUnique({
                where: { id: data.gameId },
                include: {
                    winner: { include: { user: true } },
                    bets: { include: { user: true } },
                },
            }) as DuelGame;
        }

        duelsCheckGetGameDataGame(duelsGame);

        ctx.send(DuelGameMessage, duelsSanitizeGame(duelsGame));
    } catch (err: any) {
        // Implement error handling
    }
};

export const duelsSendCreateSocket = async (ctx: MessageContext<any, AppSocketData>, data: { amount: number, playerCount: number }) => {
    try {
        const user = ctx.ws.data.user;
        if (!user) throw new Error("User not authenticated");

        duelsCheckSendCreateData(data);

        const userGames = duelsGames.filter(game => game.bets[0]?.userId === user.id);
        duelsCheckSendCreateUser(data, user, userGames);

        const amount = Math.floor(data.amount);
        const playerCount = Math.floor(data.playerCount);

        const fairData = duelsGenerateGameFairData();

        const duelsGame = await prisma.duelsGame.create({
            data: {
                amount,
                playerCount,
                fair: fairData,
                state: 'created',
                bets: {
                    create: {
                        amount,
                        userId: user.id,
                        bot: false,
                    }
                }
            },
            include: {
                bets: { include: { user: true } }
            }
        }) as DuelGame;

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                balance: { decrement: amount },
                stats: { update: { bet: { increment: amount } } }
            }
        });

        // This is a placeholder for the user update emit
        // io.of('/general').to(user.id).emit('user', { user: updatedUser });

        duelsGames.push(duelsGame);

        publish(ctx.server as any, 'duels', DuelGameMessage, duelsSanitizeGame(duelsGame));
    } catch (err: any) {
        // Implement error handling
    }
};

export const duelsSendBotSocket = async (ctx: MessageContext<any, AppSocketData>, data: { gameId: string }) => {
    try {
        const user = ctx.ws.data.user;
        if (!user) throw new Error("User not authenticated");

        duelsCheckSendBotData(data);

        const gameIndex = duelsGetGameIndex(duelsGames, data.gameId);
        const duelsGame = duelsGames[gameIndex];

        duelsCheckSendBotGame(user, duelsGame, duelsBlockGame, duelsBlockJoin);

        duelsBlockGame.push(data.gameId);

        const amountGameBet = duelsGame.amount;
        const botsToCreate = duelsGame.playerCount - duelsGame.bets.length;

        const newBets = await prisma.duelsBet.createMany({
            data: Array(botsToCreate).fill(null).map(() => ({
                amount: amountGameBet,
                gameId: duelsGame.id,
                bot: true,
                userId: '' // Assign a bot user or handle this case
            }))
        });

        const updatedGame = await prisma.duelsGame.findUnique({ where: { id: data.gameId }, include: { bets: { include: { user: true } } } }) as DuelGame;
        duelsGames[gameIndex] = updatedGame;

        publish(ctx.server as any, 'duels', DuelGameMessage, duelsSanitizeGame(updatedGame));

        if (updatedGame.playerCount <= updatedGame.bets.length && updatedGame.state === 'created') {
            duelsGameCountdown(ctx.server as any, updatedGame);
        }

        duelsBlockGame.splice(duelsBlockGame.indexOf(data.gameId), 1);
    } catch (err: any) {
        // Implement error handling
        duelsBlockGame.splice(duelsBlockGame.indexOf(data.gameId), 1);
    }
};

export const duelsSendJoinSocket = async (ctx: MessageContext<any, AppSocketData>, data: { gameId: string }) => {
    try {
        const user = ctx.ws.data.user;
        if (!user) throw new Error("User not authenticated");

        duelsCheckSendJoinData(data);

        const gameIndex = duelsGetGameIndex(duelsGames, data.gameId);
        const duelsGame = duelsGames[gameIndex];

        duelsCheckSendJoinGame(user, duelsGame, duelsBlockGame, duelsBlockJoin);
        duelsCheckSendJoinUser(user, duelsGame);

        duelsBlockJoin.push(duelsGame.id);

        const amountGameBet = duelsGame.amount;

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                balance: { decrement: amountGameBet },
                stats: { update: { bet: { increment: amountGameBet } } }
            }
        });

        const newBet = await prisma.duelsBet.create({
            data: {
                amount: amountGameBet,
                gameId: duelsGame.id,
                userId: user.id,
                bot: false
            },
            include: { user: true }
        });

        const updatedGame = await prisma.duelsGame.findUnique({ where: { id: data.gameId }, include: { bets: { include: { user: true } } } }) as DuelGame;
        duelsGames[gameIndex] = updatedGame;

        // This is a placeholder for the user update emit
        // io.of('/general').to(user.id).emit('user', { user: updatedUser });

        publish(ctx.server as any, 'duels', DuelGameMessage, duelsSanitizeGame(updatedGame));

        if (updatedGame.playerCount <= updatedGame.bets.length && updatedGame.state === 'created') {
            duelsGameCountdown(ctx.server as any, updatedGame);
        }

        duelsBlockJoin.splice(duelsBlockJoin.indexOf(duelsGame.id), 1);

    } catch (err: any) {
        // Implement error handling
        const gameIndex = duelsGetGameIndex(duelsGames, data.gameId);
        const duelsGame = duelsGames[gameIndex];
        if (duelsGame) {
            duelsBlockJoin.splice(duelsBlockJoin.indexOf(duelsGame.id), 1);
        }
    }
}

export const duelsSendCancelSocket = async (ctx: MessageContext<any, AppSocketData>, data: { gameId: string }) => {
    try {
        const user = ctx.ws.data.user;
        if (!user) throw new Error("User not authenticated");

        duelsCheckSendCancelData(data);

        const gameIndex = duelsGetGameIndex(duelsGames, data.gameId);
        const duelsGame = duelsGames[gameIndex];

        duelsCheckSendCancelGame(user, duelsGame, duelsBlockGame, duelsBlockJoin);

        duelsBlockGame.push(data.gameId);

        // Logic to cancel the game, refund users, and update the game state to 'canceled'
        // This will involve database updates and socket emits

        duelsBlockGame.splice(duelsBlockGame.indexOf(data.gameId), 1);
    } catch (err: any) {
        // Implement error handling
        duelsBlockGame.splice(duelsBlockGame.indexOf(data.gameId), 1);
    }
};

const duelsGameCountdown = (server: Server, duelsGame: DuelGame) => {
    duelsGame.state = 'countdown';
    duelsGame.updatedAt = new Date();

    const gameIndex = duelsGetGameIndex(duelsGames, duelsGame.id);
    duelsGames[gameIndex] = duelsGame;

    publish(server as any, 'duels', DuelGameMessage, duelsSanitizeGame(duelsGame));

    setTimeout(() => { duelsGameValidate(server, duelsGame); }, 4000)
}

const duelsGameValidate = async (server: Server, duelsGame: DuelGame) => {
    try {
        duelsGame.state = 'pending';
        const gameIndex = duelsGetGameIndex(duelsGames, duelsGame.id);
        duelsGames[gameIndex] = duelsGame;

        publish(server as any, 'duels', DuelGameMessage, duelsSanitizeGame(duelsGame));

        const dataFair = await fairGetData();
        const fairData = duelsGame.fair as any;
        fairData.seedPublic = dataFair.data.head_block_id;
        fairData.blockId = dataFair.data.head_block_num;

        duelsGame.fair = fairData;
        duelsGames[gameIndex] = duelsGame;

        setTimeout(() => { duelsGameRoll(server, duelsGame); }, 1000);
    } catch(err) {
        console.error(err);
        setTimeout(() => { duelsGameValidate(server, duelsGame); }, 1000 * 15);
    }
}

const duelsGameRoll = async(server: Server, duelsGame: DuelGame) => {
    try {
        const fairData = duelsGame.fair as any;
        for(const [index, bet] of duelsGame.bets.entries()) {
            const combined = crypto.createHash('sha256').update(`${duelsGame.id}-${fairData.seedServer}-${fairData.seedPublic}-${index}`).digest('hex');
            const roll = parseInt(combined.substr(0, 8), 16) % 10000;
            bet.roll = roll;
        }

        let winnerBet = duelsGame.bets.reduce((winner, bet) => (winner.roll || 0) > (bet.roll || 0) ? winner : bet);
        winnerBet.payout = Math.floor(duelsGame.amount * duelsGame.playerCount * 0.95);

        duelsGame.state = 'rolling';
        duelsGame.winner = winnerBet;
        duelsGame.bets[duelsGame.bets.findIndex(b => b.id === winnerBet.id)] = winnerBet;
        duelsGame.updatedAt = new Date();

        const gameIndex = duelsGetGameIndex(duelsGames, duelsGame.id);
        duelsGames[gameIndex] = duelsGame;

        publish(server as any, 'duels', DuelGameMessage, duelsSanitizeGame(duelsGame));

        setTimeout(() => { duelsGameComplete(server, duelsGame); }, duelsGame.bets.length * 5000);
    } catch(err) {
        console.error(err);
    }
}

const duelsGameComplete = async(server: Server, duelsGame: DuelGame) => {
    try {
        duelsGame.state = 'completed';

        // ... (logic to update users, bets, rain, etc. using Prisma)

        duelsHistory.unshift(duelsSanitizeGame(duelsGame));
        if(duelsHistory.length > 25) { duelsHistory.pop(); }

        const gameIndex = duelsGetGameIndex(duelsGames, duelsGame.id);
        duelsGames.splice(gameIndex, 1);

        publish(server as any, 'duels', DuelGameMessage, duelsSanitizeGame(duelsGame));

        // ... (logic to emit user updates and new bets)
    } catch(err) {
        console.error(err);
    }
}

export const duelsInit = async(server: Server) => {
    try {
        const [uncompletedGames, completedGames] = await Promise.all([
            prisma.duelsGame.findMany({
                where: { state: { in: ['created', 'pending', 'rolling'] } },
                include: { bets: { include: { user: true } } },
            }),
            prisma.duelsGame.findMany({
                where: { state: 'completed' },
                orderBy: { createdAt: 'desc' },
                take: 25,
                include: { winner: { include: { user: true } }, bets: { include: { user: true } } },
            })
        ]);

        duelsHistory = completedGames as DuelGame[];

        for (const game of uncompletedGames) {
            if (game.playerCount === game.bets.length) {
                await prisma.duelsGame.update({
                    where: { id: game.id },
                    data: { state: 'canceled' }
                });
                // refund users
            } else {
                duelsGames.push(game as DuelGame);
            }
        }

    } catch(err) {
        console.error(err);
    }
}
