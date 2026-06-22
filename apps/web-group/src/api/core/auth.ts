import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  export interface LoginParams {
    captchaCode?: string;
    captchaId?: string;
    password?: string;
    username?: string;
  }

  export interface LoginResult {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    tokenType: string;
  }

  export interface CaptchaResult {
    captchaBase64: string;
    captchaId: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * 获取验证码
 */
export async function getCaptchaApi() {
  return requestClient.get<AuthApi.CaptchaResult>('/auth/captcha');
}

/**
 * 刷新 accessToken
 */
export async function refreshTokenApi(refreshToken: string) {
  const response = await baseRequestClient.post('/auth/refresh-token', null, {
    params: { refreshToken },
    responseReturn: 'body',
  });
  const body = response as { code: string; data: AuthApi.LoginResult; msg: string };
  if (body.code === '00000') {
    return body.data;
  }
  throw new Error(body.msg || '刷新 Token 失败');
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.delete('/auth/logout');
}
