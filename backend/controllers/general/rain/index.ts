import { PrismaClient, User, Rain } from '@prisma/client';
import { Server, Socket } from 'socket.io';

// Load utils
import { socketRemoveAntiSpam } from '../../../utils/socket';
import { settingGet } from '../../../utils/setting';
import { captchaCheckData, captchaGetData } from '../../../utils/captcha';
import {
  generalCheckSendRainCreateData,
  generalCheckSendRainCreateRain,
  generalCheckSendRainCreateUser,
  generalCheckSendRainTipData,
  generalCheckSendRainTipRain,
  generalCheckSendRainTipUser,
  generalCheckSendRainJoinData,
  generalCheckSendRainJoinRain,
  generalCheckSendRainJoinUser,
  generalCheckSendRainJoinTransactions,
} from '../../../utils/general/rain';
import { generalUserGetFormated } from '../../../utils/general/user';

// Load controllers
import { generalChatAddMessage } from '../chat';

const prisma = new PrismaClient();

// General rain variables
let generalRainCreateBlock: string[] = [];

export const generalGetRains = async (): Promise<{ site: Rain | null; active: Rain | null }> => {
  try {
    // Get current site rain and if available active rain from database
    const [site, active] = await Promise.all([
      prisma.rain.findFirst({
        where: { type: 'site', state: { in: ['created', 'pending', 'running'] } },
        select: { amount: true, participants: true, type: true, state: true, updatedAt: true },
      }),
      prisma.rain.findFirst({
        where: { state: 'running' },
        select: { amount: true, participants: true, creator: true, type: true, state: true, updatedAt: true },
        include: { creator: { select: { username: true, avatar: true, rank: true, xp: true, stats: true, anonymous: true, createdAt: true } } },
      }),
    ]);

    // If rain is a user created rain format creater user object
    if (active && active.type === 'user' && active.creator) {
      active.creator = generalUserGetFormated(active.creator);
    }

    return { site, active };
  } catch (err) {
    throw err;
  }
};

export const generalSendRainCreateSocket = async (
  io: Server,
  socket: Socket,
  user: User,
  data: any,
  callback: (data: any) => void
) => {
  try {
    // Validate sent data
    generalCheckSendRainCreateData(data);

    // Validate if a user rain is already running
    const rain = await prisma.rain.findFirst({
      where: { type: 'user', state: { in: ['created', 'pending', 'running'] } },
      select: { type: true, state: true, createdAt: true },
    });
    generalCheckSendRainCreateRain(rain, generalRainCreateBlock);

    try {
      // Add user id to create block array
      generalRainCreateBlock.push(user.id);

      // Check if user has enougth balance
      generalCheckSendRainCreateUser(data, user);

      // Get user tip amount
      const amount = Math.floor(data.amount);

      // Update user, create new rain and balance transaction in the database
      const [updatedUser, newRain] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { balance: { decrement: amount } },
          select: { balance: true, xp: true, stats: true, rakeback: true, mute: true, ban: true, verifiedAt: true, updatedAt: true },
        }),
        prisma.rain.create({
          data: {
            amount,
            creatorId: user.id,
            type: 'user',
            state: 'created',
          },
        }),
        prisma.balanceTransaction.create({
          data: {
            amount: -amount,
            type: 'rainCreate',
            userId: user.id,
            state: 'completed',
          },
        }),
      ]);

      // Send updated user to frontend
      io.of('/general').to(user.id).emit('user', { user: updatedUser });

      // Call rain start function
      generalRainStart(io, newRain);

      callback({ success: true });

      // Remove user id from create block array
      generalRainCreateBlock = generalRainCreateBlock.filter((id) => id !== user.id);

      socketRemoveAntiSpam(user.id);
    } catch (err: any) {
      generalRainCreateBlock = generalRainCreateBlock.filter((id) => id !== user.id);
      socketRemoveAntiSpam(socket.decoded._id);
      callback({ success: false, error: { type: 'error', message: err.message } });
    }
  } catch (err: any) {
    socketRemoveAntiSpam(socket.decoded._id);
    callback({ success: false, error: { type: 'error', message: err.message } });
  }
};

