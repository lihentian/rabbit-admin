import type { Jx3TeamApi } from '#/api/jx3/team';

export function hasCdConflict(
  character: Pick<Jx3TeamApi.AvailableCharacterSlim, 'cdConflict'>,
  team: Pick<Jx3TeamApi.Team, 'cdLimitEnabled'>,
): boolean {
  if (!team.cdLimitEnabled) return false;
  return !!character.cdConflict;
}

export function getCdConflictMessage(
  character: Pick<Jx3TeamApi.AvailableCharacterSlim, 'cdConflict'>,
  team: Pick<Jx3TeamApi.Team, 'cdLimitEnabled'>,
): string | undefined {
  if (!team.cdLimitEnabled || !character.cdConflict) return undefined;
  return `已在「${character.cdConflict}」同副本进行中`;
}
