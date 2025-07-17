import { User } from '@prisma/client';

export const generalCheckSendVaultDepositData = (data: any) => {
  if (data === undefined || data === null) {
    throw new Error('Something went wrong! Please try again in a few seconds.');
  } else if (data.amount === undefined || data.amount === null || isNaN(data.amount) === true || Math.floor(data.amount) <= 0) {
    throw new Error('You’ve entered an invalid deposit amount.');
  }
};

export const generalCheckSendVaultDepositUser = (data: any, user: User) => {
  if (user.balance < Math.floor(data.amount)) {
    throw new Error('You don’t have enough balance for this action.');
  } else if (new Date(user.vault.expireAt).getTime() >= new Date().getTime()) {
    throw new Error('You can’t deposit because your vault is locked.');
  }
};

export const generalCheckSendVaultWithdrawData = (data: any) => {
  if (data === undefined || data === null) {
    throw new Error('Something went wrong! Please try again in a few seconds.');
  } else if (data.amount === undefined || data.amount === null || isNaN(data.amount) === true || Math.floor(data.amount) <= 0) {
    throw new Error('You’ve entered an invalid withdraw amount.');
  }
};

export const generalCheckSendVaultWithdrawUser = (data: any, user: User) => {
  if (user.vault.amount < Math.floor(data.amount)) {
    throw new Error('You don’t have enough balance in the vault for this action.');
  } else if (new Date(user.vault.expireAt).getTime() >= new Date().getTime()) {
    throw new Error('You can’t withdraw because your vault is locked.');
  }
};

export const generalCheckSendVaultLockData = (data: any) => {
  if (data === undefined || data === null) {
    throw new Error('Something went wrong! Please try again in a few seconds.');
  } else if (data.time === undefined || data.time === null || isNaN(data.time) === true || Math.floor(data.time) <= 0) {
    throw new Error('You’ve entered an invalid lock time.');
  }
};

export const generalCheckSendVaultLockUser = (user: User) => {
  if (new Date(user.vault.expireAt).getTime() >= new Date().getTime()) {
    throw new Error('You can’t lock because your vault is already locked.');
  }
};
