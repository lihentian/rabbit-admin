import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickParams, OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3CharacterApi } from '#/api/jx3/character';
import type { Jx3TeamApi } from '#/api/jx3/team';

import { getCharacterList, getCharacterSpecs } from '#/api/jx3/character';
import { getDungeonOptions } from '#/api/jx3/dungeon';
import { usePlayerCountOptions } from '#/views/jx3/dungeon/data';
import { $t } from '#/locales';

export function useBuildTypeOptions() {
  return [
    { label: $t('jx3.team.buildTypeSelf'), value: 1 },
    { label: $t('jx3.team.buildTypeService'), value: 2 },
    { label: $t('jx3.team.buildTypeMixed'), value: 3 },
  ];
}

export function useTeamStatusOptions() {
  return [
    { color: 'processing', label: $t('jx3.team.statusRecruiting'), value: 1 },
    { color: 'warning', label: $t('jx3.team.statusFull'), value: 2 },
    { color: 'success', label: $t('jx3.team.statusCompleted'), value: 3 },
  ];
}

export function useJoinTypeOptions() {
  return [
    { label: $t('jx3.team.joinTypeSelf'), value: 1 },
    { label: $t('jx3.team.joinTypeService'), value: 2 },
  ];
}

async function getDungeonSelectOptions() {
  const list = await getDungeonOptions();
  return list.map((item) => ({
    label: `${item.label}（${item.playerCount}${$t('jx3.dungeon.playerCountUnit')}）`,
    value: item.value,
    playerCount: item.playerCount,
  }));
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'teamName',
      label: $t('jx3.team.teamName'),
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: useBuildTypeOptions(),
        optionType: 'button',
      },
      defaultValue: 2,
      fieldName: 'buildType',
      label: $t('jx3.team.buildType'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getDungeonSelectOptions,
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
      },
      fieldName: 'dungeonId',
      label: $t('jx3.team.dungeonId'),
      rules: 'required',
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('jx3.team.keywords'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: usePlayerCountOptions(),
      },
      fieldName: 'playerCount',
      label: $t('jx3.dungeon.playerCount'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: useTeamStatusOptions().map(({ label, value }) => ({
          label,
          value,
        })),
      },
      fieldName: 'status',
      label: $t('jx3.team.status'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<Jx3TeamApi.Team>,
): VxeTableGridColumns {
  return [
    { field: 'teamName', title: $t('jx3.team.teamName'), minWidth: 140 },
    {
      field: 'buildType',
      formatter: ({ cellValue }) => {
        const option = useBuildTypeOptions().find(
          (item) => item.value === cellValue,
        );
        return option?.label ?? cellValue;
      },
      title: $t('jx3.team.buildType'),
      width: 110,
    },
    { field: 'dungeonName', title: $t('jx3.team.dungeonId'), minWidth: 120 },
    {
      field: 'memberCount',
      formatter: ({ row }) => `${row.memberCount ?? 0}/${row.playerCount ?? '-'}`,
      title: `${$t('jx3.team.memberCount')}/${$t('jx3.dungeon.playerCount')}`,
      width: 110,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: useTeamStatusOptions(),
      },
      field: 'status',
      title: $t('jx3.team.status'),
      width: 100,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'teamName',
          nameTitle: $t('jx3.team.name'),
          onClick: onActionClick,
          options: [
            { code: 'members', text: $t('jx3.team.members') },
            'edit',
            'delete',
          ],
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.team.operation'),
      width: 200,
    },
  ];
}

export function useMemberColumns(
  onLeave: (row: Jx3TeamApi.TeamMember) => void,
): VxeTableGridColumns {
  return [
    {
      field: 'characterName',
      title: $t('jx3.team.characterId'),
      minWidth: 120,
    },
    { field: 'specName', title: $t('jx3.team.characterSpecId'), width: 120 },
    {
      field: 'combatPower',
      title: $t('jx3.character.combatPower'),
      width: 100,
    },
    {
      field: 'joinType',
      formatter: ({ cellValue }) => {
        const option = useJoinTypeOptions().find(
          (item) => item.value === cellValue,
        );
        return option?.label ?? cellValue;
      },
      title: $t('jx3.team.joinType'),
      width: 100,
    },
    { field: 'joinTime', title: $t('jx3.team.joinTime'), width: 170 },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'characterName',
          nameTitle: $t('jx3.team.characterId'),
          onClick: ({ code, row }: OnActionClickParams<Jx3TeamApi.TeamMember>) => {
            if (code === 'leave') {
              onLeave(row);
            }
          },
          options: [{ code: 'leave', text: $t('jx3.team.leaveTeam') }],
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.team.operation'),
      width: 100,
    },
  ];
}

export function useJoinFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        api: getCharacterOptions,
        class: 'w-full',
        filterOption: false,
        labelField: 'label',
        showSearch: true,
        valueField: 'value',
      },
      fieldName: 'characterId',
      label: $t('jx3.team.characterId'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
      },
      dependencies: {
        componentProps(values) {
          return {
            api: getCharacterSpecOptions,
            params: { characterId: values.characterId },
            shouldFetch: (params: Record<string, any>) =>
              !!params?.characterId,
          };
        },
        triggerFields: ['characterId'],
      },
      fieldName: 'characterSpecId',
      label: $t('jx3.team.characterSpecId'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: useJoinTypeOptions(),
      },
      defaultValue: 1,
      fieldName: 'joinType',
      label: $t('jx3.team.joinType'),
      rules: 'required',
    },
  ];
}

async function getCharacterOptions(params?: Record<string, any>) {
  const result = await getCharacterList({
    keywords: params?.keywords,
    pageSize: 100,
  });
  return ((result.items ?? []) as Jx3CharacterApi.Character[]).map((item) => ({
    label: item.characterName,
    value: item.id,
  }));
}

async function getCharacterSpecOptions(params?: Record<string, any>) {
  if (!params?.characterId) return [];
  const specs = await getCharacterSpecs(params.characterId);
  return specs.map((item) => ({
    label: item.specName ?? item.specId,
    value: item.id,
  }));
}
