import { WebSocket, WebSocketServer } from 'bun-ws-router';
import { User } from '../../../database/models/User';
import { rateLimiter } from '../../../middleware/rateLimiter';
import {
    socketCheckUserData,
    socketCheckAntiSpam,
    socketRemoveAntiSpam,
} from '../../../utils/socket';
import { settingCheck } from '../../../utils/setting';
import {
    generalGetUserInfoSocket,
    generalGetUserBetsSocket,
    generalGetUserTransactionsSocket,
    generalGetUserSeedSocket,
    generalSendUserAnonymousSocket,
    generalSendUserDiscordSocket,
    generalSendUserSeedSocket,
    generalSendUserTipSocket,
} from '../../../controllers/general/user';

export default (ws: WebSocket, wss: WebSocketServer) => {
    ws.on('message', async (message: string) => {
        const { event, data, callback } = JSON.parse(message);

        if (event === 'getUserInfo') {
            if (callback === undefined || typeof callback !== 'function') {
                return;
            }
            try {
                const identifier = ws.remoteAddress;
                await rateLimiter.consume(identifier);
                try {
                    let user = null;
                    if (ws.data !== undefined && ws.data !== null) {
                        user = await User.findById(ws.data._id)
                            .select('username avatar rank agreed mute ban')
                            .lean();
                    }
                    socketCheckUserData(user, true);
                    settingCheck(user);
                    generalGetUserInfoSocket(wss, ws, user, data, callback);
                } catch (err) {
                    callback({
                        success: false,
                        error: { type: 'error', message: err.message },
                    });
                }
            } catch (err) {
                callback({
                    success: false,
                    error: {
                        type: 'error',
                        message:
                            err.message !== undefined
                                ? err.message
                                : 'You need to slow down, you have send to many request. Try again in a minute.',
                    },
                });
            }
        } else if (event === 'getUserBets') {
            if (callback === undefined || typeof callback !== 'function') {
                return;
            }
            try {
                const identifier = ws.remoteAddress;
                await rateLimiter.consume(identifier);
                try {
                    let user = null;
                    if (ws.data !== undefined && ws.data !== null) {
                        user = await User.findById(ws.data._id)
                            .select('username avatar rank agreed mute ban')
                            .lean();
                    }
                    socketCheckUserData(user, true);
                    settingCheck(user);
                    generalGetUserBetsSocket(wss, ws, user, data, callback);
                } catch (err) {
                    callback({
                        success: false,
                        error: { type: 'error', message: err.message },
                    });
                }
            } catch (err) {
                callback({
                    success: false,
                    error: {
                        type: 'error',
                        message:
                            err.message !== undefined
                                ? err.message
                                : 'You need to slow down, you have send to many request. Try again in a minute.',
                    },
                });
            }
        } else if (event === 'getUserTransactions') {
            if (callback === undefined || typeof callback !== 'function') {
                return;
            }
            try {
                const identifier = ws.remoteAddress;
                await rateLimiter.consume(identifier);
                try {
                    let user = null;
                    if (ws.data !== undefined && ws.data !== null) {
                        user = await User.findById(ws.data._id)
                            .select('username avatar rank agreed mute ban')
                            .lean();
                    }
                    socketCheckUserData(user, true);
                    settingCheck(user);
                    generalGetUserTransactionsSocket(
                        wss,
                        ws,
                        user,
                        data,
                        callback
                    );
                } catch (err) {
                    callback({
                        success: false,
                        error: { type: 'error', message: err.message },
                    });
                }
            } catch (err) {
                callback({
                    success: false,
                    error: {
                        type: 'error',
                        message:
                            err.message !== undefined
                                ? err.message
                                : 'You need to slow down, you have send to many request. Try again in a minute.',
                    },
                });
            }
        } else if (event === 'getUserSeed') {
            if (callback === undefined || typeof callback !== 'function') {
                return;
            }
            try {
                const identifier = ws.remoteAddress;
                await rateLimiter.consume(identifier);
                try {
                    let user = null;
                    if (ws.data !== undefined && ws.data !== null) {
                        user = await User.findById(ws.data._id)
                            .select('username avatar rank agreed mute ban')
                            .lean();
                    }
                    socketCheckUserData(user, true);
                    settingCheck(user);
                    generalGetUserSeedSocket(wss, ws, user, data, callback);
                } catch (err) {
                    callback({
                        success: false,
                        error: { type: 'error', message: err.message },
                    });
                }
            } catch (err) {
                callback({
                    success: false,
                    error: {
                        type: 'error',
                        message:
                            err.message !== undefined
                                ? err.message
                                : 'You need to slow down, you have send to many request. Try again in a minute.',
                    },
                });
            }
        } else if (event === 'sendUserAnonymous') {
            if (callback === undefined || typeof callback !== 'function') {
                return;
            }
            if (ws.data !== undefined && ws.data !== null) {
                try {
                    const identifier = ws.remoteAddress;
                    await rateLimiter.consume(identifier);
                    await socketCheckAntiSpam(ws.data._id);
                    try {
                        const user = await User.findById(ws.data._id)
                            .select('username avatar rank mute ban')
                            .lean();
                        socketCheckUserData(user, true);
                        settingCheck(user);
                        generalSendUserAnonymousSocket(
                            wss,
                            ws,
                            user,
                            data,
                            callback
                        );
                    } catch (err) {
                        socketRemoveAntiSpam(ws.data._id);
                        callback({
                            success: false,
                            error: { type: 'error', message: err.message },
                        });
                    }
                } catch (err) {
                    callback({
                        success: false,
                        error: {
                            type: 'error',
                            message:
                                err.message !== undefined
                                    ? err.message
                                    : 'You need to slow down, you have send to many request. Try again in a minute.',
                        },
                    });
                }
            } else {
                callback({
                    success: false,
                    error: {
                        type: 'error',
                        message: 'You need to sign in to perform this action.',
                    },
                });
            }
        } else if (event === 'sendUserDiscord') {
            if (callback === undefined || typeof callback !== 'function') {
                return;
            }
            if (ws.data !== undefined && ws.data !== null) {
                try {
                    const identifier = ws.remoteAddress;
                    await rateLimiter.consume(identifier);
                    await socketCheckAntiSpam(ws.data._id);
                    try {
                        const user = await User.findById(ws.data._id)
                            .select('discordId username avatar rank mute ban')
                            .lean();
                        socketCheckUserData(user, true);
                        settingCheck(user);
                        generalSendUserDiscordSocket(
                            wss,
                            ws,
                            user,
                            data,
                            callback
                        );
                    } catch (err) {
                        socketRemoveAntiSpam(ws.data._id);
                        callback({
                            success: false,
                            error: { type: 'error', message: err.message },
                        });
                    }
                } catch (err) {
                    callback({
                        success: false,
                        error: {
                            type: 'error',
                            message:
                                err.message !== undefined
                                    ? err.message
                                    : 'You need to slow down, you have send to many request. Try again in a minute.',
                        },
                    });
                }
            } else {
                callback({
                    success: false,
                    error: {
                        type: 'error',
                        message: 'You need to sign in to perform this action.',
                    },
                });
            }
        } else if (event === 'sendUserSeed') {
            if (callback === undefined || typeof callback !== 'function') {
                return;
            }
            if (ws.data !== undefined && ws.data !== null) {
                try {
                    const identifier = ws.remoteAddress;
                    await rateLimiter.consume(identifier);
                    await socketCheckAntiSpam(ws.data._id);
                    try {
                        const user = await User.findById(ws.data._id)
                            .select('username avatar rank mute ban')
                            .lean();
                        socketCheckUserData(user, true);
                        settingCheck(user);
                        generalSendUserSeedSocket(wss, ws, user, data, callback);
                    } catch (err) {
                        socketRemoveAntiSpam(ws.data._id);
                        callback({
                            success: false,
                            error: { type: 'error', message: err.message },
                        });
                    }
                } catch (err) {
                    callback({
                        success: false,
                        error: {
                            type: 'error',
                            message:
                                err.message !== undefined
                                    ? err.message
                                    : 'You need to slow down, you have send to many request. Try again in a minute.',
                        },
                    });
                }
            } else {
                callback({
                    success: false,
                    error: {
                        type: 'error',
                        message: 'You need to sign in to perform this action.',
                    },
                });
            }
        } else if (event === 'sendUserTip') {
            if (callback === undefined || typeof callback !== 'function') {
                return;
            }
            if (ws.data !== undefined && ws.data !== null) {
                try {
                    const identifier = ws.remoteAddress;
                    await rateLimiter.consume(identifier);
                    await socketCheckAntiSpam(ws.data._id);
                    try {
                        const user = await User.findById(ws.data._id)
                            .select(
                                'username avatar rank balance stats limits mute ban'
                            )
                            .lean();
                        socketCheckUserData(user, true);
                        settingCheck(user, 'general.tip.enabled');
                        generalSendUserTipSocket(wss, ws, user, data, callback);
                    } catch (err) {
                        socketRemoveAntiSpam(ws.data._id);
                        callback({
                            success: false,
                            error: { type: 'error', message: err.message },
                        });
                    }
                } catch (err) {
                    callback({
                        success: false,
                        error: {
                            type: 'error',
                            message:
                                err.message !== undefined
                                    ? err.message
                                    : 'You need to slow down, you have send to many request. Try again in a minute.',
                        },
                    });
                }
            } else {
                callback({
                    success: false,
                    error: {
                        type: 'error',
                        message: 'You need to sign in to perform this action.',
                    },
                });
            }
        }
    });
};
