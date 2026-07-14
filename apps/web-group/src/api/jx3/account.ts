import type { Recordable } from '@vben/types';

import { type PageResult, toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace Jx3AccountApi {
  export interface AccountCharacterSpec {
    combatPower: number;
    id: string;
    isCw: number;
    specAlias: string;
    specIcon: string | null;
    specId: string;
  }

  export interface AccountCharacterBrief {
    bigIron: number;
    characterName: string;
    id: string;
    serverName: string | null;
    smallIron: number;
    specs: AccountCharacterSpec[];
  }

  export interface Account {
    account: string;
    characters?: AccountCharacterBrief[];
    id: string;
    password?: string;
    remark?: null | string;
    serviceId: string;
    serviceName?: string;
    userId: string;
  }

  export interface AccountFullSpec {
    combatPower: number;
    isCw?: boolean | number;
    specId: string;
  }

  export interface AccountFullCharacter {
    bigIron?: boolean | number;
    characterName: string;
    gameArea: string;
    gameServerId: string;
    smallIron?: boolean | number;
    specs: AccountFullSpec[];
  }

  export interface AccountFullPayload {
    account: string;
    characters: AccountFullCharacter[];
    password: string;
    remark?: string;
  }

  export interface AccountFullUpdateSpec extends AccountFullSpec {
    id?: string;
    specAlias?: string;
  }

  export interface AccountFullUpdateCharacter {
    bigIron?: boolean | number;
    characterName: string;
    gameArea: string;
    gameServerId: string;
    id?: string;
    serverName?: string | null;
    smallIron?: boolean | number;
    specs: AccountFullUpdateSpec[];
  }

  export interface AccountFullUpdatePayload {
    account: string;
    characters: AccountFullUpdateCharacter[];
    password: string;
    remark?: string;
  }

  export interface AccountDetail extends Omit<Account, 'characters'> {
    characters: AccountFullUpdateCharacter[];
  }

  export interface QuickImportRow {
    account: string;
    characterName: string;
    combatPower?: number;
    password: string;
    remark?: string;
    serverText: string;
    specText: string;
  }

  export type QuickImportAction = 'create' | 'skip' | 'update_remark';

  export interface QuickImportRowResult {
    action?: QuickImportAction;
    errors?: string[];
    resolved?: {
      combatPower: number;
      gameArea: string;
      gameServerId: string;
      serverName: string;
      specAlias: string;
      specId: string;
    };
    rowIndex: number;
    status: 'error' | 'valid';
  }

  export interface QuickImportResult {
    hasError: boolean;
    rows: QuickImportRowResult[];
    summary: {
      create: number;
      error: number;
      skip: number;
      updateRemark: number;
    };
  }
}

async function getAccountList(params: Recordable<any>) {
  const res = await requestClient.get<PageResult<Jx3AccountApi.Account>>(
    '/jx3/accounts',
    {
      params: toPageParams(params),
    },
  );
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

async function quickImportAccounts(rows: Jx3AccountApi.QuickImportRow[], dryRun = true) {
  return requestClient.post<Jx3AccountApi.QuickImportResult>('/jx3/accounts/quick-import', {
    dryRun,
    rows,
  });
}

export {
  createAccount,
  createAccountFull,
  deleteAccount,
  getAccountCharacters,
  getAccountDetail,
  getAccountForm,
  getAccountList,
  quickImportAccounts,
  updateAccount,
  updateAccountFull,
};
