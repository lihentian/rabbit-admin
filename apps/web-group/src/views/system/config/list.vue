<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemConfigApi } from '#/api/system/config';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteConfig,
  getConfigList,
  refreshConfigCache,
} from '#/api/system/config';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onCreate() {
  formModalApi.setData(null).open();
}

function onEdit(row: SystemConfigApi.Config) {
  formModalApi.setData(row).open();
}

function onDelete(row: SystemConfigApi.Config) {
  deleteConfig(row.id).then(() => {
    message.success($t('ui.actionMessage.deleteSuccess', [row.configName]));
    refreshGrid();
  });
}

function onRefreshCache() {
  refreshConfigCache().then(() => {
    message.success($t('system.config.refreshSuccess'));
  });
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemConfigApi.Config>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
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
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getConfigList({
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
  } as VxeTableGridOptions<SystemConfigApi.Config>,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid :table-title="$t('system.config.list')">
      <template #toolbar-tools>
        <Button class="mr-2" @click="onRefreshCache">
          {{ $t('system.config.refreshCache') }}
        </Button>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.config.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
