import { WebSocketRouter } from 'bun-ws-router';
import {
    duelsGetData,
    duelsGetGameDataSocket,
    duelsSendCreateSocket,
    duelsSendBotSocket,
    duelsSendJoinSocket,
    duelsSendCancelSocket,
    duelsInit
} from './duels.controller';
import {
    GetDuelsDataMessage,
    CreateDuelMessage,
    JoinDuelMessage,
    CancelDuelMessage,
    CallBotMessage
} from './duels.schema';
import type { AppSocketData } from './duels.types';
import { User } from '../../client';

export const duelsRouter = new WebSocketRouter<AppSocketData>();

duelsRouter.onOpen((ctx) => {
    console.log(`Client connected: ${ctx.ws.data.clientId}`);
    ctx.ws.subscribe('duels');
    const duelsData = duelsGetData();
    ctx.send(duelsData as any);
});

duelsRouter.onClose((ctx) => {
    console.log(`Client disconnected: ${ctx.ws.data.clientId}`);
    ctx.ws.unsubscribe('duels');
});

duelsRouter.onMessage(GetDuelsDataMessage, (ctx) => {
    const duelsData = duelsGetData();
    ctx.send(duelsData as any);
});

duelsRouter.onMessage(CreateDuelMessage, (ctx, msg) => {
    duelsSendCreateSocket(ctx, msg.payload);
});

duelsRouter.onMessage(JoinDuelMessage, (ctx, msg) => {
    duelsSendJoinSocket(ctx, msg.payload);
});

duelsRouter.onMessage(CancelDuelMessage, (ctx, msg) => {
    duelsSendCancelSocket(ctx, msg.payload);
});

duelsRouter.onMessage(CallBotMessage, (ctx, msg) => {
    duelsSendBotSocket(ctx, msg.payload);
});

export const initDuels = (server: any) => {
    duelsInit(server);
};
