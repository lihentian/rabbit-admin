import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemConfigApi } from '#/api/system/config';

import { $t } from '#/locales';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'configName',
      label: $t('system.config.configName'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'configKey',
      label: $t('system.config.configKey'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'configValue',
      label: $t('system.config.configValue'),
      rules: 'required',
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('system.config.remark'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('system.config.keywords'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<SystemConfigApi.Config>,
): VxeTableGridColumns<SystemConfigApi.Config> {
  return [
    { field: 'configName', minWidth: 140, title: $t('system.config.configName') },
    { field: 'configKey', minWidth: 140, title: $t('system.config.configKey') },
    { field: 'configValue', minWidth: 140, title: $t('system.config.configValue') },
    { field: 'remark', minWidth: 120, title: $t('system.config.remark') },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'configName',
          nameTitle: $t('system.config.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.config.operation'),
      width: 130,
    },
  ];
}
