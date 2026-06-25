import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace Jx3SectApi {
  export interface Sect {
    id: string;
    sectName: string;
    sort?: number;
  }
}

async function getSectList(params: Recordable<any>) {
  const res = await requestClient.get('/jx3/sects', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getSectForm(id: string) {
  return requestClient.get<Jx3SectApi.Sect>(`/jx3/sects/${id}/form`);
}

async function createSect(data: Recordable<any>) {
  return requestClient.post('/jx3/sects', data);
}

async function updateSect(id: string, data: Recordable<any>) {
  return requestClient.put(`/jx3/sects/${id}`, data);
}

async function deleteSect(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/jx3/sects/${idStr}`);
}

async function getSectOptions() {
  return requestClient.get<Array<{ label: string; value: string }>>(
    '/jx3/sects/options',
  );
}

export {
  createSect,
  deleteSect,
  getSectForm,
  getSectList,
  getSectOptions,
  updateSect,
};
