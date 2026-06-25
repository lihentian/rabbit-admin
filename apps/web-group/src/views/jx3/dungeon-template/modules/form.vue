<script lang="ts" setup>
import type { Jx3DungeonTemplateApi } from '#/api/jx3/dungeon-template';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createDungeonTemplate,
  getDungeonTemplateForm,
  updateDungeonTemplate,
} from '#/api/jx3/dungeon-template';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

function normalizeSpecRules(
  rules?: Array<{ count: number; isCw?: boolean; specId?: number }> | null,
) {
  if (!rules?.length) return null;
  const valid = rules.filter((item) => item.specId != null && item.specId > 0);
  return valid.length
    ? valid.map((item) => ({
        specId: Number(item.specId),
        count: item.count,
        isCw: !!item.isCw,
      }))
    : null;
}

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
    const payload = {
      ...values,
      specRules: normalizeSpecRules(values.specRules),
    };
    modalApi.lock();
    try {
      if (id.value) {
        await updateDungeonTemplate(id.value, payload);
      } else {
        await createDungeonTemplate(payload);
      }
      emits('success');
      modalApi.close();
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<Jx3DungeonTemplateApi.Template>();
      formApi.resetForm();
      if (data?.id) {
        id.value = data.id;
        const form = await getDungeonTemplateForm(data.id);
        formApi.setValues({
          ...form,
          specRules:
            form.specRules?.map((item) => ({
              ...item,
              specId: Number(item.specId),
            })) ?? null,
        });
      } else {
        id.value = undefined;
      }
    }
  },
});

const getTitle = computed(() =>
  id.value
    ? $t('common.edit', $t('jx3.dungeonTemplate.name'))
    : $t('common.create', $t('jx3.dungeonTemplate.name')),
);
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
