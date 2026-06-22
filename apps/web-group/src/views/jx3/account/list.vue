<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Jx3AccountApi } from '#/api/jx3/account';

import { ref } from 'vue';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAccount,
  getAccountList,
  resetAccountPassword,
} from '#/api/jx3/account';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema, useResetPasswordSchema } from './data';
import Form from './modules/form.vue';

const resetAccountId = ref<string>();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [ResetPasswordForm, resetPasswordFormApi] = useVbenForm({
  schema: useResetPasswordSchema(),
  showDefaultActions: false,
});

const [ResetPasswordModal, resetPasswordModalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await resetPasswordFormApi.validate();
    if (!valid || !resetAccountId.value) return;
    const { password } = await resetPasswordFormApi.getValues();
    resetPasswordModalApi.lock();
    try {
      await resetAccountPassword(resetAccountId.value, password);
      message.success($t('jx3.account.resetPasswordSuccess'));
      resetPasswordModalApi.close();
    } finally {
      resetPasswordModalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetPasswordFormApi.resetForm();
      const data = resetPasswordModalApi.getData<Jx3AccountApi.Account>();
      resetAccountId.value = data?.id;
    }
  },
});

function onEdit(row: Jx3AccountApi.Account) {
  formDrawerApi.setData(row).open();
}

function onCreate() {
  formDrawerApi.setData(null).open();
}

function onResetPassword(row: Jx3AccountApi.Account) {
  resetPasswordModalApi.setData(row).open();
}

function onDelete(row: Jx3AccountApi.Account) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.account]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteAccount(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.account]),
        key: 'action_process_msg',
      });
      refreshGrid();
    })
    .catch(() => {
      hideLoading();
    });
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<Jx3AccountApi.Account>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'resetPassword': {
      onResetPassword(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAccountList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<Jx3AccountApi.Account>,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="refreshGrid" />
    <ResetPasswordModal :title="$t('jx3.account.resetPassword')">
      <ResetPasswordForm class="mx-4" />
    </ResetPasswordModal>
    <Grid :table-title="$t('jx3.account.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('jx3.account.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
