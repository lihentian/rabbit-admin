import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace SystemRoleApi {
  export interface SystemRole {
    code: string;
    createTime?: string;
    dataScope?: number;
    dataScopeLabel?: string;
    deptIds?: string[];
    id: string;
    name: string;
    sort?: number;
    status: number;
  }
}

async function getRoleList(params: Recordable<any>) {
  const res = await requestClient.get('/roles', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getRoleForm(id: string) {
  return requestClient.get<SystemRoleApi.SystemRole>(`/roles/${id}/form`);
}

async function createRole(data: Recordable<any>) {
  return requestClient.post('/roles', data);
}

async function updateRole(id: string, data: Recordable<any>) {
  return requestClient.put(`/roles/${id}`, data);
}

async function updateRoleStatus(roleId: string, status: number) {
  return requestClient.put(`/roles/${roleId}/status`, null, {
    params: { status },
  });
}

async function deleteRole(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/roles/${idStr}`);
}

async function getRoleOptions() {
  return requestClient.get<Array<{ label: string; value: string }>>(
    '/roles/options',
  );
}

async function getRoleMenuIds(roleId: string) {
  return requestClient.get<string[]>(`/roles/${roleId}/menu-ids`);
}

async function updateRoleMenus(roleId: string, menuIds: string[]) {
  return requestClient.put(`/roles/${roleId}/menus`, menuIds);
}

export {
  createRole,
  deleteRole,
  getRoleForm,
  getRoleList,
  getRoleMenuIds,
  getRoleOptions,
  updateRole,
  updateRoleMenus,
  updateRoleStatus,
};
