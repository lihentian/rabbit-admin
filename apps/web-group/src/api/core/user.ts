import type { UserInfo } from '@vben/types';

import { useAccessStore } from '@vben/stores';

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
    perms?: string[];
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
  const accessStore = useAccessStore();
  accessStore.setAccessCodes(data.perms ?? []);
  return mapToUserInfo(data);
}
