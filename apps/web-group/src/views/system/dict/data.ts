import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemDictApi } from '#/api/system/dict';

import { $t } from '#/locales';

export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'dictCode',
      label: $t('system.dict.dictCode'),
      rules: 'required',
      componentProps: { disabled: isEdit },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.dict.name'),
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.enabled'), value: 0 },
          { label: $t('common.disabled'), value: 1 },
        ],
        optionType: 'button',
      },
      defaultValue: 0,
      fieldName: 'status',
      label: $t('system.dict.status'),
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('system.dict.remark'),
    },
  ];
}

export function useItemFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'label',
      label: $t('system.dict.itemLabel'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'value',
      label: $t('system.dict.itemValue'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full' },
      defaultValue: 0,
      fieldName: 'sort',
      label: $t('system.dict.sort'),
    },
    {
      component: 'Input',
      fieldName: 'tagType',
      label: $t('system.dict.tagType'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.enabled'), value: 0 },
          { label: $t('common.disabled'), value: 1 },
        ],
        optionType: 'button',
      },
      defaultValue: 0,
      fieldName: 'status',
      label: $t('system.dict.status'),
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('system.dict.remark'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('system.dict.keywords'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<SystemDictApi.Dict>,
): VxeTableGridColumns {
  return [
    { field: 'dictCode', title: $t('system.dict.dictCode'), width: 150 },
    { field: 'name', title: $t('system.dict.name'), width: 150 },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.enabled'), value: 0 },
          { color: 'error', label: $t('common.disabled'), value: 1 },
        ],
      },
      field: 'status',
      title: $t('system.dict.status'),
      width: 90,
    },
    { field: 'remark', minWidth: 120, title: $t('system.dict.remark') },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.dict.name'),
          onClick: onActionClick,
          options: [
            { code: 'items', text: $t('system.dict.items') },
            'edit',
            'delete',
          ],
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.dict.operation'),
      width: 200,
    },
  ];
}

export function useItemColumns(
  onActionClick: OnActionClickFn<SystemDictApi.DictItem>,
): VxeTableGridColumns {
  return [
    { field: 'label', title: $t('system.dict.itemLabel'), width: 120 },
    { field: 'value', title: $t('system.dict.itemValue'), width: 120 },
    { field: 'sort', title: $t('system.dict.sort'), width: 80 },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.enabled'), value: 0 },
          { color: 'error', label: $t('common.disabled'), value: 1 },
        ],
      },
      field: 'status',
      title: $t('system.dict.status'),
      width: 90,
    },
    { field: 'tagType', title: $t('system.dict.tagType'), width: 100 },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'label',
          nameTitle: $t('system.dict.itemLabel'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.dict.operation'),
      width: 130,
    },
  ];
}