export const generalSendRainTipSocket = async (
  io: Server,
  socket: Socket,
  user: User,
  data: any,
  callback: (data: any) => void
) => {
  try {
    // Validate sent data
    generalCheckSendRainTipData(data);

    // Validate if rain is available
    const rain = await prisma.rain.findFirst({
      where: { type: 'site', state: { in: ['created', 'pending', 'running'] } },
      select: { id: true, type: true, state: true },
    });
    generalCheckSendRainTipRain(rain);

    if (!rain) {
      throw new Error('Rain not found');
    }

    // Validate user
    generalCheckSendRainTipUser(data, user);

    // Get user tip amount
    const amount = Math.floor(data.amount);

    // Update user, rain and create new balance transaction in the database
    const [updatedUser, updatedRain, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } },
        select: { balance: true, xp: true, stats: true, rakeback: true, mute: true, ban: true, verifiedAt: true, updatedAt: true },
      }),
      prisma.rain.update({
        where: { id: rain.id },
        data: { amount: { increment: amount } },
        select: { amount: true, participants: true, type: true, state: true, updatedAt: true },
      }),
      prisma.balanceTransaction.create({
        data: {
          amount: -amount,
          type: 'rainTip',
          userId: user.id,
          state: 'completed',
        },
      }),
    ]);

    // Send updated user to frontend
    io.of('/general').to(user.id).emit('user', { user: updatedUser });

    // Send updated rain to frontend
    io.of('/general').emit('rain', { rain: updatedRain });

    // Create rain message object
    const message = {
      transaction: { ...transaction, user: { id: user.id, username: user.username } },
      type: 'rainTip',
    };

    // Add message to specific chat room/s and send to frontend
    generalChatAddMessage(io, message);

    callback({ success: true });

    socketRemoveAntiSpam(user.id);
  } catch (err: any) {
    socketRemoveAntiSpam(socket.decoded._id);
    callback({ success: false, error: { type: 'error', message: err.message } });
  }
};

export const generalSendRainJoinSocket = async (
  io: Server,
  socket: Socket,
  user: User,
  data: any,
  callback: (data: any) => void
) => {
  try {
    // Validate sent data
    generalCheckSendRainJoinData(data);

    // Validate captcha
    const captchaCheck = await captchaGetData(data.captcha);
    captchaCheckData(captchaCheck);

    // Execute promises arrays
    let [runningRain, completedRains] = await Promise.all([
      prisma.rain.findFirst({ where: { state: 'running' } }),
      prisma.rain.findMany({
        where: {
          participants: { some: { id: user.id } },
          state: 'completed',
          updatedAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
        },
      }),
    ]);

    // Get page settings
    const settings = settingGet();

    // Validate if rain is available and user not joined already
    generalCheckSendRainJoinRain(user, runningRain, settings);

    if (!runningRain) {
      throw new Error('Rain not found');
    }

    // Validate joining user
    generalCheckSendRainJoinUser(user, runningRain, completedRains);

    // Validate user deposit amount in the two weeks if rain is site rain
    if (runningRain.type === 'site') {
      const transactions = await Promise.all([
        // prisma.robuxTransaction.findMany({ where: { 'deposit.user': user.id, state: 'completed', createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) } } }),
        // prisma.limitedTransaction.findMany({ where: { 'deposit.user': user.id, state: 'completed', createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) } } }),
        // prisma.steamTransaction.findMany({ where: { 'deposit.user': user.id, state: 'completed', createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) } } }),
        // prisma.cryptoTransaction.findMany({ where: { type: 'deposit', userId: user.id, state: 'completed', createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) } } }),
        // prisma.giftTransaction.findMany({ where: { type: 'deposit', userId: user.id, state: 'completed', createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) } } }),
        // prisma.creditTransaction.findMany({ where: { type: 'deposit', userId: user.id, state: 'completed', createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) } } }),
      ]);
      generalCheckSendRainJoinTransactions(transactions.flat());
    }

    // Update rain in database
    runningRain = await prisma.rain.update({
      where: { id: runningRain.id },
      data: { participants: { connect: { id: user.id } } },
      include: { creator: { select: { username: true } } },
    });

    // Send updated rain to frontend
    io.of('/general').emit('rain', { rain: runningRain });

    callback({ success: true });

    socketRemoveAntiSpam(user.id);
  } catch (err: any) {
    socketRemoveAntiSpam(socket.decoded._id);
    callback({ success: false, error: { type: 'error', message: err.message } });
  }
};

export const generalRainStart = async (io: Server, rain: Rain) => {
  try {
    // Get running rain from database if available
    let runningRain = await prisma.rain.findFirst({ where: { state: 'running' } });

    if (runningRain) {
      // Get delay time until active rain is completed
      const delay = (runningRain.updatedAt.getTime() + 1000 * 60 * 2) - Date.now();

      // Update rain in database
      runningRain = await prisma.rain.update({
        where: { id: rain.id },
        data: { state: 'pending', updatedAt: new Date() },
      });

      // Call rain start function after the current active rain is completed
      setTimeout(() => {
        generalRainStart(io, runningRain);
      }, delay);
    } else {
      // Update rain in database
      runningRain = await prisma.rain.update({
        where: { id: rain.id },
        data: { state: 'running', updatedAt: new Date() },
        include: { creator: { select: { username: true, avatar: true, rank: true, stats: true, anonymous: true, createdAt: true } } },
      });

      // If rain is a user created rain format creater user object
      if (runningRain.type === 'user' && runningRain.creator) {
        runningRain.creator = generalUserGetFormated(runningRain.creator);
      }

      // Call rain complete function after a 2 minute delay
      setTimeout(() => {
        generalRainComplete(io, runningRain);
      }, 1000 * 60 * 2);
    }

    // Send updated rain to frontend
    io.of('/general').emit('rain', { rain: runningRain });
  } catch (err) {
    console.error(err);
  }
};

