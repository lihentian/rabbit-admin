<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Jx3TeamApi } from '#/api/jx3/team';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTeam, getTeamList } from '#/api/jx3/team';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import MemberDrawer from './modules/member-drawer.vue';

const memberDrawerRef = ref<InstanceType<typeof MemberDrawer>>();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: Jx3TeamApi.Team) {
  formDrawerApi.setData(row).open();
}

function onCreate() {
  formDrawerApi.setData(null).open();
}

function onMembers(row: Jx3TeamApi.Team) {
  memberDrawerRef.value?.open(row);
}

function onDelete(row: Jx3TeamApi.Team) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.teamName]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteTeam(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.teamName]),
        key: 'action_process_msg',
      });
      refreshGrid();
    })
    .catch(() => {
      hideLoading();
    });
}

function onActionClick({ code, row }: OnActionClickParams<Jx3TeamApi.Team>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'members': {
      onMembers(row);
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
          return await getTeamList({
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
  } as VxeTableGridOptions<Jx3TeamApi.Team>,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="refreshGrid" />
    <MemberDrawer ref="memberDrawerRef" @success="refreshGrid" />
    <Grid :table-title="$t('jx3.team.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('jx3.team.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
