const WAN = 10_000;

/** 装分原始值 → 「万」单位展示值，如 280102 → "28.0102" */
export function formatCombatPowerWan(
  value: null | number | string | undefined,
): string {
  if (value === undefined || value === null || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return String(num / WAN);
}

/** 「万」单位输入 → 装分原始值 */
export function parseCombatPowerInput(
  display: string | undefined,
): number | string {
  if (display === undefined || display === '') return '';
  const cleaned = display.trim();
  if (!cleaned) return '';
  const wan = Number(cleaned);
  if (Number.isNaN(wan)) return '';
  return Math.round(wan * WAN);
}

/** 只读展示：数值 + 单位，如 280102 → "28.0102万" */
export function formatCombatPowerLabel(
  value: null | number | undefined,
  unit: string,
): string {
  if (value === undefined || value === null) return '-';
  const formatted = formatCombatPowerWan(value);
  if (!formatted) return '-';
  return `${formatted}${unit}`;
}
