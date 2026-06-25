<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDept, getDeptList } from '#/api/system/dept';
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

function onAppend(row: SystemDeptApi.Dept) {
  formModalApi.setData({ parentId: row.id }).open();
}

function onEdit(row: SystemDeptApi.Dept) {
  formModalApi.setData(row).open();
}

function onDelete(row: SystemDeptApi.Dept) {
  deleteDept(row.id).then(() => {
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    refreshGrid();
  });
}

function onActionClick({ code, row }: OnActionClickParams<SystemDeptApi.Dept>) {
  switch (code) {
    case 'append': {
      onAppend(row);
      break;
    }
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
  class: 'min-h-0 flex-1 overflow-hidden',
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: '100%',
    keepSource: true,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async (_params, formValues) => {
          return await getDeptList(formValues);
        },
      },
    },
    rowConfig: { keyField: 'id' },
    scrollY: { enabled: true, gt: 0 },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
    treeConfig: {
      childrenField: 'children',
      parentField: 'parentId',
      rowField: 'id',
      transform: false,
    },
  } as VxeTableGridOptions<SystemDeptApi.Dept>,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <div class="flex h-full min-h-0 flex-col">
      <Grid :table-title="$t('system.dept.list')">
        <template #toolbar-tools>
          <Button type="primary" @click="onCreate">
            <Plus class="size-5" />
            {{ $t('ui.actionTitle.create', [$t('system.dept.name')]) }}
          </Button>
        </template>
      </Grid>
    </div>
  </Page>
</template>
