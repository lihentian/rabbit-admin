import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3AccountApi } from '#/api/jx3/account';

import { markRaw } from 'vue';

import type { useJx3AccountAccess } from '#/composables/use-jx3-account-access';
import { $t } from '#/locales';

import QuickCreateCharactersField from './modules/quick-create-characters-field.vue';

const accountInputProps = { autocomplete: 'off' } as const;
const passwordInputProps = { autocomplete: 'new-password' } as const;

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: accountInputProps,
      fieldName: 'account',
      label: $t('jx3.account.account'),
      rules: 'required',
    },
    {
      component: 'InputPassword',
      componentProps: passwordInputProps,
      fieldName: 'password',
      label: $t('jx3.account.password'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: $t('jx3.account.remark'),
    },
    {
      component: markRaw(QuickCreateCharactersField),
      defaultValue: null,
      fieldName: 'characters',
      formItemClass: 'col-span-full w-full',
      hideLabel: true,
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('jx3.account.keywords'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<Jx3AccountApi.Account>,
  access?: ReturnType<typeof useJx3AccountAccess>,
): VxeTableGridColumns {
  return [
    { field: 'account', title: $t('jx3.account.account'), minWidth: 140 },
    { field: 'userId', title: $t('jx3.account.userId'), minWidth: 120 },
    { field: 'serviceId', title: $t('jx3.account.serviceId'), minWidth: 120 },
    { field: 'remark', title: $t('jx3.account.remark'), minWidth: 120 },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'account',
          nameTitle: $t('jx3.account.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            show: () => access?.canView.value ?? false,
            text: $t('jx3.account.detail'),
          },
          {
            code: 'edit',
            show: () => access?.canUpdate.value ?? false,
          },
          {
            code: 'delete',
            show: () => access?.canDelete.value ?? false,
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.account.operation'),
      width: 200,
    },
  ];
}
