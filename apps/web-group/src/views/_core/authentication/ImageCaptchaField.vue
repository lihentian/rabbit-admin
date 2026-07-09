<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, Spin } from 'antdv-next';

import { getCaptchaApi } from '#/api';

defineOptions({ name: 'ImageCaptchaField' });

const captchaCode = defineModel<string>({ default: '' });

const captchaId = ref('');
const captchaBase64 = ref('');
const loading = ref(false);

async function refresh() {
  loading.value = true;
  captchaCode.value = '';
  try {
    const data = await getCaptchaApi();
    captchaId.value = data.captchaId;
    captchaBase64.value = data.captchaBase64;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void refresh();
});

defineExpose({
  getCaptchaId: () => captchaId.value,
  refresh,
});
</script>

<template>
  <div class="flex w-full gap-3">
    <Input
      v-model:value="captchaCode"
      allow-clear
      autocomplete="off"
      class="min-w-0 flex-1"
      name="captchaCode"
      placeholder="验证码"
    />
    <button
      :aria-label="'刷新验证码'"
      class="border-border bg-background flex h-8 w-[140px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border"
      type="button"
      @click="refresh"
    >
      <Spin v-if="loading" size="small" />
      <img
        v-else-if="captchaBase64"
        :src="captchaBase64"
        alt="验证码"
        class="h-full w-full object-cover"
      />
      <IconifyIcon v-else class="text-muted-foreground size-4" icon="lucide:refresh-cw" />
    </button>
  </div>
</template>
