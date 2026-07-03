const WAN = 10_000;

/** 装分原始值 → 「万」单位展示值，如 280102 → "28.0102"（输入框等需保留精度） */
export function formatCombatPowerWan(value: null | number | string | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return String(num / WAN);
}

/** 装分原始值 → 「万」单位只读展示，保留一位小数，如 280102 → "28.0" */
export function formatCombatPowerDisplayWan(value: null | number | string | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return (num / WAN).toFixed(1);
}

/** 「万」单位输入 → 装分原始值 */
export function parseCombatPowerInput(display: string | undefined): number | string {
  if (display === undefined || display === '') return '';
  const cleaned = display.trim();
  if (!cleaned) return '';
  const wan = Number(cleaned);
  if (Number.isNaN(wan)) return '';
  return Math.round(wan * WAN);
}

/** 只读展示：数值 + 单位，如 280102 → "28.0万" */
export function formatCombatPowerLabel(value: null | number | undefined, unit: string): string {
  if (value === undefined || value === null) return '-';
  const formatted = formatCombatPowerDisplayWan(value);
  if (!formatted) return '-';
  return `${formatted}${unit}`;
}
