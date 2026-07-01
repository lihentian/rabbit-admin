<script lang="ts" setup>
import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createTeam, getTeamForm, updateTeam } from '#/api/jx3/team';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits<{
  success: [payload?: { id: string; teamName: string }];
}>();

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
        await updateTeam(id.value, values);
        emits('success');
      } else {
        const newId = await createTeam(values);
        emits('success', {
          id: newId,
          teamName: String(values.teamName ?? ''),
        });
      }
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<Jx3TeamApi.Team>();
      formApi.resetForm();

      if (data?.id) {
        id.value = data.id;
        const form = await getTeamForm(data.id);
        formApi.setValues(form);
      } else {
        id.value = undefined;
      }
    }
  },
});

const getDrawerTitle = computed(() => {
  return id.value
    ? $t('common.edit', $t('jx3.team.name'))
    : $t('common.create', $t('jx3.team.name'));
});
</script>

<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
