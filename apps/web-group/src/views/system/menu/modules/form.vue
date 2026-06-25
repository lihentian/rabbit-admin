<script lang="ts" setup>
import type { SystemMenuApi } from '#/api/system/menu';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createMenu,
  getMenuForm,
  updateMenu,
} from '#/api/system/menu';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits<{ success: [] }>();

type MenuParamItem = { key: string; value: string };

function normalizeMenuPayload(values: Record<string, unknown>) {
  const payload = { ...values };
  const params = payload.params as MenuParamItem[] | null | undefined;

  if (Array.isArray(params)) {
    const record: Record<string, string> = {};
    params.forEach((item) => {
      if (item?.key) {
        record[item.key] = item.value ?? '';
      }
    });
    payload.params = Object.keys(record).length ? record : undefined;
  }

  if (payload.type !== 'M' || payload.keepAlive !== 1) {
    payload.routeName = undefined;
  }

  if (payload.type !== 'M') {
    payload.params = undefined;
  }

  return payload;
}

const menuId = ref<string>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = normalizeMenuPayload(await formApi.getValues());
    drawerApi.lock();
    try {
      if (menuId.value) {
        await updateMenu(menuId.value, values);
      } else {
        await createMenu(values);
      }
      emit('success');
      drawerApi.close();
    } finally {
      drawerApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = drawerApi.getData<SystemMenuApi.Menu & { parentId?: string }>();
    formApi.resetForm();
    if (data?.id) {
      menuId.value = data.id;
      const form = await getMenuForm(data.id);
      formApi.setValues(form);
    } else {
      menuId.value = undefined;
      formApi.setValues({
        parentId: data?.parentId ?? '0',
        type: 'M',
        visible: 1,
        sort: 0,
        alwaysShow: 0,
        keepAlive: 0,
        params: null,
      });
    }
  },
});

const title = computed(() =>
  menuId.value
    ? $t('ui.actionTitle.edit', [$t('system.menu.name')])
    : $t('ui.actionTitle.create', [$t('system.menu.name')]),
);
</script>

<template>
  <Drawer class="w-full max-w-160" :title="title">
    <Form class="mx-4" />
  </Drawer>
</template>
