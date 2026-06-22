import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace Jx3GameServerApi {
  export interface GameServer {
    alias?: string;
    gameArea: string;
    id: string;
    serverName: string;
    sort?: number;
  }
}

async function getGameServerList(params: Recordable<any>) {
  const res = await requestClient.get('/jx3/game-servers', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getGameServerForm(id: string) {
  return requestClient.get<Jx3GameServerApi.GameServer>(
    `/jx3/game-servers/${id}/form`,
  );
}

async function createGameServer(data: Recordable<any>) {
  return requestClient.post('/jx3/game-servers', data);
}

async function updateGameServer(id: string, data: Recordable<any>) {
  return requestClient.put(`/jx3/game-servers/${id}`, data);
}

async function deleteGameServer(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/jx3/game-servers/${idStr}`);
}

async function getGameServerOptions(gameArea?: string) {
  return requestClient.get<
    Array<{ gameArea: string; label: string; value: string }>
  >('/jx3/game-servers/options', { params: { gameArea } });
}

export {
  createGameServer,
  deleteGameServer,
  getGameServerForm,
  getGameServerList,
  getGameServerOptions,
  updateGameServer,
};
