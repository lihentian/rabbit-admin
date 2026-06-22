<script lang="ts" setup>
import type { Jx3SpecApi } from '#/api/jx3/spec';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createSpec, getSpecForm, updateSpec } from '#/api/jx3/spec';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const id = ref<string>();

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
      if (id.value) {
        await updateSpec(id.value, values);
      } else {
        await createSpec(values);
      }
      emits('success');
      modalApi.close();
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<Jx3SpecApi.Spec>();
      formApi.resetForm();
      if (data?.id) {
        id.value = data.id;
        const form = await getSpecForm(data.id);
        formApi.setValues(form);
      } else {
        id.value = undefined;
      }
    }
  },
});

const getTitle = computed(() =>
  id.value
    ? $t('common.edit', $t('jx3.spec.name'))
    : $t('common.create', $t('jx3.spec.name')),
);
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
