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
    generalSendRainCreateSocket,
    generalSendRainTipSocket,
    generalSendRainJoinSocket,
    generalRainInit,
} from '../../../controllers/general/rain';

export default (ws: WebSocket, wss: WebSocketServer) => {
    ws.on('message', async (message: string) => {
        const { event, data, callback } = JSON.parse(message);

        if (event === 'sendRainCreate') {
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
                            .select('username avatar rank balance limits mute ban')
                            .lean();
                        socketCheckUserData(user, true);
                        settingCheck(user);
                        generalSendRainCreateSocket(
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
        } else if (event === 'sendRainTip') {
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
                            .select('username avatar rank balance limits mute ban')
                            .lean();
                        socketCheckUserData(user, true);
                        settingCheck(user);
                        generalSendRainTipSocket(wss, ws, user, data, callback);
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
        } else if (event === 'sendRainJoin') {
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
                            .select('username avatar rank xp stats limits mute ban')
                            .lean();
                        socketCheckUserData(user, true);
                        settingCheck(user);
                        generalSendRainJoinSocket(
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
        }
    });

    generalRainInit(wss);
};
