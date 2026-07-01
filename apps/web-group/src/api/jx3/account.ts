import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace Jx3AccountApi {
  export interface Account {
    account: string;
    id: string;
    password?: string;
    remark?: null | string;
    serviceId: string;
    userId: string;
  }
}

async function getAccountList(params: Recordable<any>) {
  const res = await requestClient.get('/jx3/accounts', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getAccountForm(id: string) {
  return requestClient.get<Jx3AccountApi.Account>(
    `/jx3/accounts/${id}/form`,
  );
}

async function createAccount(data: Recordable<any>) {
  return requestClient.post('/jx3/accounts', data);
}

async function updateAccount(id: string, data: Recordable<any>) {
  return requestClient.put(`/jx3/accounts/${id}`, data);
}

async function resetAccountPassword(id: string, password: string) {
  return requestClient.put(`/jx3/accounts/${id}/password`, { password });
}

async function deleteAccount(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/jx3/accounts/${idStr}`);
}

export {
  createAccount,
  deleteAccount,
  getAccountForm,
  getAccountList,
  resetAccountPassword,
  updateAccount,
};
