import type { Jx3SpecApi } from '#/api/jx3/spec';

import ExcelJS from 'exceljs';

import { $t } from '#/locales';

export const IMPORT_HEADERS = [
  'account',
  'password',
  'server',
  'character',
  'spec',
  'combatPower',
  'remark',
] as const;

export const IMPORT_DATA_ROW_COUNT = 500;

export interface AccountImportServerOption {
  alias?: string;
  gameArea: string;
  label: string;
  serverName?: string;
  value: string;
}

export interface AccountQuickImportRow {
  account: string;
  characterName: string;
  combatPower?: number;
  password: string;
  remark?: string;
  serverText: string;
  specText: string;
}

function getHeaderLabel(key: (typeof IMPORT_HEADERS)[number]) {
  const map: Record<(typeof IMPORT_HEADERS)[number], string> = {
    account: $t('jx3.account.account'),
    character: $t('jx3.character.characterName'),
    combatPower: $t('jx3.character.combatPower'),
    password: $t('jx3.account.password'),
    remark: $t('jx3.account.remark'),
    server: $t('jx3.account.importServer'),
    spec: $t('jx3.character.specId'),
  };
  return map[key];
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return String((value as { text?: string }).text ?? '').trim();
  }
  if (value instanceof Date) return '';
  return String(value).trim();
}

function parseCombatPower(raw: string): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return undefined;
  return value;
}

const HEADER_ALIASES: Record<(typeof IMPORT_HEADERS)[number], string[]> = {
  account: ['account', '游戏账号', '账号'],
  character: ['character', '角色'],
  combatPower: ['combatPower', 'combat power', '战力'],
  password: ['password', '密码'],
  remark: ['remark', '备注'],
  server: ['server', '服务器'],
  spec: ['spec', '心法'],
};

function getHeaderAliases(key: (typeof IMPORT_HEADERS)[number]) {
  const labels = new Set([getHeaderLabel(key), ...HEADER_ALIASES[key]]);
  return [...labels];
}

function padCells(cells: string[], size: number) {
  const padded = cells.map((cell) => cell ?? '');
  while (padded.length < size) padded.push('');
  return padded;
}

export function isImportHeaderRow(cells: string[]): boolean {
  const normalized = cells.map((cell) => cell?.trim() ?? '');
  const first = normalized[0];
  if (first === getHeaderLabel('account') || first === '账号' || first === '游戏账号') {
    return true;
  }
  const serverIndex = normalized.findIndex((cell) =>
    getHeaderAliases('server').includes(cell),
  );
  if (serverIndex >= 0) return true;
  const remarkIndex = normalized.findIndex((cell) =>
    getHeaderAliases('remark').includes(cell),
  );
  return remarkIndex >= 0;
}

export function mapImportHeaderIndices(
  cells: string[],
): Partial<Record<(typeof IMPORT_HEADERS)[number], number>> | undefined {
  const normalized = cells.map((cell) => cell?.trim() ?? '');
  const indices: Partial<Record<(typeof IMPORT_HEADERS)[number], number>> = {};
  let matched = 0;

  normalized.forEach((cell, index) => {
    if (!cell) return;
    for (const key of IMPORT_HEADERS) {
      if (getHeaderAliases(key).includes(cell)) {
        indices[key] = index;
        matched++;
        break;
      }
    }
  });

  return matched >= 3 ? indices : undefined;
}

function readMappedCell(cells: string[], index?: number) {
  if (index === undefined) return undefined;
  return cells[index]?.trim() ?? '';
}

