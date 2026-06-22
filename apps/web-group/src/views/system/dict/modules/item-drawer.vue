<script lang="ts" setup>
import type { SystemDictApi } from '#/api/system/dict';

import { computed, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button } from 'antdv-next';

import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useVbenForm } from '#/adapter/form';
import {
  createDictItem,
  deleteDictItem,
  getDictItemForm,
  getDictItemList,
  updateDictItem,
} from '#/api/system/dict';
import { $t } from '#/locales';

import { useItemColumns, useItemFormSchema } from '../data';

const dictRow = ref<SystemDictApi.Dict>();
const itemId = ref<string>();

const [ItemForm, itemFormApi] = useVbenForm({
  schema: useItemFormSchema(),
  showDefaultActions: false,
});

const [ItemModal, itemModalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await itemFormApi.validate();
    if (!valid || !dictRow.value) return;
    const values = await itemFormApi.getValues();
    itemModalApi.lock();
    try {
      if (itemId.value) {
        await updateDictItem(dictRow.value.dictCode, itemId.value, values);
      } else {
        await createDictItem(dictRow.value.dictCode, values);
      }
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
        if (dictRow.value) {
          const form = await getDictItemForm(dictRow.value.dictCode, data.id);
          itemFormApi.setValues(form);
        }
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
    if (dictRow.value) {
      deleteDictItem(dictRow.value.dictCode, row.id).then(() => {
        itemGridApi.query();
      });
    }
  }
}

const [ItemGrid, itemGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useItemColumns(onItemActionClick),
    height: 400,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!dictRow.value) return { items: [], total: 0 };
          return await getDictItemList(dictRow.value.dictCode, {
            page: page.currentPage,
            pageSize: page.pageSize,
          });
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<SystemDictApi.DictItem>,
});

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen) {
    if (isOpen) {
      dictRow.value = drawerApi.getData<SystemDictApi.Dict>();
      itemGridApi.query();
    }
  },
});

const drawerTitle = computed(() =>
  dictRow.value
    ? `${$t('system.dict.items')} - ${dictRow.value.name}`
    : $t('system.dict.items'),
);

function onCreateItem() {
  itemModalApi.setData(null).open();
}

function open(row: SystemDictApi.Dict) {
  drawerApi.setData(row).open();
}

defineExpose({ open });
</script>

<template>
  <Drawer :title="drawerTitle" class="w-[800px]">
    <ItemModal>
      <ItemForm class="mx-4" />
    </ItemModal>
    <ItemGrid>
      <template #toolbar-tools>
        <Button type="primary" @click="onCreateItem">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.dict.itemLabel')]) }}
        </Button>
      </template>
    </ItemGrid>
  </Drawer>
</template>
