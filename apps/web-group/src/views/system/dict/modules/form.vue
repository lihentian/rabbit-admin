<script lang="ts" setup>
import type { SystemDictApi } from '#/api/system/dict';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createDict,
  getDictForm,
  updateDict,
} from '#/api/system/dict';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const id = ref<string>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(false),
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
        await updateDict(id.value, values);
      } else {
        await createDict(values);
      }
      emits('success');
      modalApi.close();
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<SystemDictApi.Dict>();
      formApi.resetForm();
      formApi.setState({ schema: useFormSchema(!!data?.id) });
      if (data?.id) {
        id.value = data.id;
        const form = await getDictForm(data.id);
        formApi.setValues(form);
      } else {
        id.value = undefined;
      }
    }
  },
});

const getTitle = computed(() =>
  id.value
    ? $t('common.edit', $t('system.dict.name'))
    : $t('common.create', $t('system.dict.name')),
);
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
