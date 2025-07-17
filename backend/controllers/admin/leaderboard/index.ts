import { PrismaClient, User } from '@prisma/client';
import { Server, Socket } from 'socket.io';

// Load utils
import { socketRemoveAntiSpam } from '../../../utils/socket';
import {
  adminCheckGetLeaderboardListData,
  adminCheckSendLeaderboardCreateData,
  adminCheckSendLeaderboardStopData,
  adminCheckSendLeaderboardStopLeaderboard,
} from '../../../utils/admin/leaderboard';

// Load controllers
import { generalLeaderboardStart, generalLeaderboardStop } from '../../general/leaderboard';

const prisma = new PrismaClient();

export const adminGetLeaderboardListSocket = async (
  io: Server,
  socket: Socket,
  user: User,
  data: any,
  callback: (data: any) => void
) => {
  try {
    // Validate sent data
    adminCheckGetLeaderboardListData(data);

    // Calculating database query offset
    const offset = (data.page - 1) * 12;

    // Get leaderboards and leaderboards count from database
    const [count, leaderboards] = await Promise.all([
      prisma.leaderboard.count({
        where: { type: { contains: data.search, mode: 'insensitive' } },
      }),
      prisma.leaderboard.findMany({
        where: { type: { contains: data.search, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        take: 12,
        skip: offset,
        select: { winners: true, duration: true, type: true, state: true, createdAt: true },
      }),
    ]);

    callback({ success: true, count, leaderboards });
  } catch (err: any) {
    callback({ success: false, error: { type: 'error', message: err.message } });
  }
};

export const adminSendLeaderboardCreateSocket = async (
  io: Server,
  socket: Socket,
  user: User,
  data: any,
  callback: (data: any) => void
) => {
  try {
    // Validate sent data
    adminCheckSendLeaderboardCreateData(data);

    // Get active leaderboard from database
    const runningLeaderboard = await prisma.leaderboard.findFirst({ where: { state: 'running' } });

    // Get duration
    const duration = Math.floor(data.duration);

    // Get prizes
    const winners = data.prizes.map((prize: any) => ({ prize: prize.amount }));

    // Create leaderboard
    const newLeaderboard = await prisma.leaderboard.create({
      data: {
        winners,
        duration,
        type: data.type,
        state: runningLeaderboard ? 'created' : 'running',
      },
    });

    // Add update users leaderboard points if new leaderboard is running
    if (!runningLeaderboard) {
      await prisma.user.updateMany({ data: { leaderboardPoints: 0 } });
    }

    // Call leaderboard start function if created leaderboard is running
    if (newLeaderboard.state === 'running') {
      generalLeaderboardStart(io, newLeaderboard);
    }

    callback({ success: true, leaderboard: newLeaderboard });

    socketRemoveAntiSpam(user.id);
  } catch (err: any) {
    socketRemoveAntiSpam(user.id);
    callback({ success: false, error: { type: 'error', message: err.message } });
  }
};

export const adminSendLeaderboardStopSocket = async (
  io: Server,
  socket: Socket,
  user: User,
  data: any,
  callback: (data: any) => void
) => {
  try {
    // Validate sent data
    adminCheckSendLeaderboardStopData(data);

    // Validate if the leaderboard code is in database and is active
    const leaderboard = await prisma.leaderboard.findUnique({ where: { id: data.leaderboardId } });
    adminCheckSendLeaderboardStopLeaderboard(leaderboard);

    if (!leaderboard) {
      return;
    }

    let updatedLeaderboard;
    if (leaderboard.state === 'created') {
      // Remove leaderboard from database
      updatedLeaderboard = await prisma.leaderboard.delete({ where: { id: data.leaderboardId } });
    } else {
      // Call leaderboard stop function
      generalLeaderboardStop(io, leaderboard);

      // Update leaderboard state in database
      updatedLeaderboard = await prisma.leaderboard.update({
        where: { id: data.leaderboardId },
        data: { state: 'canceled' },
      });
    }

    callback({ success: true, leaderboard: updatedLeaderboard });

    socketRemoveAntiSpam(user.id);
  } catch (err: any) {
    socketRemoveAntiSpam(user.id);
    callback({ success: false, error: { type: 'error', message: err.message } });
  }
};
