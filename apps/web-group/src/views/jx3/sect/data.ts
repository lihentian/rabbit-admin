import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3SectApi } from '#/api/jx3/sect';

import { $t } from '#/locales';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'sectName',
      label: $t('jx3.sect.sectName'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full' },
      defaultValue: 0,
      fieldName: 'sort',
      label: $t('jx3.sect.sort'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('jx3.sect.keywords'),
    },
  ];
}

export function useColumns(onActionClick: OnActionClickFn<Jx3SectApi.Sect>): VxeTableGridColumns {
  return [
    {
      field: 'sectName',
      title: $t('jx3.sect.sectName'),
      minWidth: 140,
    },
    { field: 'sort', title: $t('jx3.sect.sort'), minWidth: 80, align: 'center' },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'sectName',
          nameTitle: $t('jx3.sect.name'),
          onClick: onActionClick,
          options: ['edit', 'delete'],
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.sect.operation'),
      width: 130,
    },
  ];
}
