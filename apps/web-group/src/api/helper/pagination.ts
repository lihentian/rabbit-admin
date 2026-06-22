import type { Recordable } from '@vben/types';

export interface PageResult<T> {
  data: T[];
  page: {
    pageNum: number;
    pageSize: number;
    total: number;
  };
}

export interface VxePageResult<T> {
  items: T[];
  total: number;
}

export function toPageResult<T>(res: PageResult<T>): VxePageResult<T> {
  return {
    items: res.data,
    total: res.page.total,
  };
}

export function toPageParams(params: Recordable<any>) {
  const { page, pageSize, pageNum, keywords, ...rest } = params;
  return {
    pageNum: pageNum ?? page ?? 1,
    pageSize: pageSize ?? 10,
    keywords,
    ...rest,
  };
}
