import type { Jx3AccountApi } from '#/api/jx3/account';

import { getAccountCharacters } from '#/api/jx3/account';

import { createEmptySpec, type QuickCreateCharacterItem, type QuickCreateSpecItem } from './account-create';

function toQuickCreateSpec(
  spec: Jx3AccountApi.AccountFullUpdateSpec,
): QuickCreateSpecItem {
  return {
    combatPower: spec.combatPower,
    id: spec.id,
    isCw: !!spec.isCw,
    specId: spec.specId,
  };
}

export async function loadAccountCharacters(
  accountId: string,
): Promise<QuickCreateCharacterItem[]> {
  const characters = await getAccountCharacters(accountId);
  return characters.map((character) => ({
    bigIron: !!character.bigIron,
    characterName: character.characterName,
    gameArea: character.gameArea,
    gameServerId: character.gameServerId,
    id: character.id,
    smallIron: !!character.smallIron,
    specs: character.specs.length
      ? character.specs.map(toQuickCreateSpec)
      : [createEmptySpec()],
  }));
}
