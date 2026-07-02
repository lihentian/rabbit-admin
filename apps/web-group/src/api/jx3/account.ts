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

  export interface AccountFullSpec {
    combatPower: number;
    isCw?: boolean | number;
    specId: string;
  }

  export interface AccountFullCharacter {
    characterName: string;
    gameArea: string;
    gameServerId: string;
    specs: AccountFullSpec[];
  }

  export interface AccountFullPayload {
    account: string;
    characters: AccountFullCharacter[];
    password: string;
    remark?: string;
    serviceId: string;
    userId: string;
  }

  export interface AccountFullUpdateSpec extends AccountFullSpec {
    id?: string;
    specAlias?: string;
  }

  export interface AccountFullUpdateCharacter {
    characterName: string;
    gameArea: string;
    gameServerId: string;
    id?: string;
    serverName?: string | null;
    specs: AccountFullUpdateSpec[];
  }

  export interface AccountFullUpdatePayload {
    account: string;
    characters: AccountFullUpdateCharacter[];
    password: string;
    remark?: string;
    serviceId: string;
    userId: string;
  }

  export interface AccountDetail extends Account {
    characters: AccountFullUpdateCharacter[];
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

async function getAccountDetail(id: string) {
  return requestClient.get<Jx3AccountApi.AccountDetail>(
    `/jx3/accounts/${id}/detail`,
  );
}

async function getAccountCharacters(id: string) {
  return requestClient.get<Jx3AccountApi.AccountFullUpdateCharacter[]>(
    `/jx3/accounts/${id}/characters`,
  );
}

async function createAccount(data: Recordable<any>) {
  return requestClient.post('/jx3/accounts', data);
}

async function createAccountFull(data: Jx3AccountApi.AccountFullPayload) {
  return requestClient.post('/jx3/accounts/full', data);
}

async function updateAccount(id: string, data: Recordable<any>) {
  return requestClient.put(`/jx3/accounts/${id}`, data);
}

async function updateAccountFull(id: string, data: Jx3AccountApi.AccountFullUpdatePayload) {
  return requestClient.put(`/jx3/accounts/${id}/full`, data);
}

async function deleteAccount(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/jx3/accounts/${idStr}`);
}

export {
  createAccount,
  createAccountFull,
  deleteAccount,
  getAccountCharacters,
  getAccountDetail,
  getAccountForm,
  getAccountList,
  updateAccount,
  updateAccountFull,
};
