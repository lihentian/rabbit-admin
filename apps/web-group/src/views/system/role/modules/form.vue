<script lang="ts" setup>
import type { SystemRoleApi } from '#/api/system/role';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createRole,
  getRoleForm,
  updateRole,
} from '#/api/system/role';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const id = ref<string>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    try {
      if (id.value) {
        await updateRole(id.value, values);
      } else {
        await createRole(values);
      }
      emits('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<SystemRoleApi.SystemRole>();
      formApi.resetForm();
      if (data?.id) {
        id.value = data.id;
        const form = await getRoleForm(data.id);
        formApi.setValues(form);
      } else {
        id.value = undefined;
      }
    }
  },
});

const getDrawerTitle = computed(() => {
  return id.value
    ? $t('common.edit', $t('system.role.name'))
    : $t('common.create', $t('system.role.name'));
});
</script>

<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
