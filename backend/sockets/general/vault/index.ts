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
    generalSendVaultDepositSocket,
    generalSendVaultWithdrawSocket,
    generalSendVaultLockSocket,
} from '../../../controllers/general/vault';

interface VaultData {
    // Define the structure of the data expected from the client
}

export default (ws: WebSocket, wss: WebSocketServer) => {
    ws.on('message', async (message: string) => {
        const { event, data, callback } = JSON.parse(message);

        if (event === 'sendVaultDeposit') {
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
                            .select('username avatar rank balance vault mute ban')
                            .lean();
                        socketCheckUserData(user, true);
                        settingCheck(user);
                        generalSendVaultDepositSocket(
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
        } else if (event === 'sendVaultWithdraw') {
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
                            .select('username avatar rank balance vault mute ban')
                            .lean();
                        socketCheckUserData(user, true);
                        settingCheck(user);
                        generalSendVaultWithdrawSocket(
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
        } else if (event === 'sendVaultLock') {
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
                            .select('username avatar rank balance vault mute ban')
                            .lean();
                        socketCheckUserData(user, true);
                        settingCheck(user);
                        generalSendVaultLockSocket(
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
};