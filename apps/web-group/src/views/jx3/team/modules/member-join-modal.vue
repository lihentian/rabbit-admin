<script lang="ts" setup>
import type { Jx3TeamApi } from '#/api/jx3/team';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { joinTeam } from '#/api/jx3/team';
import { $t } from '#/locales';

import { useJoinFormSchema } from '../data';

const emit = defineEmits<{ success: [] }>();

const teamRow = ref<Jx3TeamApi.Team>();

const [JoinForm, joinFormApi] = useVbenForm({
  schema: useJoinFormSchema(false),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await joinFormApi.validate();
    if (!valid || !teamRow.value) return;
    const values = await joinFormApi.getValues();
    const payload = {
      ...values,
      coversTeam: values.coversTeam ? 1 : 0,
      joinType: teamRow.value.isOpen === 1 ? values.joinType : 2,
    };
    modalApi.lock();
    try {
      await joinTeam(teamRow.value.id, payload);
      message.success($t('jx3.team.joinSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      teamRow.value = undefined;
      return;
    }
    teamRow.value = modalApi.getData<Jx3TeamApi.Team>();
    joinFormApi.setState({
      schema: useJoinFormSchema(teamRow.value?.isOpen === 1),
    });
    joinFormApi.resetForm();
    if (teamRow.value?.isOpen !== 1) {
      joinFormApi.setValues({ joinType: 2 });
    }
  },
});

function open(row: Jx3TeamApi.Team) {
  modalApi.setState({ title: $t('jx3.team.join') }).setData(row).open();
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-[520px]">
    <JoinForm class="mx-4" />
  </Modal>
</template>
