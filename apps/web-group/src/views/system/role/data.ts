import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api/system/role';

import { getDeptOptions } from '#/api/system/dept';
import { $t } from '#/locales';

export const DATA_SCOPE_OPTIONS = [
  { label: $t('system.role.dataScopeAll'), value: 1 },
  { label: $t('system.role.dataScopeDeptAndSub'), value: 2 },
  { label: $t('system.role.dataScopeDept'), value: 3 },
  { label: $t('system.role.dataScopeSelf'), value: 4 },
  { label: $t('system.role.dataScopeCustom'), value: 5 },
];

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
      component: 'Select',
      componentProps: {
        allowClear: false,
        class: 'w-full',
        options: DATA_SCOPE_OPTIONS,
      },
      defaultValue: 4,
      fieldName: 'dataScope',
      label: $t('system.role.dataScope'),
      rules: 'required',
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getDeptOptions,
        class: 'w-full',
        labelField: 'label',
        multiple: true,
        treeCheckable: true,
        valueField: 'value',
        childrenField: 'children',
      },
      dependencies: {
        show: (values) => values.dataScope === 5,
        triggerFields: ['dataScope'],
      },
      fieldName: 'deptIds',
      label: $t('system.role.customDepts'),
      rules: 'required',
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
      field: 'dataScopeLabel',
      title: $t('system.role.dataScope'),
      width: 160,
    },
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
        options: [
          { code: 'assign', text: $t('system.role.assignPerm') },
          'edit',
          'delete',
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.role.operation'),
      width: 220,
    },
  ];
}
