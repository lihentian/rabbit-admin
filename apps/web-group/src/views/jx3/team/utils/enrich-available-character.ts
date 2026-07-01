import type { Jx3TeamApi } from '#/api/jx3/team';

export function getSpecMeta(
  specDict: Jx3TeamApi.AvailableCharacterSpecDict,
  specId: string,
): Jx3TeamApi.AvailableCharacterSpecMeta {
  return specDict[specId] ?? {};
}

export function enrichAvailableCharacter(
  char: Jx3TeamApi.AvailableCharacterSlim,
  specDict: Jx3TeamApi.AvailableCharacterSpecDict,
  specId = char.specId,
): Jx3TeamApi.AvailableCharacter {
  return {
    ...char,
    ...getSpecMeta(specDict, specId),
  };
}

export function enrichAvailableSpec(
  char: Jx3TeamApi.AvailableCharacterSlim,
  spec: Jx3TeamApi.AvailableCharacterSpecSlim,
  specDict: Jx3TeamApi.AvailableCharacterSpecDict,
): Jx3TeamApi.AvailableCharacter {
  return {
    ...char,
    characterSpecId: spec.characterSpecId,
    specId: spec.specId,
    combatPower: spec.combatPower,
    isCw: !!spec.isCw,
    ...getSpecMeta(specDict, spec.specId),
  };
}
