import type { Ref } from 'vue';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3CharacterApi } from '#/api/jx3/character';

import type { Jx3AccountApi } from '#/api/jx3/account';
import type { useJx3CharacterAccess } from '#/composables/use-jx3-character-access';
import { getAccountList } from '#/api/jx3/account';
import { getGameServerOptions } from '#/api/jx3/game-server';
import { getCharacterSpecOptions } from '#/api/jx3/character';
import { getGameAreaOptions } from '#/utils/jx3/jx';
import { $t } from '#/locales';
import { formatCombatPowerLabel } from '#/utils/jx3/combat-power';

async function getAccountOptions(params?: Record<string, any>) {
  const result = await getAccountList({
    keywords: params?.keywords,
    pageSize: 100,
  });
  return ((result.items ?? []) as Jx3AccountApi.Account[]).map((item) => ({
    label: item.account,
    value: item.id,
  }));
}

export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        api: getAccountOptions,
        class: 'w-full',
        disabled: isEdit,
        filterOption: false,
        labelField: 'label',
        showSearch: true,
        valueField: 'value',
      },
      fieldName: 'accountId',
      label: $t('jx3.character.accountId'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'characterName',
      label: $t('jx3.character.characterName'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: getGameAreaOptions(),
      },
      fieldName: 'gameArea',
      label: $t('jx3.character.gameArea'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getGameServerOptions,
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
      },
      dependencies: {
        componentProps(values) {
          return {
            api: getGameServerOptions,
            params: { gameArea: values.gameArea },
            shouldFetch: (params: Record<string, any>) => !!params?.gameArea,
          };
        },
        triggerFields: ['gameArea'],
      },
      fieldName: 'gameServerId',
      label: $t('jx3.character.gameServerId'),
      rules: 'required',
    },
  ];
}

export function useSpecFormSchema(
  characterId: Ref<string | undefined>,
  excludeSpecRowId: Ref<string | undefined>,
): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          const id = characterId.value;
          if (!id) return [];
          return getCharacterSpecOptions(id, excludeSpecRowId.value);
        },
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
      },
      fieldName: 'specId',
      label: $t('jx3.character.specId'),
      rules: 'required',
    },
    {
      component: 'CombatPowerInput',
      componentProps: { class: 'w-full', min: 0 },
      defaultValue: 0,
      fieldName: 'combatPower',
      label: $t('jx3.character.combatPower'),
      rules: 'required',
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'isCw',
      label: $t('jx3.dungeonTemplate.isCw'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('jx3.character.keywords'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getGameAreaOptions(),
      },
      fieldName: 'gameArea',
      label: $t('jx3.character.gameArea'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<Jx3CharacterApi.Character>,
  access?: ReturnType<typeof useJx3CharacterAccess>,
): VxeTableGridColumns {
  return [
    {
      field: 'characterName',
      title: $t('jx3.character.characterName'),
      width: 120,
    },
    {
      field: 'account',
      formatter: ({ cellValue }) => cellValue ?? '-',
      title: $t('jx3.character.accountId'),
      minWidth: 120,
    },
    { field: 'gameArea', title: $t('jx3.character.gameArea'), width: 100 },
    {
      field: 'serverName',
      formatter: ({ cellValue }) => cellValue ?? '-',
      title: $t('jx3.character.gameServerId'),
      minWidth: 120,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'characterName',
          nameTitle: $t('jx3.character.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            show: () => access?.canSpecList.value ?? false,
            text: $t('jx3.character.detail'),
          },
          {
            code: 'edit',
            show: () => access?.canUpdate.value ?? false,
          },
          {
            code: 'delete',
            show: () => access?.canDelete.value ?? false,
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.character.operation'),
      width: 200,
    },
  ];
}

export function useSpecColumns(
  onActionClick: OnActionClickFn<Jx3CharacterApi.CharacterSpec>,
  access?: ReturnType<typeof useJx3CharacterAccess>,
  specCount?: Ref<number>,
): VxeTableGridColumns {
  return [
    { field: 'specAlias', title: $t('jx3.character.specId'), minWidth: 120 },
    {
      field: 'combatPower',
      formatter: ({ cellValue }) =>
        formatCombatPowerLabel(cellValue, $t('jx3.team.combatPowerUnit')),
      title: $t('jx3.character.combatPower'),
      minWidth: 120,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'warning', label: $t('jx3.dungeonTemplate.isCwShort'), value: 1 },
        ],
      },
      field: 'isCw',
      title: $t('jx3.dungeonTemplate.isCw'),
      width: 90,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'specAlias',
          nameTitle: $t('jx3.character.specId'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: () => access?.canSpecUpdate.value ?? false,
          },
          {
            code: 'delete',
            show: () =>
              (access?.canSpecDelete.value ?? false) && (specCount?.value ?? 0) > 1,
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.character.operation'),
      width: 130,
    },
  ];
}
