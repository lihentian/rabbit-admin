<script lang="ts" setup>
import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Copy } from '@vben/icons';

import { message } from 'antdv-next';

import { getTeamMemberAccount } from '#/api/jx3/team';
import { $t } from '#/locales';

const loading = ref(false);
const accountInfo = ref<Jx3TeamApi.MemberAccountInfo>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    if (!isOpen) {
      accountInfo.value = undefined;
      modalApi.setState({ title: '' });
      return;
    }
    modalApi.setState({ title: $t('jx3.team.viewAccountInfo') });
    const data = modalApi.getData<{ characterId: string; teamId: string }>();
    if (!data?.teamId || !data?.characterId) return;
    loading.value = true;
    try {
      accountInfo.value = await getTeamMemberAccount(data.teamId, data.characterId);
      modalApi.setState({ title: accountInfo.value.characterName });
    } finally {
      loading.value = false;
    }
  },
  footer: false,
  contentClass: 'px-5 pb-5 pt-1',
});

const serverLine = computed(() => {
  if (!accountInfo.value) return '—';
  const { gameArea, serverName } = accountInfo.value;
  return [gameArea, serverName || '—'].filter(Boolean).join(' · ');
});

const remarkText = computed(() => accountInfo.value?.remark?.trim() || '—');

async function copyText(text: string | undefined) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  message.success($t('ui.jsonViewer.copied'));
}

function copyAccount() {
  return copyText(accountInfo.value?.account);
}

function copyPassword() {
  return copyText(accountInfo.value?.password);
}

const infoRows = computed(() => {
  if (!accountInfo.value) return [];
  const rows = [
    {
      copyable: true,
      key: 'account',
      label: $t('jx3.account.name'),
      onCopy: copyAccount,
      value: accountInfo.value.account,
    },
    {
      copyable: true,
      key: 'password',
      label: $t('jx3.account.password'),
      onCopy: copyPassword,
      value: accountInfo.value.password,
    },
    {
      copyable: false,
      key: 'server',
      label: $t('jx3.team.gameServer'),
      value: serverLine.value,
    },
    {
      copyable: false,
      key: 'remark',
      label: $t('jx3.account.remark'),
      value: remarkText.value,
    },
  ];
  return rows;
});

function open(data: { characterId: string; teamId: string }) {
  modalApi.setData(data).open();
}

defineExpose({ open });
</script>

<template>
  <Modal :loading="loading" class="w-[420px]">
    <div v-if="accountInfo" class="account-card">
      <div
        v-for="row in infoRows"
        :key="row.key"
        class="account-item"
        :class="{ 'account-item--interactive': row.copyable }"
      >
        <span class="account-item-label">{{ row.label }}</span>
        <span class="account-item-value truncate">{{ row.value }}</span>
        <button
          v-if="row.copyable"
          type="button"
          class="account-copy-btn"
          :title="$t('ui.jsonViewer.copy')"
          @click="row.onCopy?.()"
        >
          <Copy class="size-4" />
        </button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.account-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-item {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 40px;
  padding: 0 2px;
  border-radius: 6px;
}

.account-item--interactive:hover {
  background: hsl(var(--accent) / 0.35);
}

.account-item-label {
  flex-shrink: 0;
  width: 56px;
  font-size: 14px;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
}

.account-item-value {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.4;
  color: hsl(var(--foreground));
}

.account-copy-btn {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: hsl(var(--primary));
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.account-copy-btn:hover {
  background: hsl(var(--primary) / 0.1);
}
</style>
