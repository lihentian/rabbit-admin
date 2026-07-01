import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3AccountApi } from '#/api/jx3/account';

import { getUserOptions } from '#/api/system/user';
import { $t } from '#/locales';

export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'userId',
      label: $t('jx3.account.userId'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getUserOptions,
        class: 'w-full',
        labelField: 'label',
        showSearch: true,
        valueField: 'value',
      },
      fieldName: 'serviceId',
      label: $t('jx3.account.serviceId'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'account',
      label: $t('jx3.account.account'),
      rules: 'required',
    },
    {
      component: 'InputPassword',
      fieldName: 'password',
      label: $t('jx3.account.password'),
      rules: isEdit ? undefined : 'required',
      dependencies: {
        show: () => !isEdit,
        triggerFields: [],
      },
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: $t('jx3.account.remark'),
    },
  ];
}

export function useResetPasswordSchema(): VbenFormSchema[] {
  return [
    {
      component: 'InputPassword',
      fieldName: 'password',
      label: $t('jx3.account.password'),
      rules: 'required',
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
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getUserOptions,
        class: 'w-full',
        labelField: 'label',
        showSearch: true,
        valueField: 'value',
      },
      fieldName: 'userId',
      label: $t('jx3.account.userId'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getUserOptions,
        class: 'w-full',
        labelField: 'label',
        showSearch: true,
        valueField: 'value',
      },
      fieldName: 'serviceId',
      label: $t('jx3.account.serviceId'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<Jx3AccountApi.Account>,
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
          options: [
            'edit',
            {
              code: 'resetPassword',
              text: $t('jx3.account.resetPassword'),
            },
            'delete',
          ],
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.account.operation'),
      width: 200,
    },
  ];
}
