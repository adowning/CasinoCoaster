import { WebSocketServer } from 'bun-ws-router';
import leaderboardSocket from './general/leaderboard';
import vaultSocket from './general/vault';
import userSocket from './general/user';
import rakebackSocket from './general/rakeback';
import rainSocket from './general/rain';

export default (wss: WebSocketServer) => {
    wss.on('connection', (ws) => {
        leaderboardSocket(ws, wss);
        vaultSocket(ws, wss);
        userSocket(ws, wss);
        rakebackSocket(ws, wss);
        rainSocket(ws, wss);
    });
};
