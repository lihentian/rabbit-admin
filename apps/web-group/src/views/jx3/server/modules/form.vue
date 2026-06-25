<script lang="ts" setup>
import type { Jx3GameServerApi } from '#/api/jx3/game-server';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createGameServer,
  getGameServerForm,
  updateGameServer,
} from '#/api/jx3/game-server';
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
        await updateGameServer(id.value, values);
      } else {
        await createGameServer(values);
      }
      emits('success');
      modalApi.close();
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<Jx3GameServerApi.GameServer>();
      formApi.resetForm();
      if (data?.id) {
        id.value = data.id;
        const form = await getGameServerForm(data.id);
        formApi.setValues(form);
      } else {
        id.value = undefined;
      }
    }
  },
});

const getTitle = computed(() =>
  id.value
    ? $t('common.edit', $t('jx3.gameServer.name'))
    : $t('common.create', $t('jx3.gameServer.name')),
);
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
