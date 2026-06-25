import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemLogApi } from '#/api/system/log';

import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('system.log.keywords'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        class: 'w-full',
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
      fieldName: 'createTime',
      label: $t('system.log.createTime'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<SystemLogApi.Log>,
): VxeTableGridColumns<SystemLogApi.Log> {
  return [
    { field: 'title', minWidth: 160, title: $t('system.log.operationTitle') },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('system.log.success'), value: 1 },
          { color: 'error', label: $t('system.log.fail'), value: 0 },
        ],
      },
      field: 'status',
      title: $t('system.log.status'),
      width: 90,
    },
    { field: 'ip', title: $t('system.log.ip'), width: 130 },
    { field: 'requestUri', minWidth: 180, title: $t('system.log.requestUri') },
    { field: 'requestMethod', title: $t('system.log.requestMethod'), width: 100 },
    { field: 'executionTime', title: $t('system.log.executionTime'), width: 110 },
    { field: 'operatorName', title: $t('system.log.operatorName'), width: 110 },
    { field: 'createTime', title: $t('system.log.createTime'), width: 170 },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'title',
          nameTitle: $t('system.log.name'),
          onClick: onActionClick,
          options: [{ code: 'detail', text: $t('system.log.detail') }],
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.log.operation'),
      width: 100,
    },
  ];
}
