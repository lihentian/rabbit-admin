<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemNoticeApi } from '#/api/system/notice';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNotice,
  getNoticeDetail,
  getNoticeList,
  publishNotice,
  revokeNotice,
} from '#/api/system/notice';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const detailContent = ref('');

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  footer: false,
  title: $t('system.notice.detail'),
});

function onCreate() {
  formModalApi.setData(null).open();
}

function onEdit(row: SystemNoticeApi.Notice) {
  formModalApi.setData(row).open();
}

async function onDetail(row: SystemNoticeApi.Notice) {
  const detail = await getNoticeDetail(row.id);
  detailContent.value = detail?.content ?? '';
  detailModalApi.open();
}

function onDelete(row: SystemNoticeApi.Notice) {
  deleteNotice(row.id).then(() => {
    message.success($t('ui.actionMessage.deleteSuccess', [row.title]));
    refreshGrid();
  });
}

function onPublish(row: SystemNoticeApi.Notice) {
  publishNotice(row.id).then(() => {
    message.success($t('system.notice.publishSuccess'));
    refreshGrid();
  });
}

function onRevoke(row: SystemNoticeApi.Notice) {
  revokeNotice(row.id).then(() => {
    message.success($t('system.notice.revokeSuccess'));
    refreshGrid();
  });
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemNoticeApi.Notice>) {
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
    case 'publish': {
      onPublish(row);
      break;
    }
    case 'revoke': {
      onRevoke(row);
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
          return await getNoticeList({
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
  } as VxeTableGridOptions<SystemNoticeApi.Notice>,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <DetailModal class="w-[720px]">
      <div class="whitespace-pre-wrap" v-html="detailContent" />
    </DetailModal>
    <Grid :table-title="$t('system.notice.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.notice.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
