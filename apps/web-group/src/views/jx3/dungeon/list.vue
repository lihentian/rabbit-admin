<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Jx3DungeonApi } from '#/api/jx3/dungeon';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDungeon, getDungeonList } from '#/api/jx3/dungeon';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: Jx3DungeonApi.Dungeon) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData(null).open();
}

function onDelete(row: Jx3DungeonApi.Dungeon) {
  deleteDungeon(row.id).then(() => {
    message.success(
      $t('ui.actionMessage.deleteSuccess', [row.dungeonName]),
    );
    refreshGrid();
  });
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<Jx3DungeonApi.Dungeon>) {
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
          return await getDungeonList({
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
  } as VxeTableGridOptions<Jx3DungeonApi.Dungeon>,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid :table-title="$t('jx3.dungeon.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('jx3.dungeon.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
