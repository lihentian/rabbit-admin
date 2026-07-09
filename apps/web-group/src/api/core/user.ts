import type { UserInfo } from '@vben/types';

import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';

/** 与 sys_role.name 对齐（JX3_STAFF） */
const JX3_STAFF_ROLE_NAME = '客服';
const JX3_STAFF_HOME_PATH = '/jx3/team';

function resolveHomePath(roleNames?: string[]): string {
  if (roleNames?.includes(JX3_STAFF_ROLE_NAME)) {
    return JX3_STAFF_HOME_PATH;
  }
  return preferences.app.defaultHomePath;
}

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
    homePath: resolveHomePath(data.roleNames),
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
