import { User } from '../../client';
import { DuelGame } from './duels.types';
import * as crypto from 'crypto';

export const duelsCheckGetGameDataData = (data: any) => {
    if (!data || !data.gameId || typeof data.gameId !== 'string') {
        throw new Error('Your entered game id is invalid.');
    }
};

export const duelsCheckGetGameDataGame = (duelsGame: DuelGame | null) => {
    if (!duelsGame) {
        throw new Error('Your entered game id is not available.');
    }
};

export const duelsCheckSendCreateData = (data: any) => {
    if (!data || isNaN(data.amount) || data.amount <= 0 || isNaN(data.playerCount) || data.playerCount <= 1 || data.playerCount > 10) {
        throw new Error('Invalid input data.');
    }
    if (data.amount < (process.env.DUELS_MIN_AMOUNT || 1) * 1000) {
        throw new Error(`You can only bet a min amount of R$${parseFloat(process.env.DUELS_MIN_AMOUNT || '1').toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} per game.`);
    }
    if (data.amount > (process.env.DUELS_MAX_AMOUNT || 10000) * 1000) {
        throw new Error(`You can only bet a max amount of R$${parseFloat(process.env.DUELS_MAX_AMOUNT || '10000').toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} per game.`);
    }
};

export const duelsCheckSendCreateUser = (data: any, user: User, userGames: DuelGame[]) => {
    if (user.balance < data.amount) {
        throw new Error('You don’t have enough balance for this action.');
    }
    if (userGames.length >= 6) {
        throw new Error('You are not allowed to have more then 6 open duels games.');
    }
};

export const duelsCheckSendBotData = (data: any) => {
    if (!data || !data.gameId || typeof data.gameId !== 'string') {
        throw new Error('Your entered game id is invalid.');
    }
};

export const duelsCheckSendBotGame = (user: User, duelsGame: DuelGame | undefined, duelsBlockGame: string[], duelsBlockJoin: string[]) => {
    if (!duelsGame || duelsGame.state !== 'created' || duelsBlockGame.includes(duelsGame.id.toString()) || duelsGame.playerCount <= duelsGame.bets.length + duelsBlockJoin.filter(id => id === duelsGame.id).length) {
        throw new Error('Your requested game is not available or completed.');
    }
    if (user.id !== duelsGame.bets[0].userId) {
        throw new Error('You aren`t allowed to call bots for this game.');
    }
};

export const duelsCheckSendJoinData = (data: any) => {
    if (!data || !data.gameId || typeof data.gameId !== 'string') {
        throw new Error('Your entered game id is invalid.');
    }
};

export const duelsCheckSendJoinGame = (user: User, duelsGame: DuelGame | undefined, duelsBlockGame: string[], duelsBlockJoin: string[]) => {
    if (!duelsGame || duelsGame.state !== 'created' || duelsBlockGame.includes(duelsGame.id.toString()) || duelsGame.playerCount <= duelsGame.bets.length + duelsBlockJoin.filter(id => id === duelsGame.id).length) {
        throw new Error('Your requested game is not available or completed.');
    }
    if (duelsGame.bets.some(bet => bet.userId === user.id)) {
        throw new Error('You are not allowed to join more then one time per duels game.');
    }
};

export const duelsCheckSendJoinUser = (user: User, duelsGame: DuelGame) => {
    if (user.balance < duelsGame.amount) {
        throw new Error('You don’t have enough balance for this action.');
    }
};

export const duelsCheckSendCancelData = (data: any) => {
    if (!data || !data.gameId || typeof data.gameId !== 'string') {
        throw new Error('Your entered game id is invalid.');
    }
};

export const duelsCheckSendCancelGame = (user: User, duelsGame: DuelGame | undefined, duelsBlockGame: string[], duelsBlockJoin: string[]) => {
    if (!duelsGame || duelsGame.state !== 'created' || duelsBlockGame.includes(duelsGame.id.toString()) || duelsGame.playerCount <= duelsGame.bets.length + duelsBlockJoin.filter(id => id === duelsGame.id).length) {
        throw new Error('Your requested game is not available or completed.');
    }
    if (user.id !== duelsGame.bets[0].userId) {
        throw new Error('You aren`t allowed to cancel this game.');
    }
};

export const duelsGenerateGameFairData = () => {
    const seedServer = crypto.randomBytes(24).toString('hex');
    const hash = crypto.createHash('sha256').update(seedServer).digest('hex');
    return { seedServer, hash };
}

export const duelsGetGameIndex = (duelsGames: DuelGame[], gameId: string) => {
    return duelsGames.findIndex(game => game.id === gameId);
};

export const duelsSanitizeGame = (game: DuelGame) => {
    const sanitizedGame = { ...game };
    if (sanitizedGame.state !== 'completed') {
        sanitizedGame.fair = { hash: (sanitizedGame.fair as any).hash };
    }
    sanitizedGame.bets = sanitizedGame.bets.map(bet => {
        const { user, ...rest } = bet;
        return {
            ...rest,
            user: user ? {
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                rank: user.rank,
                anonymous: user.anonymous
            } : null
        };
    });
    return sanitizedGame;
}

export const duelsSanitizeGames = (games: DuelGame[]) => {
    return games.map(game => duelsSanitizeGame(game));
};
