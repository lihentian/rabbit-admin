<script lang="ts" setup>
import type { Jx3AccountApi } from '#/api/jx3/account';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createAccount,
  createAccountFull,
  getAccountForm,
  updateAccountFull,
} from '#/api/jx3/account';
import { $t } from '#/locales';
import { loadAccountCharacters } from '#/utils/jx3/account-characters';
import {
  buildFullPayload,
  buildFullUpdatePayload,
  normalizeCharacters,
  validateCharacters,
} from '#/utils/jx3/account-create';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const userStore = useUserStore();
const id = ref<string>();
const loadedUserId = ref<string>();

function getCurrentUserId() {
  return userStore.userInfo?.userId;
}

function withAccountOwners(
  values: Record<string, any>,
  options: { isCreate: boolean },
): Record<string, any> {
  const currentUserId = getCurrentUserId()!;

  return {
    ...values,
    serviceId: currentUserId,
    userId: options.isCreate ? currentUserId : (loadedUserId.value ?? currentUserId),
  };
}

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      message.error($t('jx3.account.currentUserRequired'));
      return;
    }

    const values = await formApi.getValues();
    drawerApi.lock();
    try {
      if (id.value) {
        const accountValues = withAccountOwners(values, { isCreate: false });
        const characters = normalizeCharacters(accountValues.characters);
        if (characters.length && !validateCharacters(characters)) return;
        await updateAccountFull(
          id.value,
          buildFullUpdatePayload(accountValues, characters),
        );
      } else {
        const accountValues = withAccountOwners(values, { isCreate: true });
        const characters = normalizeCharacters(accountValues.characters);
        if (characters.length) {
          if (!validateCharacters(characters)) return;
          await createAccountFull(buildFullPayload(accountValues, characters));
          message.success($t('jx3.account.createWithCharactersSuccess'));
        } else {
          const { characters: _characters, ...payload } = accountValues;
          await createAccount(payload);
        }
      }
      emits('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<Jx3AccountApi.Account>();
      formApi.resetForm();
      formApi.setState({ schema: useFormSchema() });

      if (data?.id) {
        id.value = data.id;
        const form = await getAccountForm(data.id);
        loadedUserId.value = form.userId;
        const { userId: _userId, serviceId: _serviceId, ...formValues } = form;
        const characters = await loadAccountCharacters(data.id);
        formApi.setValues({
          ...formValues,
          characters: characters.length ? characters : null,
        });
      } else {
        id.value = undefined;
        loadedUserId.value = undefined;
      }
    }
  },
});

const getDrawerTitle = computed(() => {
  return id.value
    ? $t('common.edit', $t('jx3.account.name'))
    : $t('common.create', $t('jx3.account.name'));
});
</script>

<template>
  <Drawer :title="getDrawerTitle" class="w-[720px]">
    <Form />
  </Drawer>
</template>
