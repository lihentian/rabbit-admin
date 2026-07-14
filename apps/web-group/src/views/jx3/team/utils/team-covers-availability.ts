export interface CoversMember {
  characterId: string;
  characterName?: string;
  coversTeam?: boolean;
  sectId?: string;
}

export type CoverKey = 'coversTeam';

export function getCoverMenuItem(
  key: CoverKey,
  member: CoversMember,
  allMembers: CoversMember[],
): { checked: boolean; visible: boolean } {
  const checked = !!member[key];
  const others = allMembers.filter((item) => item.characterId !== member.characterId);

  const holder = others.find(
    (item) => item.coversTeam && item.sectId && item.sectId === member.sectId,
  );
  return { visible: !holder || checked, checked };
}
