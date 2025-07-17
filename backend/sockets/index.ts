import { WebSocketServer } from 'bun-ws-router';
import leaderboardSocket from './general/leaderboard';
import vaultSocket from './general/vault';

export default (wss: WebSocketServer) => {
    wss.on('connection', (ws) => {
        leaderboardSocket(ws, wss);
        vaultSocket(ws, wss);
    });
import { duelsRouter, initDuels } from '../duels/duels.router';

export {
    duelsRouter,
    initDuels
main
};