export function mapImportCells(
  cells: string[],
  headerMap?: Partial<Record<(typeof IMPORT_HEADERS)[number], number>>,
): AccountQuickImportRow | null {
  let account: string;
  let password: string;
  let serverText: string;
  let characterName: string;
  let specText: string;
  let combatPowerRaw: string | undefined;
  let remarkRaw: string | undefined;
  let hasRemarkColumn = false;

  if (headerMap) {
    account = readMappedCell(cells, headerMap.account) ?? '';
    password = readMappedCell(cells, headerMap.password) ?? '';
    serverText = readMappedCell(cells, headerMap.server) ?? '';
    characterName = readMappedCell(cells, headerMap.character) ?? '';
    specText = readMappedCell(cells, headerMap.spec) ?? '';
    combatPowerRaw = readMappedCell(cells, headerMap.combatPower);
    hasRemarkColumn = headerMap.remark !== undefined;
    remarkRaw = hasRemarkColumn ? readMappedCell(cells, headerMap.remark) : undefined;
  } else if (cells.length <= 6) {
    [account, password, serverText, characterName, specText, remarkRaw] = padCells(cells, 6);
    combatPowerRaw = undefined;
    hasRemarkColumn = cells.length >= 6;
  } else {
    [account, password, serverText, characterName, specText, combatPowerRaw, remarkRaw] =
      padCells(cells, 7);
    hasRemarkColumn = cells.length >= 7;
    if (cells.length > 7) {
      remarkRaw = [remarkRaw, ...cells.slice(7)]
        .map((cell) => cell?.trim() ?? '')
        .filter(Boolean)
        .join(' ');
    }
  }

  const row = {
    account: account?.trim() ?? '',
    characterName: characterName?.trim() ?? '',
    password: password?.trim() ?? '',
    remark: hasRemarkColumn ? remarkRaw?.trim() ?? '' : undefined,
    serverText: serverText?.trim() ?? '',
    specText: specText?.trim() ?? '',
  };
  const hasValue = Object.values(row).some((value) => value !== undefined && value !== '');
  if (!hasValue) return null;

  const combatPower = parseCombatPower(combatPowerRaw?.trim() ?? '');
  return combatPower === undefined ? row : { ...row, combatPower };
}

export function parseImportText(text: string): AccountQuickImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rows: AccountQuickImportRow[] = [];
  let headerMap: Partial<Record<(typeof IMPORT_HEADERS)[number], number>> | undefined;

  for (const line of lines) {
    const cells = line.split('\t');
    if (!headerMap && isImportHeaderRow(cells)) {
      headerMap = mapImportHeaderIndices(cells);
      continue;
    }
    const row = mapImportCells(cells, headerMap);
    if (row) rows.push(row);
  }
  return rows;
}

export async function parseAccountImportWorkbook(file: File): Promise<AccountQuickImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  const sheet =
    workbook.getWorksheet('导入') ??
    workbook.worksheets[0];
  if (!sheet) return [];

  const rows: AccountQuickImportRow[] = [];
  let headerMap: Partial<Record<(typeof IMPORT_HEADERS)[number], number>> | undefined;
  sheet.eachRow((row, rowNumber) => {
    const columnCount = Math.max(row.cellCount, IMPORT_HEADERS.length);
    const cells = Array.from({ length: columnCount }, (_, index) =>
      cellText(row.getCell(index + 1).value),
    );
    if (rowNumber === 1 && isImportHeaderRow(cells)) {
      headerMap = mapImportHeaderIndices(cells);
      return;
    }
    const parsed = mapImportCells(cells, headerMap);
    if (parsed) rows.push(parsed);
  });
  return rows;
}

export async function buildAccountImportTemplate(
  servers: AccountImportServerOption[],
  specs: Jx3SpecApi.SpecOption[],
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const serverSheet = workbook.addWorksheet('服务器');
  const specSheet = workbook.addWorksheet('心法');
  const importSheet = workbook.addWorksheet('导入');

  serverSheet.getCell('A1').value = $t('jx3.account.importServer');
  servers.forEach((server, index) => {
    serverSheet.getCell(index + 2, 1).value = server.alias || server.label;
  });
  serverSheet.state = 'veryHidden';

  specSheet.getCell('A1').value = $t('jx3.character.specId');
  specs.forEach((spec, index) => {
    specSheet.getCell(index + 2, 1).value = spec.specAlias;
  });
  specSheet.state = 'veryHidden';

  IMPORT_HEADERS.forEach((key, index) => {
    importSheet.getCell(1, index + 1).value = getHeaderLabel(key);
    importSheet.getColumn(index + 1).width = key === 'remark' ? 40 : 14;
  });

  const serverLastRow = Math.max(servers.length + 1, 2);
  const specLastRow = Math.max(specs.length + 1, 2);
  const endRow = IMPORT_DATA_ROW_COUNT + 1;
  const importSheetWithValidation = importSheet as ExcelJS.Worksheet & {
    dataValidations: {
      add: (
        range: string,
        rule: {
          allowBlank?: boolean;
          formulae: string[];
          showErrorMessage?: boolean;
          type: string;
        },
      ) => void;
    };
  };

  importSheetWithValidation.dataValidations.add(`C2:C${endRow}`, {
    allowBlank: true,
    formulae: [`服务器!$A$2:$A$${serverLastRow}`],
    showErrorMessage: true,
    type: 'list',
  });
  importSheetWithValidation.dataValidations.add(`E2:E${endRow}`, {
    allowBlank: true,
    formulae: [`心法!$A$2:$A$${specLastRow}`],
    showErrorMessage: true,
    type: 'list',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadAccountImportTemplate(blob: Blob, filename = 'jx3-account-import-template.xlsx') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
