import { PrismaClient, User } from '@prisma/client';
import { Router } from 'bun-ws-router';

// Load utils
import { socketRemoveAntiSpam } from '../../../utils/socket';
import { generalCheckSendRakebackClaimUser } from '../../../utils/general/rakeback';

const prisma = new PrismaClient();
const router = new Router();

router.ws('/rakeback', {
  open(ws) {
    console.log('WebSocket connection opened');
  },
  async message(ws, message) {
    const { type, payload } = JSON.parse(message.toString());

    switch (type) {
      case 'getData':
        try {
          const boxes = await prisma.box.findMany({
            where: { type: 'reward', state: 'active' },
            select: { name: true, amount: true, levelMin: true, type: true, state: true },
          });
          ws.send(JSON.stringify({ type: 'getData', payload: { success: true, boxes } }));
        } catch (err: any) {
          ws.send(JSON.stringify({ type: 'getData', payload: { success: false, error: { type: 'error', message: err.message } } }));
        }
        break;
      case 'claim':
        try {
          const user = await prisma.user.findUnique({ where: { id: payload.userId } });
          if (!user) {
            throw new Error('User not found');
          }
          generalCheckSendRakebackClaimUser(user);

          const [updatedUser] = await prisma.$transaction([
            prisma.user.update({
              where: { id: user.id },
              data: {
                balance: {
                  increment: user.rakebackAvailable,
                },
                rakebackAvailable: 0,
                updatedAt: new Date(),
              },
              select: {
                balance: true,
                xp: true,
                statsBet: true,
                statsWon: true,
                statsDeposit: true,
                statsWithdraw: true,
                rakebackEarned: true,
                rakebackAvailable: true,
                muteExpire: true,
                banExpire: true,
                verifiedAt: true,
                updatedAt: true,
              },
            }),
            prisma.balanceTransaction.create({
              data: {
                amount: user.rakebackAvailable,
                type: 'rakebackClaim',
                userId: user.id,
                state: 'completed',
              },
            }),
          ]);

          ws.send(JSON.stringify({ type: 'claim', payload: { success: true, user: updatedUser } }));
          socketRemoveAntiSpam(user.id);
        } catch (err: any) {
          socketRemoveAntiSpam(payload.userId);
          ws.send(JSON.stringify({ type: 'claim', payload: { success: false, error: { type: 'error', message: err.message } } }));
        }
        break;
    }
  },
  close(ws, code, message) {
    console.log('WebSocket connection closed');
  },
});

export default router;
