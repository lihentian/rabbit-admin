import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3GameServerApi } from '#/api/jx3/game-server';

import { getGameAreaOptions } from '#/constants/jx3.constants';
import { $t } from '#/locales';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: getGameAreaOptions(),
      },
      fieldName: 'gameArea',
      label: $t('jx3.gameServer.gameArea'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'serverName',
      label: $t('jx3.gameServer.serverName'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'alias',
      label: $t('jx3.gameServer.alias'),
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full' },
      defaultValue: 0,
      fieldName: 'sort',
      label: $t('jx3.gameServer.sort'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('jx3.gameServer.keywords'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: getGameAreaOptions(),
      },
      fieldName: 'gameArea',
      label: $t('jx3.gameServer.gameArea'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<Jx3GameServerApi.GameServer>,
): VxeTableGridColumns {
  return [
    {
      field: 'gameArea',
      title: $t('jx3.gameServer.gameArea'),
      width: 100,
    },
    {
      field: 'serverName',
      title: $t('jx3.gameServer.serverName'),
      width: 150,
    },
    { field: 'alias', minWidth: 120, title: $t('jx3.gameServer.alias') },
    { field: 'sort', title: $t('jx3.gameServer.sort'), width: 80 },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'serverName',
          nameTitle: $t('jx3.gameServer.name'),
          onClick: onActionClick,
          options: ['edit', 'delete'],
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.gameServer.operation'),
      width: 130,
    },
  ];
}
