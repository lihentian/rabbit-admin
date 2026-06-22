import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace Jx3SpecApi {
  export interface Spec {
    alias?: string;
    attackType?: number | null;
    id: string;
    position: string;
    sectName: string;
    sort?: number;
    specName: string;
  }
}

async function getSpecList(params: Recordable<any>) {
  const res = await requestClient.get('/jx3/specs', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getSpecForm(id: string) {
  return requestClient.get<Jx3SpecApi.Spec>(`/jx3/specs/${id}/form`);
}

async function createSpec(data: Recordable<any>) {
  return requestClient.post('/jx3/specs', data);
}

async function updateSpec(id: string, data: Recordable<any>) {
  return requestClient.put(`/jx3/specs/${id}`, data);
}

async function deleteSpec(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/jx3/specs/${idStr}`);
}

async function getSpecOptions(position?: string) {
  return requestClient.get<
    Array<{ label: string; position: string; sectName: string; value: string }>
  >('/jx3/specs/options', { params: { position } });
}

export {
  createSpec,
  deleteSpec,
  getSpecForm,
  getSpecList,
  getSpecOptions,
  updateSpec,
};
