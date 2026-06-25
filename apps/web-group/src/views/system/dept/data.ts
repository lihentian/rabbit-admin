import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';

import { getDeptOptions } from '#/api/system/dept';
import { $t } from '#/locales';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getDeptOptions,
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
        childrenField: 'children',
      },
      defaultValue: '0',
      fieldName: 'parentId',
      label: $t('system.dept.parent'),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.dept.deptName'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.dept.code'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 0 },
      defaultValue: 0,
      fieldName: 'sort',
      label: $t('system.dept.sort'),
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
      label: $t('system.dept.status'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('system.dept.keywords'),
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
      label: $t('system.dept.status'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<SystemDeptApi.Dept>,
): VxeTableGridColumns<SystemDeptApi.Dept> {
  return [
    {
      align: 'left',
      field: 'name',
      fixed: 'left',
      minWidth: 200,
      title: $t('system.dept.deptName'),
      treeNode: true,
    },
    {
      align: 'left',
      field: 'code',
      minWidth: 140,
      title: $t('system.dept.code'),
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: $t('system.dept.status'),
      width: 100,
    },
    { field: 'sort', title: $t('system.dept.sort'), width: 80 },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.dept.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'append', text: $t('system.dept.appendChild') },
          'edit',
          'delete',
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.dept.operation'),
      width: 200,
    },
  ];
}
