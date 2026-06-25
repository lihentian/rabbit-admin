<script lang="ts" setup>
import { computed, onBeforeMount, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { useNoticeDropdown } from '#/composables/use-notice';
import { cleanupSse } from '#/composables/use-sse';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();

const {
  handleClear,
  handleClick,
  handleMakeAll,
  handleMarkRead,
  handleRemove,
  notifications,
  showDot,
  viewAll,
} = useNoticeDropdown();

const menus = computed(() => [
  {
    handler: () => router.push({ name: 'MyNotice' }),
    icon: 'mdi:bell-outline',
    text: $t('system.notice.myList'),
  },
]);

const avatar = computed(
  () => userStore.userInfo?.avatar ?? preferences.app.defaultAvatar,
);

async function handleLogout() {
  cleanupSse();
  await authStore.logout(false);
}

watch(
  () => ({
    content: preferences.app.watermarkContent,
    enable: preferences.app.watermark,
    isDark: isDark.value,
  }),
  async ({ content, enable, isDark: isDarkValue }) => {
    if (enable) {
      const watermarkColor = isDarkValue
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)';
      await updateWatermark({
        advancedStyle: {
          colorStops: [
            { color: watermarkColor, offset: 0 },
            { color: watermarkColor, offset: 1 },
          ],
          type: 'linear',
        },
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  { immediate: true },
);

onBeforeMount(() => {
  if (preferences.app.watermark) {
    destroyWatermark();
  }
});
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        trigger="both"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleClear"
        @make-all="handleMakeAll"
        @on-click="handleClick"
        @read="(item) => item.id && handleMarkRead(item.id)"
        @remove="(item) => item.id && handleRemove(item.id)"
        @view-all="viewAll"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
