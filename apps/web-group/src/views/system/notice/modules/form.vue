<script lang="ts" setup>
import type { SystemNoticeApi } from '#/api/system/notice';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createNotice,
  getNoticeForm,
  updateNotice,
} from '#/api/system/notice';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits<{ success: [] }>();

const noticeId = ref<string>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    const payload = {
      ...values,
      type: Number(values.type),
      targetType: Number(values.targetType),
      targetUserIds: values.targetUserIds?.map((id: string) => Number(id)),
    };
    modalApi.lock();
    try {
      if (noticeId.value) {
        await updateNotice(noticeId.value, payload);
      } else {
        await createNotice(payload);
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData<SystemNoticeApi.Notice>();
    formApi.resetForm();
    if (data?.id) {
      noticeId.value = data.id;
      const form = await getNoticeForm(data.id);
      formApi.setValues({
        ...form,
        type: String(form.type),
        targetUserIds: form.targetUserIds?.map(String),
      });
    } else {
      noticeId.value = undefined;
      formApi.setValues({ level: 'L', targetType: 1 });
    }
  },
});

const title = computed(() =>
  noticeId.value
    ? $t('ui.actionTitle.edit', [$t('system.notice.name')])
    : $t('ui.actionTitle.create', [$t('system.notice.name')]),
);
</script>

<template>
  <Modal class="w-[640px]" :title="title">
    <Form class="mx-4" />
  </Modal>
</template>
