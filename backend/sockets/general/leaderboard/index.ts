import { WebSocket, WebSocketServer } from 'bun-ws-router';
import { User } from '../../../database/models/User';
import { rateLimiter } from '../../../middleware/rateLimiter';
import { socketCheckUserData } from '../../../utils/socket';
import { settingCheck } from '../../../utils/setting';
import {
    generalGetLeaderboardDataSocket,
    generalLeaderboardInit,
} from '../../../controllers/general/leaderboard';

interface LeaderboardData {
    // Define the structure of the data expected from the client
}

export default (ws: WebSocket, wss: WebSocketServer) => {
    ws.on('message', async (message: string) => {
        const { event, data, callback } = JSON.parse(message);

        if (event === 'getLeaderboardData') {
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
                            .select('username avatar rank mute ban')
                            .lean();
                    }
                    socketCheckUserData(user, false);
                    settingCheck(user);
                    generalGetLeaderboardDataSocket(
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
        }
    });

    // Init leaderboard
    generalLeaderboardInit(wss);
};