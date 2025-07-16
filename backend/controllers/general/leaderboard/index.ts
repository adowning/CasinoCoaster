import { PrismaClient, User } from '@prisma/client';
import { Server, Socket } from 'socket.io';

// Load utils
import { generalUserGetFormated } from '../../../utils/general/user';
import { generalGetLeaderboardTimeLeft } from '../../../utils/general/leaderboard';

const prisma = new PrismaClient();

// General leaderboard variables
let generalLeaderboardTimeout: NodeJS.Timeout | null = null;

export const generalGetLeaderboardDataSocket = async (
  io: Server,
  socket: Socket,
  user: User,
  data: any,
  callback: (data: any) => void
) => {
  try {
    // Get current leaderboard and top 100 users from database
    const [leaderboard, topUsers] = await Promise.all([
      prisma.leaderboard.findFirst({ where: { state: 'running' } }),
      prisma.user.findMany({
        orderBy: { leaderboardPoints: 'desc' },
        take: 50,
        select: {
          robloxId: true,
          username: true,
          avatar: true,
          rank: true,
          xp: true,
          statsBet: true,
          leaderboardPoints: true,
          rakebackEarned: true,
          anonymous: true,
          createdAt: true,
        },
      }),
    ]);

    // Format leaderboard data and leaderboard users
    if (leaderboard) {
      const winners = leaderboard.winners.map((winner: any, index: number) => ({
        prize: winner.prize,
        points: topUsers[index] ? topUsers[index].leaderboardPoints : 0,
        user: topUsers[index] ? generalUserGetFormated(topUsers[index]) : undefined,
      }));
      leaderboard.winners = winners;
    }

    callback({ success: true, leaderboard });
  } catch (err: any) {
    callback({ success: false, error: { type: 'error', message: err.message } });
  }
};

export const generalLeaderboardStart = async (io: Server, leaderboard: any) => {
  try {
    // Get time left until leaderboard is completed
    const left = generalGetLeaderboardTimeLeft(leaderboard);

    // Set leaderboard timeout and call leaderboard complete function after the left time
    generalLeaderboardTimeout = setTimeout(() => {
      generalLeaderboardComplete(io, leaderboard);
    }, left);
  } catch (err) {
    console.error(err);
  }
};

export const generalLeaderboardStop = async (io: Server, leaderboard: any) => {
  try {
    // Clear current leaderboard timeout
    if (generalLeaderboardTimeout) {
      clearTimeout(generalLeaderboardTimeout);
    }
  } catch (err) {
    console.error(err);
  }
};

export const generalLeaderboardComplete = async (io: Server, leaderboard: any) => {
  try {
    // Clear current leaderboard timeout
    if (generalLeaderboardTimeout) {
      clearTimeout(generalLeaderboardTimeout);
    }

    // Get active leaderboard, new leaderboard if available and top 10 users for current leaderboard from database
    const [activeLeaderboard, newLeaderboard, topUsers] = await Promise.all([
      prisma.leaderboard.findUnique({ where: { id: leaderboard.id } }),
      prisma.leaderboard.findFirst({ where: { state: 'created' }, orderBy: { createdAt: 'asc' } }),
      prisma.user.findMany({
        orderBy: { leaderboardPoints: 'desc' },
        take: 10,
        select: { id: true, leaderboardPoints: true },
      }),
    ]);

    if (!activeLeaderboard) {
      return;
    }

    // Create winners and database query promises arrays
    const winners: any[] = [];
    const promises: any[] = [];

    for (let i = 0; i < activeLeaderboard.winners.length; i++) {
      if (topUsers[i]) {
        // Add formated winner object for the win position to the winners array
        winners.push({
          prize: activeLeaderboard.winners[i].prize,
          points: topUsers[i].leaderboardPoints,
          userId: topUsers[i].id,
        });

        // Add user update and balance create querys to promise array
        promises.push(
          prisma.user.update({
            where: { id: topUsers[i].id },
            data: {
              balance: {
                increment: activeLeaderboard.winners[i].prize,
              },
              updatedAt: new Date(),
            },
            select: { balance: true, updatedAt: true },
          }),
          prisma.balanceTransaction.create({
            data: {
              amount: activeLeaderboard.winners[i].prize,
              type: 'leaderboardPayout',
              userId: topUsers[i].id,
              state: 'completed',
            },
          })
        );
      } else {
        // Add formated winner object for the win position to the winners array
        winners.push({ prize: activeLeaderboard.winners[i].prize, points: 0 });
      }
    }

    // Update leaderboard and execute querys from promise array in database
    await Promise.all([
      prisma.leaderboard.update({
        where: { id: leaderboard.id },
        data: { winners, state: 'completed', updatedAt: new Date() },
      }),
      ...promises,
    ]);

    if (newLeaderboard) {
      // Update the new leaderboard and all users leaderboard points in database
      const [updatedLeaderboard] = await Promise.all([
        prisma.leaderboard.update({
          where: { id: newLeaderboard.id },
          data: { state: 'running', updatedAt: new Date() },
        }),
        prisma.user.updateMany({ data: { leaderboardPoints: 0 } }),
      ]);

      // Call leaderboard start function
      generalLeaderboardStart(io, updatedLeaderboard);
    }
  } catch (err) {
    console.error(err);
  }
};

export const generalLeaderboardInit = async (io: Server) => {
  try {
    // Get active leaderboard and new leaderboard if available from database
    let [activeLeaderboard, newLeaderboard] = await Promise.all([
      prisma.leaderboard.findFirst({ where: { state: 'running' } }),
      prisma.leaderboard.findFirst({ where: { state: 'created' }, orderBy: { createdAt: 'asc' } }),
    ]);

    if (activeLeaderboard) {
      // Get time left until leaderboard is completed
      const left = generalGetLeaderboardTimeLeft(activeLeaderboard);

      if (left > 0) {
        // Set leaderboard timeout and call leaderboard complete function after the left time
        generalLeaderboardTimeout = setTimeout(() => {
          generalLeaderboardComplete(io, activeLeaderboard);
        }, left);
      } else {
        // Call leaderboard complete function if not time is left
        generalLeaderboardComplete(io, activeLeaderboard);
      }
    } else if (newLeaderboard) {
      // Update the new leaderboard and all users leaderboard points in database
      [activeLeaderboard] = await Promise.all([
        prisma.leaderboard.update({
          where: { id: newLeaderboard.id },
          data: { state: 'running', updatedAt: new Date() },
        }),
        prisma.user.updateMany({ data: { leaderboardPoints: 0 } }),
      ]);

      // Call leaderboard start function
      generalLeaderboardStart(io, activeLeaderboard);
    }
  } catch (err) {
    console.error(err);
  }
};
