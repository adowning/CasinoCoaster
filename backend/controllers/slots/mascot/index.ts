import { PrismaClient, User } from '@prisma/client';
import { Router } from 'bun-ws-router';
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';

// Load utils
import { socketRemoveAntiSpam } from '../../../utils/socket';

const prisma = new PrismaClient();
const router = new Router();

let slots_game_data: any[] = [];

const httpsAgent = new https.Agent({
  key: fs.readFileSync(path.join(__dirname, 'mascotssl/client.key')),
  cert: fs.readFileSync(path.join(__dirname, 'mascotssl/client.crt')),
  rejectUnauthorized: false,
  keepAlive: true,
});

const MascotApi = axios.create({
  httpsAgent,
  headers: {
    post: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
});

MascotApi.post('https://api.mascot.games/v1/', {
  jsonrpc: '2.0',
  method: 'Game.List',
  id: 1920911592,
  params: {
    BankGroupId: 'robux_bank_group',
  },
}).then((res) => {
  slots_game_data = res.data.result.Games;
}).catch((err) => {
  console.log(err);
});

router.ws('/slots', {
  open(ws) {
    console.log('WebSocket connection opened');
  },
  async message(ws, message) {
    const { type, payload } = JSON.parse(message.toString());
    const { user } = ws.data;

    switch (type) {
      case 'getData':
        ws.send(JSON.stringify({ type: 'getData', payload: { success: true, boxes: slots_game_data } }));
        break;
      case 'createGame':
        try {
          if (!user) {
            throw new Error('You need to login to play.');
          }

          const mascotUser = await prisma.slotsUser.findUnique({ where: { userId: user.id } });

          if (!mascotUser) {
            const req = {
              jsonrpc: '2.0',
              method: 'Player.Set',
              id: 1928822491,
              params: {
                Id: user.id,
                Nick: user.username,
                BankGroupId: 'robux_bank_group',
              },
            };

            await MascotApi.post('https://api.mascot.games/v1/', JSON.stringify(req));

            await prisma.user.update({
              where: { id: user.id },
              data: { slots: { mascot: true } },
            });

            await new Promise((r) => setTimeout(r, 2000));
          }

          const req = {
            jsonrpc: '2.0',
            method: 'Session.Create',
            id: 1047919053,
            params: {
              PlayerId: user.id,
              GameId: payload.boxId,
              Params: {
                language: 'en',
              },
            },
          };

          const res = await MascotApi.post('https://api.mascot.games/v1/', JSON.stringify(req));

          if (!res.data.result) {
            socketRemoveAntiSpam(user.id);
            throw new Error(res.data.error.message);
          }

          ws.send(
            JSON.stringify({
              type: 'createGame',
              payload: {
                success: true,
                box: {
                  url: res.data.result.SessionUrl,
                  Id: payload.boxId,
                  Name: slots_game_data.find((_: any) => _.Id === payload.boxId).Name,
                },
              },
            })
          );

          socketRemoveAntiSpam(user.id);
        } catch (err: any) {
          ws.send(JSON.stringify({ type: 'createGame', payload: { success: false, error: { type: 'error', message: err.message } } }));
        }
        break;
    }
  },
  close(ws, code, message) {
    console.log('WebSocket connection closed');
  },
});

export default router;
