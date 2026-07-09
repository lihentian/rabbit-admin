import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'antdv-next';
import { defineStore } from 'pinia';

import { getUserInfoApi, loginApi, logoutApi, type AuthApi } from '#/api';
import { cleanupSse, useSse } from '#/composables/use-sse';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  async function authLogin(params: Recordable<any>, onSuccess?: () => Promise<void> | void) {
    let userInfo: null | UserInfo = null;
    const loginParams: AuthApi.LoginParams = {
      captchaCode: params.captchaCode,
      captchaId: params.captchaId,
      password: params.password,
      username: params.username,
    };
    try {
      loginLoading.value = true;
      const { accessToken, refreshToken } = await loginApi(loginParams);

      if (accessToken) {
        accessStore.setAccessToken(accessToken);
        if (refreshToken) {
          accessStore.setRefreshToken(refreshToken);
        }
        useSse().connect();

        const fetchUserInfoResult = await fetchUserInfo();
        userInfo = fetchUserInfoResult;

        userStore.setUserInfo(userInfo);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(userInfo.homePath || preferences.app.defaultHomePath);
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3,
            title: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    cleanupSse();
    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
