import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace SystemConfigApi {
  export interface Config {
    configKey: string;
    configName: string;
    configValue: string;
    id: string;
    remark?: string;
  }
}

async function getConfigList(params: Recordable<any>) {
  const res = await requestClient.get('/configs', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getConfigForm(id: string) {
  return requestClient.get<SystemConfigApi.Config>(`/configs/${id}/form`);
}

async function createConfig(data: Recordable<any>) {
  return requestClient.post('/configs', data);
}

async function updateConfig(id: string, data: Recordable<any>) {
  return requestClient.put(`/configs/${id}`, data);
}

async function deleteConfig(id: string) {
  return requestClient.delete(`/configs/${id}`);
}

async function refreshConfigCache() {
  return requestClient.put('/configs/refresh');
}

export {
  createConfig,
  deleteConfig,
  getConfigForm,
  getConfigList,
  refreshConfigCache,
  updateConfig,
};
