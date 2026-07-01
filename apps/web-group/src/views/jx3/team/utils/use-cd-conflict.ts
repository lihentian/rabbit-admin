import type { Jx3TeamApi } from '#/api/jx3/team';

export function hasCdConflict(
  character: Pick<Jx3TeamApi.AvailableCharacter, 'activeTeams' | 'characterId'>,
  team: Pick<Jx3TeamApi.Team, 'cdLimitEnabled' | 'dungeonId' | 'id'>,
): boolean {
  if (!team.cdLimitEnabled) return false;
  return (character.activeTeams ?? []).some(
    (t) =>
      t.teamId !== team.id &&
      t.dungeonId === team.dungeonId &&
      t.cdLimitEnabled,
  );
}

export function getCdConflictMessage(
  character: Pick<Jx3TeamApi.AvailableCharacter, 'activeTeams' | 'characterId'>,
  team: Pick<Jx3TeamApi.Team, 'cdLimitEnabled' | 'dungeonId' | 'id'>,
): string | undefined {
  if (!team.cdLimitEnabled) return undefined;
  const conflict = (character.activeTeams ?? []).find(
    (t) =>
      t.teamId !== team.id &&
      t.dungeonId === team.dungeonId &&
      t.cdLimitEnabled,
  );
  if (!conflict) return undefined;
  return `已在「${conflict.teamName}」同副本进行中`;
}
