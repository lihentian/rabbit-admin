<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Jx3AccountApi } from '#/api/jx3/account';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus, Inbox, Download } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAccount, getAccountList } from '#/api/jx3/account';
import { useJx3AccountAccess } from '#/composables/use-jx3-account-access';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
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

function onDetail(row: Jx3AccountApi.Account) {
  detailDrawerRef.value?.open(row);
}

function onEdit(row: Jx3AccountApi.Account) {
  formDrawerApi.setData(row).open();
}

function onCreate() {
  formDrawerApi.setData(null).open();
}

function onQuickImport() {
  quickImportModalRef.value?.open();
}

function onDelete(row: Jx3AccountApi.Account) {
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
}: OnActionClickParams<Jx3AccountApi.Account>) {
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
          return await getAccountList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<Jx3AccountApi.Account>,
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
