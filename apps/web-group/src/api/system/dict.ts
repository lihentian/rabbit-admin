import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace SystemDictApi {
  export interface Dict {
    dictCode: string;
    id: string;
    name: string;
    remark?: string;
    status: number;
  }

  export interface DictItem {
    dictCode?: string;
    id: string;
    label: string;
    remark?: string;
    sort?: number;
    status: number;
    tagType?: string;
    value: string;
  }
}

async function getDictList(params: Recordable<any>) {
  const res = await requestClient.get('/dicts', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getDictForm(id: string) {
  return requestClient.get<SystemDictApi.Dict>(`/dicts/${id}/form`);
}

async function createDict(data: Recordable<any>) {
  return requestClient.post('/dicts', data);
}

async function updateDict(id: string, data: Recordable<any>) {
  return requestClient.put(`/dicts/${id}`, data);
}

async function deleteDict(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/dicts/${idStr}`);
}

async function getDictItemList(dictCode: string, params: Recordable<any>) {
  const res = await requestClient.get(`/dicts/${dictCode}/items`, {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getDictItemForm(dictCode: string, itemId: string) {
  return requestClient.get<SystemDictApi.DictItem>(
    `/dicts/${dictCode}/items/${itemId}/form`,
  );
}

async function createDictItem(dictCode: string, data: Recordable<any>) {
  return requestClient.post(`/dicts/${dictCode}/items`, data);
}

async function updateDictItem(
  dictCode: string,
  itemId: string,
  data: Recordable<any>,
) {
  return requestClient.put(`/dicts/${dictCode}/items/${itemId}`, data);
}

async function deleteDictItem(
  dictCode: string,
  itemIds: string | string[],
) {
  const idStr = Array.isArray(itemIds) ? itemIds.join(',') : itemIds;
  return requestClient.delete(`/dicts/${dictCode}/items/${idStr}`);
}

async function getDictItemOptions(dictCode: string) {
  return requestClient.get<Array<{ label: string; value: string }>>(
    `/dicts/${dictCode}/items/options`,
  );
}

export {
  createDict,
  createDictItem,
  deleteDict,
  deleteDictItem,
  getDictForm,
  getDictItemForm,
  getDictItemList,
  getDictItemOptions,
  getDictList,
  updateDict,
  updateDictItem,
};
