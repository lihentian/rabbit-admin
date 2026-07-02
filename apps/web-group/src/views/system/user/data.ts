import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { getRoleOptions } from '#/api/system/role';
import { $t } from '#/locales';

export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.username'),
      rules: 'required',
      componentProps: { autocomplete: 'off', disabled: isEdit },
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: $t('system.user.nickname'),
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('system.user.genderMale'), value: 1 },
          { label: $t('system.user.genderFemale'), value: 2 },
        ],
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'gender',
      label: $t('system.user.gender'),
    },
    {
      component: 'InputPassword',
      componentProps: { autocomplete: 'new-password' },
      fieldName: 'password',
      label: $t('system.user.password'),
      rules: isEdit ? undefined : 'required',
      dependencies: {
        show: () => !isEdit,
        triggerFields: [],
      },
    },
    {
      component: 'Input',
      fieldName: 'mobile',
      label: $t('system.user.mobile'),
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('system.user.email'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getRoleOptions,
        class: 'w-full',
        labelField: 'label',
        mode: 'multiple',
        valueField: 'value',
      },
      fieldName: 'roleIds',
      label: $t('system.user.roles'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'status',
      label: $t('system.user.status'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('system.user.keywords'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
      },
      fieldName: 'status',
      label: $t('system.user.status'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<SystemUserApi.SystemUser>,
): VxeTableGridColumns {
  return [
    { field: 'username', title: $t('system.user.username'), width: 120 },
    { field: 'nickname', title: $t('system.user.nickname'), width: 120 },
    { field: 'mobile', title: $t('system.user.mobile'), width: 130 },
    {
      field: 'roleNames',
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue) ? cellValue.join(', ') : cellValue,
      minWidth: 120,
      title: $t('system.user.roles'),
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: $t('system.user.status'),
      width: 90,
    },
    {
      field: 'createTime',
      title: $t('system.user.createTime'),
      width: 170,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'nickname',
          nameTitle: $t('system.user.name'),
          onClick: onActionClick,
          options: ['edit', 'delete'],
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.user.operation'),
      width: 130,
    },
  ];
}
