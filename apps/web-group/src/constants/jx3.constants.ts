/** 与 server/src/jx3/constants/jx3.constants.ts 保持一致（数据库存储值，不做 i18n） */
export const GAME_AREAS = ['双线', '电信', '无界'] as const;

export type GameArea = (typeof GAME_AREAS)[number];

export function getGameAreaOptions() {
  return GAME_AREAS.map((value) => ({ label: value, value }));
}
