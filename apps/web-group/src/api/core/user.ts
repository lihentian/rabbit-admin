import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace UserApi {
  export interface MeResult {
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
}

function mapToUserInfo(data: UserApi.MeResult): UserInfo {
  return {
    avatar: data.avatar || '',
    desc: data.email || '',
    homePath: '/analytics',
    realName: data.nickname || data.username,
    roles: data.roleNames || [],
    token: '',
    userId: data.id,
    username: data.username,
  };
}

/**
 * 获取当前用户信息
 */
export async function getUserInfoApi() {
  const data = await requestClient.get<UserApi.MeResult>('/users/me');
  return mapToUserInfo(data);
}
