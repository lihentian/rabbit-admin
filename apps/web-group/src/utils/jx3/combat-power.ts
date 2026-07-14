export const COMBAT_POWER_ERROR = '装分须为非负整数（万）';

export function isValidCombatPower(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value) && Number.isInteger(value) && value >= 0;
}

/** 装分只读展示：数值 + 单位，如 28 → "28万" */
export function formatCombatPowerLabel(
  value: null | number | undefined,
  unit: string,
): string {
  if (value === undefined || value === null) return '-';
  return `${value}${unit}`;
}
