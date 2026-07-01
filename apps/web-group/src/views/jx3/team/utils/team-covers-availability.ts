export interface CoversMember {
  characterId: string;
  characterName?: string;
  coversBigIron?: boolean;
  coversSmallIron?: boolean;
  coversTeam?: boolean;
  sectId?: string;
}

export type CoverKey = 'coversBigIron' | 'coversSmallIron' | 'coversTeam';

export function getCoverMenuItem(
  key: CoverKey,
  member: CoversMember,
  allMembers: CoversMember[],
): { checked: boolean; visible: boolean } {
  const checked = !!member[key];
  const others = allMembers.filter((item) => item.characterId !== member.characterId);

  if (key === 'coversSmallIron') {
    const holder = others.find((item) => item.coversSmallIron);
    return { visible: !holder || checked, checked };
  }

  if (key === 'coversBigIron') {
    const holder = others.find((item) => item.coversBigIron);
    return { visible: !holder || checked, checked };
  }

  const holder = others.find(
    (item) => item.coversTeam && item.sectId && item.sectId === member.sectId,
  );
  return { visible: !holder || checked, checked };
}
