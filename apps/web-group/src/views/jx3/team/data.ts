import type { VbenFormSchema } from '#/adapter/form';
import type {
  OnActionClickFn,
  OnActionClickParams,
  VxeTableGridColumns,
} from '#/adapter/vxe-table';
import type { Jx3CharacterApi } from '#/api/jx3/character';
import type { Jx3TeamApi } from '#/api/jx3/team';

import { getCharacterList, getCharacterSpecs } from '#/api/jx3/character';
import { getDungeonTemplateOptions } from '#/api/jx3/dungeon-template';
import { $t } from '#/locales';
import { useDungeonGroupedSelectProps, usePlayerCountOptions } from '#/views/jx3/dungeon/data';

export function useOpenOptions() {
  return [
    { color: 'default', label: $t('jx3.team.isOpenNo'), value: 0 },
    { color: 'success', label: $t('jx3.team.isOpenYes'), value: 1 },
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

async function getTemplateSelectOptions() {
  const list = await getDungeonTemplateOptions();
  return list.map((item) => ({
    label: item.label,
    value: item.value,
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
      component: 'ApiSelect',
      componentProps: useDungeonGroupedSelectProps(),
      fieldName: 'dungeonId',
      label: $t('jx3.team.dungeonId'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getTemplateSelectOptions,
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
      },
      fieldName: 'templateId',
      label: $t('jx3.team.templateId'),
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('jx3.team.isOpenYes'),
        checkedValue: 1,
        unCheckedChildren: $t('jx3.team.isOpenNo'),
        unCheckedValue: 0,
      },
      defaultValue: 0,
      fieldName: 'isOpen',
      label: $t('jx3.team.isOpen'),
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

export function useColumns(onActionClick: OnActionClickFn<Jx3TeamApi.Team>): VxeTableGridColumns {
  return [
    { field: 'teamName', title: $t('jx3.team.teamName'), width: 140 },
    { field: 'dungeonName', title: $t('jx3.team.dungeonId'), width: 120 },
    {
      field: 'templateName',
      formatter: ({ cellValue }) => cellValue ?? '-',
      title: $t('jx3.team.templateName'),
      minWidth: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: useOpenOptions(),
      },
      field: 'isOpen',
      title: $t('jx3.team.isOpen'),
      width: 100,
    },
    {
      field: 'memberCount',
      formatter: ({ row }) => `${row.memberCount ?? 0}/${row.playerCount ?? '-'}`,
      title: $t('jx3.team.memberPlayerCount'),
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
        },
        name: 'CellOperation',
        options: [
          { code: 'config', text: $t('jx3.team.config') },
          { code: 'members', text: $t('jx3.team.members') },
          {
            code: 'complete',
            show: (row: Jx3TeamApi.Team) => row.status !== 3,
            text: $t('jx3.team.complete'),
          },
          'edit',
          'delete',
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.team.operation'),
      width: 280,
    },
  ];
}

export function useMemberColumns(
  onLeave: (row: Jx3TeamApi.TeamMember) => void,
): VxeTableGridColumns {
  return [
    {
      align: 'left',
      field: 'account',
      slots: { default: 'member-account' },
      title: $t('jx3.account.name'),
      width: 240,
    },
    {
      align: 'left',
      field: 'password',
      slots: { default: 'member-password' },
      title: $t('jx3.account.password'),
      width: 150,
    },
    {
      align: 'left',
      field: 'serverName',
      formatter: ({ row }) => {
        const parts = [row.gameArea, row.serverName || '—'].filter(Boolean);
        return parts.length ? parts.join(' · ') : '—';
      },
      title: $t('jx3.team.gameServer'),
      minWidth: 160,
    },
    {
      field: 'characterName',
      title: $t('jx3.team.characterId'),
      width: 120,
    },
    { field: 'specAlias', title: $t('jx3.team.characterSpecId'), minWidth: 120 },
    {
      field: 'combatPower',
      title: $t('jx3.character.combatPower'),
      width: 100,
    },
    {
      field: 'coversSmallIron',
      formatter: ({ cellValue }) => (cellValue ? $t('common.yes') : $t('common.no')),
      title: $t('jx3.team.coversSmallIron'),
      width: 90,
    },
    {
      field: 'coversBigIron',
      formatter: ({ cellValue }) => (cellValue ? $t('common.yes') : $t('common.no')),
      title: $t('jx3.team.coversBigIron'),
      width: 90,
    },
    {
      field: 'coversTeam',
      formatter: ({ cellValue }) => (cellValue ? $t('common.yes') : $t('common.no')),
      title: $t('jx3.team.coversTeam'),
      width: 90,
    },
    {
      field: 'joinType',
      formatter: ({ cellValue }) => {
        const option = useJoinTypeOptions().find((item) => item.value === cellValue);
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
        },
        name: 'CellOperation',
        options: [{ code: 'leave', text: $t('jx3.team.leaveTeam') }],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.team.operation'),
      width: 100,
    },
  ];
}

export function useJoinFormSchema(isOpen = false): VbenFormSchema[] {
  const schema: VbenFormSchema[] = [
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
            shouldFetch: (params: Record<string, any>) => !!params?.characterId,
          };
        },
        async trigger(values, _formApi, controller) {
          const characterId = values.characterId;
          if (!characterId) {
            if (values.characterSpecId != null && values.characterSpecId !== '') {
              await controller.setFieldValue('characterSpecId', undefined, false);
            }
            return;
          }
          const specs = await getCharacterSpecOptions({ characterId });
          await controller.setFieldValue('characterSpecId', specs[0]?.value, false);
        },
        triggerFields: ['characterId'],
      },
      fieldName: 'characterSpecId',
      label: $t('jx3.team.characterSpecId'),
      rules: 'required',
    },
    {
      component: 'Checkbox',
      fieldName: 'coversSmallIron',
      label: $t('jx3.team.coversSmallIron'),
    },
    {
      component: 'Checkbox',
      fieldName: 'coversBigIron',
      label: $t('jx3.team.coversBigIron'),
    },
    {
      component: 'Checkbox',
      fieldName: 'coversTeam',
      label: $t('jx3.team.coversTeam'),
    },
  ];

  if (isOpen) {
    schema.splice(2, 0, {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: useJoinTypeOptions(),
      },
      defaultValue: 2,
      fieldName: 'joinType',
      label: $t('jx3.team.joinType'),
      rules: 'required',
    });
  }

  return schema;
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
    label: item.specAlias ?? item.specId,
    value: item.id,
  }));
}
