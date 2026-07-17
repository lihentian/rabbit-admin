import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3DungeonApi } from '#/api/jx3/dungeon';

import { getDungeonOptions } from '#/api/jx3/dungeon';
import { $t } from '#/locales';
import { useLabelSearchSelectProps } from '#/utils/jx3/select';

export interface DungeonSelectGroup {
  label: string;
  options: Array<{ label: string; value: string }>;
}

export function useDungeonGroupedSelectProps() {
  return {
    api: getDungeonGroupedSelectOptions,
    class: 'w-full',
    labelField: 'label',
    valueField: 'value',
    ...useLabelSearchSelectProps(),
  };
}

export async function getDungeonGroupedSelectOptions(): Promise<DungeonSelectGroup[]> {
  const list = await getDungeonOptions();
  const groupMap = new Map<string, Array<{ label: string; value: string }>>();

  for (const item of list) {
    const options = groupMap.get(item.version) ?? [];
    options.push({
      label: `${item.label}（${item.playerCount}${$t('jx3.dungeon.playerCountUnit')}）`,
      value: item.value,
    });
    groupMap.set(item.version, options);
  }

  const versionOptions = useVersionOptions();
  const knownGroups = versionOptions
    .filter((item) => groupMap.has(item.value))
    .map((item) => ({
      label: item.label,
      options: groupMap.get(item.value)!,
    }));

  const unknownVersions = [...groupMap.keys()].filter(
    (version) => !versionOptions.some((item) => item.value === version),
  );

  return [
    ...knownGroups,
    ...unknownVersions.map((version) => ({
      label: version,
      options: groupMap.get(version)!,
    })),
  ];
}

export function usePlayerCountOptions() {
  return [
    { label: $t('jx3.dungeon.playerCount10'), value: 10 },
    { label: $t('jx3.dungeon.playerCount25'), value: 25 },
  ];
}

export function useVersionOptions() {
  return [
    { label: '130级 丝路风语', value: '130级 丝路风语' },
    { label: '120级 横刀断浪', value: '120级 横刀断浪' },
    { label: '110级 奉天证道', value: '110级 奉天证道' },
    { label: '100级 世外蓬莱', value: '100级 世外蓬莱' },
    { label: '95级 剑胆琴心', value: '95级 剑胆琴心' },
    { label: '90级 安史之乱', value: '90级 安史之乱' },
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
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: useVersionOptions(),
      },
      fieldName: 'version',
      label: $t('jx3.dungeon.version'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 0 },
      defaultValue: 0,
      fieldName: 'price',
      label: $t('jx3.dungeon.price'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 0 },
      defaultValue: 0,
      fieldName: 'seniority',
      label: $t('jx3.dungeon.seniority'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 0 },
      defaultValue: 0,
      fieldName: 'bossCount',
      label: $t('jx3.dungeon.bossCount'),
      help: $t('jx3.dungeon.bossCountHelp'),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'remark',
      label: $t('jx3.dungeon.remark'),
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
        options: useVersionOptions(),
      },
      fieldName: 'version',
      label: $t('jx3.dungeon.version'),
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
      field: 'version',
      title: $t('jx3.dungeon.version'),
      width: 130,
    },
    {
      field: 'dungeonName',
      title: $t('jx3.dungeon.dungeonName'),
      width: 150,
    },
    {
      field: 'playerCount',
      formatter: ({ cellValue }) => {
        const option = playerCountOptions.find((item) => item.value === cellValue);
        return option?.label ?? cellValue;
      },
      title: $t('jx3.dungeon.playerCount'),
      width: 90,
    },
    {
      field: 'price',
      title: $t('jx3.dungeon.price'),
      width: 80,
    },
    {
      field: 'seniority',
      title: $t('jx3.dungeon.seniority'),
      width: 80,
    },
    {
      field: 'bossCount',
      title: $t('jx3.dungeon.bossCount'),
      width: 90,
    },
    {
      field: 'remark',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: $t('jx3.dungeon.remark'),
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
