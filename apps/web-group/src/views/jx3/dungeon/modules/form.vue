<script lang="ts" setup>
import type { Jx3DungeonApi } from '#/api/jx3/dungeon';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createDungeon,
  getDungeonForm,
  updateDungeon,
} from '#/api/jx3/dungeon';
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
        await updateDungeon(id.value, values);
      } else {
        await createDungeon(values);
      }
      emits('success');
      modalApi.close();
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<Jx3DungeonApi.Dungeon>();
      formApi.resetForm();
      if (data?.id) {
        id.value = data.id;
        const form = await getDungeonForm(data.id);
        formApi.setValues(form);
      } else {
        id.value = undefined;
      }
    }
  },
});

const getTitle = computed(() =>
  id.value
    ? $t('common.edit', $t('jx3.dungeon.name'))
    : $t('common.create', $t('jx3.dungeon.name')),
);
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
