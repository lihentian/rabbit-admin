import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api/system/role';

import { $t } from '#/locales';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.role.code'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full' },
      defaultValue: 0,
      fieldName: 'sort',
      label: $t('system.role.sort'),
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full' },
      fieldName: 'dataScope',
      label: $t('system.role.dataScope'),
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
      label: $t('system.role.status'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('system.role.keywords'),
    },
  ];
}

export function useColumns<T = SystemRoleApi.SystemRole>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: number, row: T) => PromiseLike<boolean | undefined>,
): VxeTableGridColumns {
  return [
    { field: 'name', title: $t('system.role.roleName'), width: 150 },
    { field: 'code', title: $t('system.role.code'), width: 150 },
    { field: 'sort', title: $t('system.role.sort'), width: 80 },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
      },
      field: 'status',
      title: $t('system.role.status'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.role.createTime'),
      width: 170,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.role.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.role.operation'),
      width: 130,
    },
  ];
}
