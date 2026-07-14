<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Jx3AccountApi } from '#/api/jx3/account';

import type { FlatAccountRow } from './data';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Copy, Inbox, Plus } from '@vben/icons';

import { Button, message, Tooltip } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAccount, getAccountList } from '#/api/jx3/account';
import SpecIcon from '#/components/jx3/SpecIcon.vue';
import { useJx3AccountAccess } from '#/composables/use-jx3-account-access';
import { $t } from '#/locales';
import { formatCombatPowerLabel } from '#/utils/jx3/combat-power';

import { flattenAccounts, useColumns, useGridFormSchema } from './data';
import CoverBadge from '../team/modules/cover-badge.vue';
import DetailDrawer from './modules/detail-drawer.vue';
import Form from './modules/form.vue';
import QuickImportModal from './modules/quick-import-modal.vue';

const accountAccess = useJx3AccountAccess();
const detailDrawerRef = ref<InstanceType<typeof DetailDrawer>>();
const quickImportModalRef = ref<InstanceType<typeof QuickImportModal>>();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function toAccountRef(row: FlatAccountRow): Jx3AccountApi.Account {
  return {
    account: row.account,
    id: row.id,
    password: row.password,
    remark: row.remark,
    serviceId: row.serviceId,
    serviceName: row.serviceName,
    userId: row.userId,
  };
}

function onDetail(row: FlatAccountRow) {
  detailDrawerRef.value?.open(toAccountRef(row));
}

function onEdit(row: FlatAccountRow) {
  formDrawerApi.setData(toAccountRef(row)).open();
}

function onCreate() {
  formDrawerApi.setData(null).open();
}

function onQuickImport() {
  quickImportModalRef.value?.open();
}

function onDelete(row: FlatAccountRow) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.account]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteAccount(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.account]),
        key: 'action_process_msg',
      });
      refreshGrid();
    })
    .catch(() => {
      hideLoading();
    });
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<FlatAccountRow>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'detail': {
      onDetail(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

async function copyPassword(password?: string) {
  const text = password?.trim();
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    message.success($t('jx3.account.copySuccess'));
  } catch {
    message.error($t('jx3.account.copyFailed'));
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick, accountAccess),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const res = await getAccountList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
          return {
            items: flattenAccounts(res.items ?? []),
            total: res.total,
          };
        },
      },
    },
    rowConfig: { keyField: '_rowKey' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<FlatAccountRow>,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="refreshGrid" />
    <DetailDrawer ref="detailDrawerRef" />
    <QuickImportModal ref="quickImportModalRef" @success="refreshGrid" />
    <Grid :table-title="$t('jx3.account.list')">
      <template #password="{ row }: { row: FlatAccountRow }">
        <div class="flex min-w-0 items-center gap-1">
          <span class="account-password-text truncate font-mono" :title="row.password || ''">
            {{ row.password || '—' }}
          </span>
          <Tooltip v-if="row.password" :title="$t('jx3.account.copyPassword')">
            <button
              type="button"
              class="text-primary shrink-0 inline-flex size-6 items-center justify-center rounded transition-colors hover:bg-primary/10"
              @click="copyPassword(row.password)"
            >
              <Copy class="size-4" />
            </button>
          </Tooltip>
        </div>
      </template>

      <template #spec="{ row }: { row: FlatAccountRow }">
        <div v-if="row.specId" class="flex min-w-0 items-center gap-1.5">
          <SpecIcon
            :alt="row.specAlias"
            class="size-5 shrink-0 object-contain"
            :src="row.specIcon"
          />
          <span class="truncate">{{ row.specAlias }}</span>
          <span v-if="row.isCw" class="account-cw-tag shrink-0">
            {{ $t('jx3.dungeonTemplate.isCwShort') }}
          </span>
        </div>
        <span v-else>—</span>
      </template>

      <template #combatPower="{ row }: { row: FlatAccountRow }">
        <span v-if="row.combatPower !== undefined">
          {{ formatCombatPowerLabel(row.combatPower, $t('jx3.team.combatPowerUnit')) }}
        </span>
        <span v-else>—</span>
      </template>

      <template #covers="{ row }: { row: FlatAccountRow }">
        <div v-if="row.characterId" class="flex items-center justify-center gap-1">
          <CoverBadge
            v-if="row.smallIron"
            :label="$t('jx3.team.coverBadgeSmallIron')"
            size="menu"
          />
          <CoverBadge
            v-if="row.bigIron"
            :label="$t('jx3.team.coverBadgeBigIron')"
            size="menu"
          />
          <span v-if="!row.smallIron && !row.bigIron" class="text-muted-foreground">—</span>
        </div>
        <span v-else>—</span>
      </template>

      <template #toolbar-tools>
        <Button
          v-if="accountAccess.canCreate.value"
          class="mr-2"
          @click="onQuickImport"
        >
          <Inbox class="size-5" />
          {{ $t('jx3.account.quickImport') }}
        </Button>
        <Button
          v-if="accountAccess.canCreate.value"
          type="primary"
          @click="onCreate"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('jx3.account.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>

<style scoped>
.account-password-text {
  font-size: 13px;
  letter-spacing: 0.02em;
}

.account-cw-tag {
  padding: 0 4px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.4;
  color: #fff;
  background: linear-gradient(135deg, #ffb95c 0%, #f5a623 100%);
}
</style>
