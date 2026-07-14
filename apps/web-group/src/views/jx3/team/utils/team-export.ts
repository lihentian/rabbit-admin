import type { Jx3TeamApi } from '#/api/jx3/team';

import ExcelJS from 'exceljs';

import { $t } from '#/locales';

interface ExportColumn {
  header: string;
  key: keyof ExportRow;
  style?: Partial<ExcelJS.Style>;
  width: number;
}

interface ExportRow {
  account: string;
  characterName: string;
  gameArea: string;
  password: string;
  serverName: string;
  specAlias: string;
}

function getExportColumns(): ExportColumn[] {
  const style: Partial<ExcelJS.Style> = { font: { size: 12 } };
  return [
    { header: $t('jx3.account.account'), key: 'account', width: 22, style },
    { header: $t('jx3.account.password'), key: 'password', width: 18, style },
    { header: $t('jx3.character.gameArea'), key: 'gameArea', width: 14, style },
    { header: $t('jx3.team.gameServer'), key: 'serverName', width: 16, style },
    { header: $t('jx3.character.characterName'), key: 'characterName', width: 16, style },
    { header: $t('jx3.character.specId'), key: 'specAlias', width: 14, style },
  ];
}

function sanitizeFileName(name: string) {
  return name.replaceAll(/[\\/:*?"<>|]/g, '_').trim() || 'team';
}

function buildRows(members: Jx3TeamApi.TeamMember[]): ExportRow[] {
  return [...members]
    .filter((m) => m.joinSort != null)
    .sort((a, b) => (a.joinSort ?? 0) - (b.joinSort ?? 0))
    .map((m) => ({
      account: m.account ?? '',
      characterName: m.characterName ?? '',
      gameArea: m.gameArea ?? '',
      password: m.password ?? '',
      serverName: m.serverName ?? '',
      specAlias: m.specAlias ?? '',
    }));
}

export async function exportTeamMembersXlsx(
  teamName: string,
  members: Jx3TeamApi.TeamMember[],
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sanitizeFileName(teamName).slice(0, 31) || 'team');

  const columns = getExportColumns();
  sheet.columns = columns.map(({ header, key, width, style }) => ({ header, key, width, style }));
  sheet.properties.defaultRowHeight = 20;

  for (const row of buildRows(members)) {
    sheet.addRow(row);
  }

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 12 };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(teamName)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
