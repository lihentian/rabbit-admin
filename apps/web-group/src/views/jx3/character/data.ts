import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3CharacterApi } from '#/api/jx3/character';

import type { Jx3AccountApi } from '#/api/jx3/account';
import { getAccountList } from '#/api/jx3/account';
import { getGameServerOptions } from '#/api/jx3/game-server';
import { getSpecOptions } from '#/api/jx3/spec';
import { $t } from '#/locales';

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

export function useGameAreaOptions() {
  return [
    { label: $t('jx3.gameServer.gameAreaDual'), value: '双线' },
    { label: $t('jx3.gameServer.gameAreaTelecom'), value: '电信' },
    { label: $t('jx3.gameServer.gameAreaWujie'), value: '无界' },
  ];
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
        options: useGameAreaOptions(),
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

export function useSpecFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        api: getSpecOptions,
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
      },
      fieldName: 'specId',
      label: $t('jx3.character.specId'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 0 },
      fieldName: 'combatPower',
      label: $t('jx3.character.combatPower'),
      rules: 'required',
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
        options: useGameAreaOptions(),
      },
      fieldName: 'gameArea',
      label: $t('jx3.character.gameArea'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<Jx3CharacterApi.Character>,
): VxeTableGridColumns {
  return [
    {
      field: 'characterName',
      title: $t('jx3.character.characterName'),
      minWidth: 120,
    },
    { field: 'accountId', title: $t('jx3.character.accountId'), width: 120 },
    { field: 'gameArea', title: $t('jx3.character.gameArea'), width: 100 },
    {
      field: 'gameServerId',
      title: $t('jx3.character.gameServerId'),
      width: 120,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'characterName',
          nameTitle: $t('jx3.character.name'),
          onClick: onActionClick,
          options: [
            { code: 'detail', text: $t('jx3.character.detail') },
            'edit',
            'delete',
          ],
        },
        name: 'CellOperation',
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
): VxeTableGridColumns {
  return [
    { field: 'specName', title: $t('jx3.character.specId'), minWidth: 120 },
    {
      field: 'combatPower',
      title: $t('jx3.character.combatPower'),
      width: 120,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'specName',
          nameTitle: $t('jx3.character.specId'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.character.operation'),
      width: 130,
    },
  ];
}

export function useCdColumns(): VxeTableGridColumns {
  return [
    {
      cellRender: { name: 'CellTag' },
      field: 'cdStatus',
      title: $t('jx3.character.cdStatus'),
      width: 100,
    },
    {
      field: 'dungeonName',
      minWidth: 140,
      title: $t('jx3.character.dungeonName'),
    },
    {
      field: 'lastUsedTime',
      title: $t('jx3.character.lastUsedTime'),
      width: 170,
    },
    {
      field: 'refreshTime',
      title: $t('jx3.character.refreshTime'),
      width: 170,
    },
  ];
}
