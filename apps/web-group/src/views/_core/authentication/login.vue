<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, markRaw, useTemplateRef } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';

import { useAuthStore } from '#/store';

import ImageCaptchaField from './ImageCaptchaField.vue';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const loginRef =
  useTemplateRef<InstanceType<typeof AuthenticationLogin>>('loginRef');

const loginTitle = '欢迎回来 👋🏻';
const loginSubTitle = computed(
  () => `请输入账号和密码以登录${preferences.app.name}`,
);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'username',
        name: 'username',
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        autocomplete: 'current-password',
        name: 'password',
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(ImageCaptchaField),
      fieldName: 'captchaCode',
      label: $t('authentication.code'),
      rules: z.string().min(1, { message: '请输入验证码' }),
    },
  ];
});

async function onSubmit(values: Recordable<any>) {
  const formApi = loginRef.value?.getFormApi();
  const captchaFieldRef = formApi
    ?.getFieldComponentRef<InstanceType<typeof ImageCaptchaField>>('captchaCode');

  try {
    await authStore.authLogin({
      captchaCode: values.captchaCode,
      captchaId: captchaFieldRef?.getCaptchaId() ?? '',
      password: values.password,
      username: values.username,
    });
  } catch {
    captchaFieldRef?.refresh();
    formApi?.setFieldValue('captchaCode', '', false);
  }
}
</script>

<template>
  <AuthenticationLogin
    ref="loginRef"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :sub-title="loginSubTitle"
    :title="loginTitle"
    @submit="onSubmit"
  />
</template>
