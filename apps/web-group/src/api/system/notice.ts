import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace SystemNoticeApi {
  export interface Notice {
    content?: string;
    createTime?: string;
    id: string;
    isRead?: number;
    level?: string;
    publishStatus?: number;
    publishTime?: string;
    publisherName?: string;
    revokeTime?: string;
    targetType?: number;
    title: string;
    type?: number;
  }

  export interface NoticeForm {
    content: string;
    id?: string;
    level: string;
    targetType: number;
    targetUserIds?: string[];
    title: string;
    type: number;
  }
}

async function getNoticeList(params: Recordable<any>) {
  const res = await requestClient.get('/notices', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getMyNoticeList(params: Recordable<any>) {
  const res = await requestClient.get('/notices/my', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getNoticeForm(id: string) {
  return requestClient.get<SystemNoticeApi.NoticeForm>(`/notices/${id}/form`);
}

async function getNoticeDetail(id: string) {
  return requestClient.get<SystemNoticeApi.Notice>(`/notices/${id}/detail`);
}

async function createNotice(data: Recordable<any>) {
  return requestClient.post('/notices', data);
}

async function updateNotice(id: string, data: Recordable<any>) {
  return requestClient.put(`/notices/${id}`, data);
}

async function deleteNotice(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/notices/${idStr}`);
}

async function publishNotice(id: string) {
  return requestClient.put(`/notices/${id}/publish`);
}

async function revokeNotice(id: string) {
  return requestClient.put(`/notices/${id}/revoke`);
}

async function readAllNotices() {
  return requestClient.put('/notices/read-all');
}

export {
  createNotice,
  deleteNotice,
  getMyNoticeList,
  getNoticeDetail,
  getNoticeForm,
  getNoticeList,
  publishNotice,
  readAllNotices,
  revokeNotice,
  updateNotice,
};
