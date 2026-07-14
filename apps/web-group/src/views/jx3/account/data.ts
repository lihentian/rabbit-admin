import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3AccountApi } from '#/api/jx3/account';
import type { useJx3AccountAccess } from '#/composables/use-jx3-account-access';

import { markRaw } from 'vue';

import { $t } from '#/locales';

import QuickCreateCharactersField from './modules/quick-create-characters-field.vue';

export interface FlatAccountRow {
  _rowKey: string;
  account: string;
  bigIron?: number;
  characterId?: string;
  characterName?: string;
  combatPower?: number;
  id: string;
  isCw?: number;
  password?: string;
  remark?: null | string;
  serverName?: null | string;
  serviceId: string;
  serviceName?: string;
  smallIron?: number;
  specAlias?: string;
  specIcon?: null | string;
  specId?: string;
  specRowId?: string;
  userId: string;
}

export function flattenAccounts(
  accounts: Jx3AccountApi.Account[],
): FlatAccountRow[] {
  const rows: FlatAccountRow[] = [];
  for (const account of accounts) {
    const base = {
      account: account.account,
      id: account.id,
      password: account.password,
      remark: account.remark,
      serviceId: account.serviceId,
      serviceName: account.serviceName,
      userId: account.userId,
    };
    const characters = account.characters ?? [];
    if (characters.length === 0) {
      rows.push({ ...base, _rowKey: `${account.id}::` });
      continue;
    }
    for (const character of characters) {
      const characterBase = {
        ...base,
        bigIron: character.bigIron,
        characterId: character.id,
        characterName: character.characterName,
        serverName: character.serverName,
        smallIron: character.smallIron,
      };
      const specs = character.specs ?? [];
      if (specs.length === 0) {
        rows.push({
          ...characterBase,
          _rowKey: `${account.id}:${character.id}:`,
        });
        continue;
      }
      for (const spec of specs) {
        rows.push({
          ...characterBase,
          _rowKey: `${account.id}:${character.id}:${spec.id}`,
          combatPower: spec.combatPower,
          isCw: spec.isCw,
          specAlias: spec.specAlias,
          specIcon: spec.specIcon,
          specId: spec.specId,
          specRowId: spec.id,
        });
      }
    }
  }
  return rows;
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { autocomplete: 'off', name: 'jx3-account' },
      fieldName: 'account',
      label: $t('jx3.account.account'),
      rules: 'required',
    },
    {
      component: 'InputPassword',
      componentProps: { autocomplete: 'off', name: 'jx3-password' },
      fieldName: 'password',
      label: $t('jx3.account.password'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: $t('jx3.account.remark'),
    },
    {
      component: markRaw(QuickCreateCharactersField),
      defaultValue: null,
      fieldName: 'characters',
      formItemClass: 'col-span-full w-full',
      hideLabel: true,
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: $t('jx3.account.keywordsPlaceholder'),
      },
      fieldName: 'keywords',
      label: $t('jx3.account.keywords'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<FlatAccountRow>,
  access?: ReturnType<typeof useJx3AccountAccess>,
): VxeTableGridColumns {
  return [
    {
      field: 'account',
      title: $t('jx3.account.account'),
      width: 160,
    },
    {
      align: 'left',
      field: 'password',
      slots: { default: 'password' },
      title: $t('jx3.account.password'),
      width: 200,
    },
    {
      field: 'characterName',
      formatter: ({ cellValue }) => cellValue || '—',
      title: $t('jx3.account.characterName'),
      width: 140,
    },
    {
      field: 'serverName',
      formatter: ({ cellValue }) => cellValue || '—',
      title: $t('jx3.account.serverName'),
      width: 120,
    },
    {
      align: 'left',
      field: 'spec',
      slots: { default: 'spec' },
      title: $t('jx3.account.spec'),
      width: 160,
    },
    {
      align: 'right',
      field: 'combatPower',
      slots: { default: 'combatPower' },
      title: $t('jx3.account.combatPower'),
      width: 100,
    },
    {
      align: 'center',
      field: 'covers',
      slots: { default: 'covers' },
      title: $t('jx3.account.covers'),
      width: 100,
    },
    {
      field: 'remark',
      formatter: ({ cellValue }) => cellValue?.trim() || '—',
      minWidth: 160,
      title: $t('jx3.account.remark'),
    },
    {
      field: 'serviceName',
      title: $t('jx3.account.serviceId'),
      width: 120,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'account',
          nameTitle: $t('jx3.account.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            show: () => access?.canView.value ?? false,
            text: $t('jx3.account.detail'),
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
      title: $t('jx3.account.operation'),
      width: 200,
    },
  ];
}
