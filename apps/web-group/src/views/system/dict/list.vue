<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemDictApi } from '#/api/system/dict';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDict, getDictList } from '#/api/system/dict';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import ItemDrawer from './modules/item-drawer.vue';

const itemDrawerRef = ref<InstanceType<typeof ItemDrawer>>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: SystemDictApi.Dict) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData(null).open();
}

function onDelete(row: SystemDictApi.Dict) {
  deleteDict(row.id).then(() => {
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    refreshGrid();
  });
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemDictApi.Dict>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'items': {
      itemDrawerRef.value?.open(row);
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
          return await getDictList({
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
  } as VxeTableGridOptions<SystemDictApi.Dict>,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <ItemDrawer ref="itemDrawerRef" />
    <Grid :table-title="$t('system.dict.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.dict.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
