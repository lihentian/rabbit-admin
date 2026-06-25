import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemDeptApi {
  export interface Dept {
    children?: Dept[];
    code: string;
    id: string;
    name: string;
    parentId: string;
    sort?: number;
    status: number;
  }

  export interface DeptForm extends Omit<Dept, 'children'> {
    id?: string;
  }
}

async function getDeptList(params?: Recordable<any>) {
  return requestClient.get<SystemDeptApi.Dept[]>('/depts', { params });
}

async function getDeptOptions() {
  return requestClient.get<Array<{ label: string; value: string; children?: unknown[] }>>(
    '/depts/options',
  );
}

async function getDeptForm(id: string) {
  return requestClient.get<SystemDeptApi.DeptForm>(`/depts/${id}/form`);
}

async function createDept(data: Recordable<any>) {
  return requestClient.post('/depts', data);
}

async function updateDept(id: string, data: Recordable<any>) {
  return requestClient.put(`/depts/${id}`, data);
}

async function deleteDept(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/depts/${idStr}`);
}

export {
  createDept,
  deleteDept,
  getDeptForm,
  getDeptList,
  getDeptOptions,
  updateDept,
};
