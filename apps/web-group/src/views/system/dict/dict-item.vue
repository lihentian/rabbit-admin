<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemDictApi } from '#/api/system/dict';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createDictItem,
  deleteDictItem,
  getDictItemForm,
  getDictItemList,
  updateDictItem,
} from '#/api/system/dict';
import { $t } from '#/locales';

import { useItemColumns, useItemFormSchema, useItemGridFormSchema } from './data';

const route = useRoute();
const { setTabTitle } = useTabs();

const dictCode = computed(() => String(route.query.dictCode ?? ''));
const pageTitle = computed(() =>
  String(route.query.title ?? $t('system.dict.dictData')),
);

watch(
  pageTitle,
  (title) => {
    setTabTitle(title);
  },
  { immediate: true },
);

const itemId = ref<string>();

const [ItemForm, itemFormApi] = useVbenForm({
  schema: useItemFormSchema(),
  showDefaultActions: false,
});

const [ItemModal, itemModalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await itemFormApi.validate();
    if (!valid || !dictCode.value) return;
    const values = await itemFormApi.getValues();
    itemModalApi.lock();
    try {
      if (itemId.value) {
        await updateDictItem(dictCode.value, itemId.value, values);
      } else {
        await createDictItem(dictCode.value, values);
      }
      message.success($t('ui.actionMessage.operationSuccess'));
      itemModalApi.close();
      itemGridApi.query();
    } finally {
      itemModalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = itemModalApi.getData<SystemDictApi.DictItem>();
      itemFormApi.resetForm();
      if (data?.id) {
        itemId.value = data.id;
        const form = await getDictItemForm(dictCode.value, data.id);
        itemFormApi.setValues(form);
      } else {
        itemId.value = undefined;
      }
    }
  },
});

function onItemActionClick({
  code,
  row,
}: OnActionClickParams<SystemDictApi.DictItem>) {
  if (code === 'edit') {
    itemModalApi.setData(row).open();
  } else if (code === 'delete') {
    deleteDictItem(dictCode.value, row.id).then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.label]));
      itemGridApi.query();
    });
  }
}

const [Grid, itemGridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useItemGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useItemColumns(onItemActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          if (!dictCode.value) return { items: [], total: 0 };
          return await getDictItemList(dictCode.value, {
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
  } as VxeTableGridOptions<SystemDictApi.DictItem>,
});

const itemModalTitle = computed(() =>
  itemId.value
    ? $t('common.edit', $t('system.dict.itemLabel'))
    : $t('common.create', $t('system.dict.itemLabel')),
);

function onCreateItem() {
  itemModalApi.setData(null).open();
}
</script>

<template>
  <Page auto-content-height>
    <ItemModal :title="itemModalTitle">
      <ItemForm class="mx-4" />
    </ItemModal>
    <Grid :table-title="pageTitle">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreateItem">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.dict.itemLabel')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
