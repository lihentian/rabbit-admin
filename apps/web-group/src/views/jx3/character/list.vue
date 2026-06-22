<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Jx3CharacterApi } from '#/api/jx3/character';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteCharacter, getCharacterList } from '#/api/jx3/character';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import DetailDrawer from './modules/detail-drawer.vue';
import Form from './modules/form.vue';

const detailDrawerRef = ref<InstanceType<typeof DetailDrawer>>();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: Jx3CharacterApi.Character) {
  formDrawerApi.setData(row).open();
}

function onCreate() {
  formDrawerApi.setData(null).open();
}

function onDetail(row: Jx3CharacterApi.Character) {
  detailDrawerRef.value?.open(row);
}

function onDelete(row: Jx3CharacterApi.Character) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.characterName]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteCharacter(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.characterName]),
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
}: OnActionClickParams<Jx3CharacterApi.Character>) {
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
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getCharacterList({
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
  } as VxeTableGridOptions<Jx3CharacterApi.Character>,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="refreshGrid" />
    <DetailDrawer ref="detailDrawerRef" />
    <Grid :table-title="$t('jx3.character.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('jx3.character.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
