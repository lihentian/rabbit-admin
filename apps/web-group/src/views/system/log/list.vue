<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemLogApi } from '#/api/system/log';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Descriptions, DescriptionsItem, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLogList } from '#/api/system/log';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';

const detail = ref<SystemLogApi.Log>();

const [DetailModal, detailModalApi] = useVbenModal({
  footer: false,
  title: $t('system.log.detail'),
});

function onDetail(row: SystemLogApi.Log) {
  detail.value = row;
  detailModalApi.open();
}

function onActionClick({ code, row }: OnActionClickParams<SystemLogApi.Log>) {
  if (code === 'detail') onDetail(row);
}

const [Grid] = useVbenVxeGrid({
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
          const { createTime, ...rest } = formValues ?? {};
          return await getLogList({
            page: page.currentPage,
            pageSize: page.pageSize,
            createTime: createTime?.length === 2 ? createTime : undefined,
            ...rest,
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
  } as VxeTableGridOptions<SystemLogApi.Log>,
});
</script>

<template>
  <Page auto-content-height>
    <DetailModal class="w-[720px]">
      <Descriptions v-if="detail" bordered :column="2" size="small">
        <DescriptionsItem :label="$t('system.log.operationTitle')" :span="2">
          {{ detail.title }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('system.log.status')">
          <Tag :color="detail.status === 1 ? 'success' : 'error'">
            {{ detail.status === 1 ? $t('system.log.success') : $t('system.log.fail') }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('system.log.executionTime')">
          {{ detail.executionTime }}ms
        </DescriptionsItem>
        <DescriptionsItem :label="$t('system.log.operatorName')">
          {{ detail.operatorName }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('system.log.createTime')">
          {{ detail.createTime }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('system.log.ip')">
          {{ detail.ip }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('system.log.requestMethod')">
          {{ detail.requestMethod }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('system.log.requestUri')" :span="2">
          {{ detail.requestUri }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('system.log.browser')">
          {{ detail.browser }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('system.log.os')">
          {{ detail.os }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('system.log.content')" :span="2">
          {{ detail.content || '-' }}
        </DescriptionsItem>
        <DescriptionsItem
          v-if="detail.errorMsg"
          :label="$t('system.log.errorMsg')"
          :span="2"
        >
          <span class="text-destructive">{{ detail.errorMsg }}</span>
        </DescriptionsItem>
      </Descriptions>
    </DetailModal>
    <Grid :table-title="$t('system.log.list')" />
  </Page>
</template>
