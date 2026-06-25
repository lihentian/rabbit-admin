import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemMenuApi {
  export interface Menu {
    alwaysShow?: number;
    children?: Menu[];
    component?: string;
    icon?: string;
    id: string;
    keepAlive?: number;
    name: string;
    parentId: string;
    perm?: string;
    redirect?: string;
    routeName?: string;
    routePath?: string;
    sort?: number;
    type: 'B' | 'C' | 'M';
    visible?: number;
  }

  export interface MenuForm extends Omit<Menu, 'children' | 'id'> {
    id?: string;
    params?: Array<{ key: string; value: string }> | null;
  }
}

async function getMenuList(keywords?: string) {
  return requestClient.get<SystemMenuApi.Menu[]>('/menus', {
    params: { keywords },
  });
}

async function getMenuOptions() {
  return requestClient.get<Array<{ label: string; value: string; children?: unknown[] }>>(
    '/menus/options',
  );
}

async function getMenuForm(id: string) {
  return requestClient.get<SystemMenuApi.MenuForm>(`/menus/${id}/form`);
}

async function createMenu(data: Recordable<any>) {
  return requestClient.post('/menus', data);
}

async function updateMenu(id: string, data: Recordable<any>) {
  return requestClient.put(`/menus/${id}`, data);
}

async function deleteMenu(id: string) {
  return requestClient.delete(`/menus/${id}`);
}

export {
  createMenu,
  deleteMenu,
  getMenuForm,
  getMenuList,
  getMenuOptions,
  updateMenu,
};
