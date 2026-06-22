import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  export interface SystemUser {
    avatar?: string;
    createTime?: string;
    email?: string;
    gender?: number;
    id: string;
    mobile?: string;
    nickname: string;
    roleIds?: string[];
    roleNames?: string[];
    status: number;
    username: string;
  }

  export interface UserForm extends SystemUser {
    password?: string;
  }
}

async function getUserList(params: Recordable<any>) {
  const res = await requestClient.get('/users', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getUserForm(id: string) {
  return requestClient.get<SystemUserApi.UserForm>(`/users/${id}/form`);
}

async function createUser(data: Recordable<any>) {
  return requestClient.post('/users', data);
}

async function updateUser(id: string, data: Recordable<any>) {
  return requestClient.put(`/users/${id}`, data);
}

async function resetUserPassword(id: string, password: string) {
  return requestClient.put(`/users/${id}/password`, { password });
}

async function deleteUser(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/users/${idStr}`);
}

async function getUserOptions(keywords?: string) {
  return requestClient.get<Array<{ label: string; value: string }>>(
    '/users/options',
    { params: { keywords } },
  );
}

export {
  createUser,
  deleteUser,
  getUserForm,
  getUserList,
  getUserOptions,
  resetUserPassword,
  updateUser,
};
