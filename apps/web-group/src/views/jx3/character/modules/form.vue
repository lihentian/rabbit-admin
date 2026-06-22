<script lang="ts" setup>
import type { Jx3CharacterApi } from '#/api/jx3/character';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createCharacter,
  getCharacterForm,
  updateCharacter,
} from '#/api/jx3/character';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const id = ref<string>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(false),
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
        await updateCharacter(id.value, values);
      } else {
        await createCharacter(values);
      }
      emits('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<Jx3CharacterApi.Character>();
      formApi.resetForm();
      formApi.setState({ schema: useFormSchema(!!data?.id) });

      if (data?.id) {
        id.value = data.id;
        const form = await getCharacterForm(data.id);
        formApi.setValues(form);
      } else {
        id.value = undefined;
      }
    }
  },
});

const getDrawerTitle = computed(() => {
  return id.value
    ? $t('common.edit', $t('jx3.character.name'))
    : $t('common.create', $t('jx3.character.name'));
});
</script>

<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
