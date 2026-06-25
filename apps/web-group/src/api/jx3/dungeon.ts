import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace Jx3DungeonApi {
  export interface Dungeon {
    dungeonName: string;
    id: string;
    playerCount: number;
    price: number;
    seniority: number;
    version: string;
    remark?: null | string;
  }

  export interface DungeonOption {
    label: string;
    playerCount: number;
    price: number;
    seniority: number;
    value: string;
    version: string;
  }
}

async function getDungeonList(params: Recordable<any>) {
  const res = await requestClient.get('/jx3/dungeons', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getDungeonForm(id: string) {
  return requestClient.get<Jx3DungeonApi.Dungeon>(`/jx3/dungeons/${id}/form`);
}

async function createDungeon(data: Recordable<any>) {
  return requestClient.post('/jx3/dungeons', data);
}

async function updateDungeon(id: string, data: Recordable<any>) {
  return requestClient.put(`/jx3/dungeons/${id}`, data);
}

async function deleteDungeon(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/jx3/dungeons/${idStr}`);
}

async function getDungeonOptions(playerCount?: number) {
  return requestClient.get<Jx3DungeonApi.DungeonOption[]>('/jx3/dungeons/options', {
    params: playerCount === undefined ? undefined : { playerCount },
  });
}

export {
  createDungeon,
  deleteDungeon,
  getDungeonForm,
  getDungeonList,
  getDungeonOptions,
  updateDungeon,
};