export const generalRainComplete = async (io: Server, rain: Rain) => {
  try {
    // Get rain from database
    const completedRain = await prisma.rain.findUnique({
      where: { id: rain.id },
      include: { participants: { include: { user: { select: { balance: true, xp: true, stats: true, rakeback: true, ips: true, mute: true, ban: true } } } } },
    });

    if (!completedRain) {
      return;
    }

    // Get total combined participants xp
    const totalXp = completedRain.participants.reduce((a, b) => a + b.user.xp, 0);

    // Create payout addresses array
    let payoutAddresses: string[] = [];

    // Create promise arrays
    let promisesUsers: any[] = [];
    let promisesTransactions: any[] = [];

    for (const participant of completedRain.participants) {
      // Get user payout amount
      let payout = Math.floor(Math.floor(completedRain.amount / 2) / completedRain.participants.length);
      payout = payout + Math.floor(Math.floor(completedRain.amount / 2) * (participant.user.xp / totalXp));

      if (!payoutAddresses.includes(participant.user.ips[0].address) && !isNaN(payout)) {
        // Add user ip to payout addresses array
        // payoutAddresses.push(participant.user.ips[0].address);

        // Add update user query to user promises array
        promisesUsers.push(
          prisma.user.update({
            where: { id: participant.user.id },
            data: {
              balance: { increment: payout },
              limitsBetToWithdraw: { increment: payout },
              limitsBetToRain: { increment: payout },
            },
            select: { id: true, balance: true, xp: true, stats: true, rakeback: true, mute: true, ban: true, verifiedAt: true, updatedAt: true },
          })
        );

        // Add create balance transaction query to transaction promises array
        promisesTransactions.push(
          prisma.balanceTransaction.create({
            data: {
              amount: payout,
              type: 'rainPayout',
              userId: participant.user.id,
              state: 'completed',
            },
          })
        );
      }
    }

    // Update old rain and execute querys from promise array in database
    const [updatedRain, ...results] = await prisma.$transaction([
      prisma.rain.update({ where: { id: completedRain.id }, data: { state: 'completed', updatedAt: new Date() } }),
      ...promisesUsers,
      ...promisesTransactions,
    ]);

    const updatedUsers = results.slice(0, promisesUsers.length);
    const transactions = results.slice(promisesUsers.length);

    // Send updated users to frontend
    for (const user of updatedUsers) {
      io.of('/general').to(user.id).emit('user', { user });
    }

    // Send balance transactions to frontend
    for (const transaction of transactions) {
      io.of('/general').to(transaction.userId).emit('rainPayout', { transaction });
    }

    // Create rain message object
    const message = {
      rain: updatedRain,
      type: 'rainCompleted',
    };

    // Add message to specific chat room/s and send to frontend
    generalChatAddMessage(io, message);

    if (rain.type === 'site') {
      // Create new site rain in database
      const newRain = await prisma.rain.create({
        data: {
          amount: 100000,
          type: 'site',
          state: 'created',
        },
      });

      // Send new rain to frontend
      io.of('/general').emit('rain', { rain: newRain });

      // Call rain start function after a 28 minutes delay for the new created rain
      setTimeout(() => {
        generalRainStart(io, newRain);
      }, 1000 * 60 * 28);
    }
  } catch (err) {
    console.error(err);
  }
};

export const generalRainInit = async (io: Server) => {
  try {
    // Get all uncompleted rains
    const rains = await prisma.rain.findMany({
      where: { state: { in: ['created', 'pending', 'running'] } },
    });

    // Cancel all extisting rains
    for (const rain of rains) {
      await prisma.rain.update({ where: { id: rain.id }, data: { state: 'canceled', updatedAt: new Date() } });
    }

    // Create new site rain
    let newRain = await prisma.rain.create({
      data: {
        amount: 100000,
        type: 'site',
        state: 'created',
      },
    });

    // Call rain start function after a 28 minutes delay
    setTimeout(() => {
      generalRainStart(io, newRain);
    }, 1000 * 60 * 28);
  } catch (err) {
    console.error(err);
  }
};
