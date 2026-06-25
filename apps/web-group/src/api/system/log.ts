import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace SystemLogApi {
  export interface Log {
    actionType?: string;
    browser?: string;
    content?: string;
    createTime?: string;
    device?: string;
    errorMsg?: string;
    executionTime?: number;
    id: string;
    ip?: string;
    module?: string;
    operatorId?: string;
    operatorName?: string;
    os?: string;
    region?: string;
    requestMethod?: string;
    requestUri?: string;
    status?: number;
    title?: string;
  }
}

async function getLogList(params: Recordable<any>) {
  const res = await requestClient.get('/logs', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

export { getLogList };
