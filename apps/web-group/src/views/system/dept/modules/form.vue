<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createDept,
  getDeptForm,
  updateDept,
} from '#/api/system/dept';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits<{ success: [] }>();

const deptId = ref<string>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    modalApi.lock();
    try {
      if (deptId.value) {
        await updateDept(deptId.value, values);
      } else {
        await createDept(values);
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData<SystemDeptApi.Dept & { parentId?: string }>();
    formApi.resetForm();
    if (data?.id) {
      deptId.value = data.id;
      const form = await getDeptForm(data.id);
      formApi.setValues(form);
    } else {
      deptId.value = undefined;
      formApi.setValues({
        parentId: data?.parentId ?? '0',
        status: 1,
        sort: 0,
      });
    }
  },
});

const title = computed(() =>
  deptId.value
    ? $t('ui.actionTitle.edit', [$t('system.dept.name')])
    : $t('ui.actionTitle.create', [$t('system.dept.name')]),
);
</script>

<template>
  <Modal :title="title">
    <Form class="mx-4" />
  </Modal>
</template>
