import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

/** 获取当前用户动态路由 */
export async function getAllMenusApi() {
  return requestClient.get<RouteRecordStringComponent[]>('/menus/routes');
}
