<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemNoticeApi } from '#/api/system/notice';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMyNoticeList, getNoticeDetail } from '#/api/system/notice';
import { $t } from '#/locales';

const detailContent = ref('');

const [DetailModal, detailModalApi] = useVbenModal({
  footer: false,
  title: $t('system.notice.detail'),
});

async function onDetail(row: SystemNoticeApi.Notice) {
  const detail = await getNoticeDetail(row.id);
  detailContent.value = detail?.content ?? '';
  detailModalApi.open();
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemNoticeApi.Notice>) {
  if (code === 'detail') onDetail(row);
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        fieldName: 'keywords',
        label: $t('system.notice.noticeTitle'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: [
            { label: $t('system.notice.unread'), value: 0 },
            { label: $t('system.notice.read'), value: 1 },
          ],
        },
        fieldName: 'isRead',
        label: $t('system.notice.readStatus'),
      },
    ],
    submitOnChange: true,
  },
  gridOptions: {
    columns: [
      { field: 'title', minWidth: 200, title: $t('system.notice.noticeTitle') },
      { field: 'type', title: $t('system.notice.type'), width: 100 },
      { field: 'level', title: $t('system.notice.level'), width: 90 },
      { field: 'publishTime', title: $t('system.notice.publishTime'), width: 170 },
      { field: 'publisherName', title: $t('system.notice.publisher'), width: 110 },
      {
        cellRender: {
          name: 'CellTag',
          options: [
            { color: 'warning', label: $t('system.notice.unread'), value: 0 },
            { color: 'success', label: $t('system.notice.read'), value: 1 },
          ],
        },
        field: 'isRead',
        title: $t('system.notice.readStatus'),
        width: 100,
      },
      {
        align: 'center',
        cellRender: {
          attrs: {
            nameField: 'title',
            onClick: onActionClick,
            options: [{ code: 'detail', text: $t('system.notice.detail') }],
          },
          name: 'CellOperation',
        },
        field: 'operation',
        fixed: 'right',
        title: $t('system.notice.operation'),
        width: 100,
      },
    ],
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMyNoticeList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<SystemNoticeApi.Notice>,
});
</script>

<template>
  <Page auto-content-height>
    <DetailModal class="w-[720px]">
      <div class="whitespace-pre-wrap" v-html="detailContent" />
    </DetailModal>
    <Grid :table-title="$t('system.notice.myList')" />
  </Page>
</template>
