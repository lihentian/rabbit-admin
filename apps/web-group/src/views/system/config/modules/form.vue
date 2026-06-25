<script lang="ts" setup>
import type { SystemConfigApi } from '#/api/system/config';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createConfig,
  getConfigForm,
  updateConfig,
} from '#/api/system/config';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits<{ success: [] }>();

const configId = ref<string>();

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
      if (configId.value) {
        await updateConfig(configId.value, values);
      } else {
        await createConfig(values);
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData<SystemConfigApi.Config>();
    formApi.resetForm();
    if (data?.id) {
      configId.value = data.id;
      const form = await getConfigForm(data.id);
      formApi.setValues(form);
    } else {
      configId.value = undefined;
    }
  },
});

const title = computed(() =>
  configId.value
    ? $t('ui.actionTitle.edit', [$t('system.config.name')])
    : $t('ui.actionTitle.create', [$t('system.config.name')]),
);
</script>

<template>
  <Modal :title="title">
    <Form class="mx-4" />
  </Modal>
</template>
