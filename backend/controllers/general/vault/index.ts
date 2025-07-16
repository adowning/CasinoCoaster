import { PrismaClient, User } from '@prisma/client';
import { Server, Socket } from 'socket.io';

// Load utils
import {
    socketRemoveAntiSpam
} from '../../../utils/socket';
import {
    generalCheckSendVaultDepositData,
    generalCheckSendVaultDepositUser,
    generalCheckSendVaultWithdrawData,
    generalCheckSendVaultWithdrawUser,
    generalCheckSendVaultLockData,
    generalCheckSendVaultLockUser
} from '../../../utils/general/vault';

const prisma = new PrismaClient();

interface VaultDepositData {
    amount: number;
}

interface VaultWithdrawData {
    amount: number;
}

interface VaultLockData {
    time: number;
}

export const generalSendVaultDepositSocket = async (io: Server, socket: Socket, user: User, data: VaultDepositData, callback: (response: any) => void) => {
    try {
        // Validate sent data
        generalCheckSendVaultDepositData(data);

        // Validate user
        generalCheckSendVaultDepositUser(data, user);

        // Get user deposit amount
        const amount = Math.floor(data.amount);

        // Update user in database
        const userDatabase = await prisma.user.update({
            where: { id: user.id },
            data: {
                balance: {
                    decrement: amount,
                },
                vaultAmount: {
                    increment: amount,
                },
            },
            select: {
                balance: true,
                vaultAmount: true,
            },
        });

        callback({ success: true, user: userDatabase });

        socketRemoveAntiSpam(user.id);
    } catch (err: any) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
}

export const generalSendVaultWithdrawSocket = async (io: Server, socket: Socket, user: User, data: VaultWithdrawData, callback: (response: any) => void) => {
    try {
        // Validate sent data
        generalCheckSendVaultWithdrawData(data);

        // Validate user
        generalCheckSendVaultWithdrawUser(data, user);

        // Get user withdraw amount
        const amount = Math.floor(data.amount);

        // Update user in database
        const userDatabase = await prisma.user.update({
            where: { id: user.id },
            data: {
                balance: {
                    increment: amount,
                },
                vaultAmount: {
                    decrement: amount,
                },
            },
            select: {
                balance: true,
                vaultAmount: true,
            },
        });

        callback({ success: true, user: userDatabase });

        socketRemoveAntiSpam(user.id);
    } catch (err: any) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
}

export const generalSendVaultLockSocket = async (io: Server, socket: Socket, user: User, data: VaultLockData, callback: (response: any) => void) => {
    try {
        // Validate sent data
        generalCheckSendVaultLockData(data);

        // Validate user
        generalCheckSendVaultLockUser(user);

        // Get vault lock time
        const time = Math.floor(data.time);

        // Update user in database
        const userDatabase = await prisma.user.update({
            where: { id: user.id },
            data: {
                vaultExpireAt: new Date(new Date().getTime() + time),
            },
            select: {
                balance: true,
                vaultAmount: true,
                vaultExpireAt: true,
            },
        });

        callback({ success: true, user: userDatabase });

        socketRemoveAntiSpam(user.id);
    } catch (err: any) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
}
