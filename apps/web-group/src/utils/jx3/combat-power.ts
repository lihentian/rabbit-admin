const WAN = 10_000;

/** 装分原始值 → 「万」单位千分位字符串，如 152340000 → "15,234" */
export function formatCombatPowerWan(
  value: null | number | string | undefined,
): string {
  if (value === undefined || value === null || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';

  const wan = num / WAN;
  const [start, end] = `${wan}`.split('.');
  const formatted = start.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return end ? `${formatted}.${end}` : formatted;
}

/** 「万」单位千分位输入 → 装分原始值 */
export function parseCombatPowerInput(
  display: string | undefined,
): number | string {
  if (display === undefined || display === '') return '';
  const cleaned = display.replace(/,/g, '').trim();
  if (!cleaned) return '';
  const wan = Number(cleaned);
  if (Number.isNaN(wan)) return '';
  return Math.round(wan * WAN);
}

/** 只读展示：千分位 + 单位，如 152340000 → "15,234万" */
export function formatCombatPowerLabel(
  value: null | number | undefined,
  unit: string,
): string {
  if (value === undefined || value === null) return '-';
  const formatted = formatCombatPowerWan(value);
  if (!formatted) return '-';
  return `${formatted}${unit}`;
}
