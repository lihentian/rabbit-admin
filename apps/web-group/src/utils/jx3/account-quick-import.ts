import type { Jx3SpecApi } from '#/api/jx3/spec';

import type { AccountImportServerOption, AccountQuickImportRow } from './account-import-template';

import { $t } from '#/locales';

export type QuickImportAction = 'create' | 'skip' | 'update_remark';

export interface QuickImportResolved {
  combatPower: number;
  gameArea: string;
  gameServerId: string;
  serverName: string;
  specAlias: string;
  specId: string;
}

export interface QuickImportPreviewRow {
  action?: QuickImportAction;
  errors: string[];
  resolved?: QuickImportResolved;
  row: AccountQuickImportRow;
  rowIndex: number;
  serverLine?: string;
}

function matchServerText(text: string, server: AccountImportServerOption) {
  const trimmed = text.trim();
  return (
    server.label === trimmed ||
    server.alias === trimmed ||
    server.serverName === trimmed
  );
}

function findServer(
  text: string,
  servers: AccountImportServerOption[],
): AccountImportServerOption | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const matches = servers.filter((server) => matchServerText(trimmed, server));
  if (matches.length !== 1) return undefined;
  return matches[0];
}

function findSpec(text: string, specs: Jx3SpecApi.SpecOption[]): Jx3SpecApi.SpecOption | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const matches = specs.filter((spec) => spec.specAlias === trimmed);
  if (matches.length !== 1) return undefined;
  return matches[0];
}

export function validateImportRows(
  rows: AccountQuickImportRow[],
  servers: AccountImportServerOption[],
  specs: Jx3SpecApi.SpecOption[],
): QuickImportPreviewRow[] {
  const accountRowIndex = new Map<string, number>();

  return rows.map((row, rowIndex) => {
    const errors: string[] = [];
    const account = row.account.trim();
    const password = row.password.trim();
    const serverText = row.serverText.trim();
    const characterName = row.characterName.trim();
    const specText = row.specText.trim();

    if (!account) errors.push('账号不能为空');
    if (!password) errors.push('密码不能为空');
    if (!serverText) errors.push('服务器不能为空');
    if (!characterName) errors.push('角色不能为空');
    if (!specText) errors.push('心法不能为空');

    if (account) {
      const dupIndex = accountRowIndex.get(account);
      if (dupIndex !== undefined) {
        errors.push(`本批第 ${dupIndex + 1} 行已存在相同账号`);
      } else {
        accountRowIndex.set(account, rowIndex);
      }
    }

    const serverMatches = servers.filter((server) => matchServerText(serverText, server));
    if (serverText && !serverMatches.length) {
      errors.push('服务器不存在');
    } else if (serverMatches.length > 1) {
      errors.push('服务器别名歧义');
    }

    const specMatches = specs.filter((spec) => spec.specAlias === specText);
    if (specText && !specMatches.length) {
      errors.push('心法不存在');
    } else if (specMatches.length > 1) {
      errors.push('心法别名歧义');
    }

    if (row.combatPower !== undefined) {
      const value = Number(row.combatPower);
      if (!Number.isInteger(value) || value < 0) {
        errors.push('战力须为非负整数');
      }
    }

    const server = findServer(serverText, servers);
    const spec = findSpec(specText, specs);
    const resolved =
      server && spec
        ? {
            combatPower: row.combatPower ?? 0,
            gameArea: server.gameArea,
            gameServerId: server.value,
            serverName: server.alias || server.label,
            specAlias: spec.specAlias,
            specId: spec.value,
          }
        : undefined;

    return {
      errors,
      resolved,
      row,
      rowIndex,
      serverLine: resolved ? `${resolved.gameArea} · ${resolved.serverName}` : undefined,
    };
  });
}

export function getActionLabel(action?: QuickImportAction) {
  switch (action) {
    case 'create':
      return $t('jx3.account.actionCreate');
    case 'update_remark':
      return $t('jx3.account.actionUpdateRemark');
    case 'skip':
      return $t('jx3.account.actionSkip');
    default:
      return '—';
  }
}
