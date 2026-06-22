import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3DungeonApi } from '#/api/jx3/dungeon';

import { $t } from '#/locales';

export function usePlayerCountOptions() {
  return [
    { label: $t('jx3.dungeon.playerCount10'), value: 10 },
    { label: $t('jx3.dungeon.playerCount25'), value: 25 },
  ];
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'dungeonName',
      label: $t('jx3.dungeon.dungeonName'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: usePlayerCountOptions(),
      },
      fieldName: 'playerCount',
      label: $t('jx3.dungeon.playerCount'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full' },
      defaultValue: 1,
      fieldName: 'refreshCycle',
      label: $t('jx3.dungeon.refreshCycle'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('jx3.dungeon.keywords'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: usePlayerCountOptions(),
      },
      fieldName: 'playerCount',
      label: $t('jx3.dungeon.playerCount'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<Jx3DungeonApi.Dungeon>,
): VxeTableGridColumns {
  const playerCountOptions = usePlayerCountOptions();

  return [
    {
      field: 'dungeonName',
      minWidth: 150,
      title: $t('jx3.dungeon.dungeonName'),
    },
    {
      field: 'playerCount',
      formatter: ({ cellValue }) => {
        const option = playerCountOptions.find((item) => item.value === cellValue);
        return option?.label ?? cellValue;
      },
      title: $t('jx3.dungeon.playerCount'),
      width: 100,
    },
    {
      field: 'refreshCycle',
      title: $t('jx3.dungeon.refreshCycle'),
      width: 120,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'dungeonName',
          nameTitle: $t('jx3.dungeon.name'),
          onClick: onActionClick,
          options: ['edit', 'delete'],
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.dungeon.operation'),
      width: 130,
    },
  ];
}
