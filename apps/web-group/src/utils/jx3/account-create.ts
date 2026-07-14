import type { Jx3AccountApi } from '#/api/jx3/account';

import { message } from 'antdv-next';

import { $t } from '#/locales';

export interface QuickCreateSpecItem {
  combatPower?: number;
  id?: string;
  isCw?: boolean;
  specId?: string;
}

export interface QuickCreateCharacterItem {
  bigIron?: boolean;
  characterName?: string;
  gameArea?: string;
  gameServerId?: string;
  id?: string;
  smallIron?: boolean;
  specs: QuickCreateSpecItem[];
}

export function createEmptySpec(): QuickCreateSpecItem {
  return { combatPower: 0, isCw: false, specId: undefined };
}

export function hasSpecValue(spec: QuickCreateSpecItem): boolean {
  if (spec.specId || spec.isCw) return true;
  return spec.combatPower != null && spec.combatPower !== 0;
}

export function hasCharacterValue(character: QuickCreateCharacterItem): boolean {
  return !!(
    character.characterName?.trim() ||
    character.gameArea ||
    character.gameServerId ||
    character.specs?.some(hasSpecValue)
  );
}

export function normalizeCharacters(
  characters: null | QuickCreateCharacterItem[] | undefined,
): QuickCreateCharacterItem[] {
  if (!characters?.length) return [];
  return characters.filter(hasCharacterValue);
}

export function validateCharacters(characters: QuickCreateCharacterItem[]): boolean {
  for (const [index, character] of characters.entries()) {
    const label = `${$t('jx3.character.name')} ${index + 1}`;
    if (!character.characterName?.trim()) {
      message.error(`${label}: ${$t('jx3.character.characterName')}`);
      return false;
    }
    if (!character.gameArea) {
      message.error(`${label}: ${$t('jx3.character.gameArea')}`);
      return false;
    }
    if (!character.gameServerId) {
      message.error(`${label}: ${$t('jx3.character.gameServerId')}`);
      return false;
    }

    const specsWithValue = character.specs.filter(hasSpecValue);
    if (!specsWithValue.length) {
      message.error(`${label}: ${$t('jx3.account.specsRequired')}`);
      return false;
    }

    for (const [specIndex, spec] of specsWithValue.entries()) {
      const specLabel = `${label} / ${$t('jx3.character.specId')} ${specIndex + 1}`;
      if (!spec.specId) {
        message.error(`${specLabel}: ${$t('jx3.character.specId')}`);
        return false;
      }
      if (spec.combatPower === undefined || spec.combatPower === null) {
        message.error(`${specLabel}: ${$t('jx3.character.combatPower')}`);
        return false;
      }
    }
  }

  return true;
}

export function buildFullPayload(
  values: Record<string, any>,
  characters: QuickCreateCharacterItem[],
): Jx3AccountApi.AccountFullPayload {
  return {
    account: values.account,
    characters: characters.map((character) => ({
      bigIron: character.bigIron ? 1 : 0,
      characterName: character.characterName!.trim(),
      gameArea: character.gameArea!,
      gameServerId: character.gameServerId!,
      smallIron: character.smallIron ? 1 : 0,
      specs: character.specs
        .filter(hasSpecValue)
        .map((spec) => ({
          combatPower: Number(spec.combatPower),
          isCw: spec.isCw ? 1 : 0,
          specId: spec.specId!,
        })),
    })),
    password: values.password,
    remark: values.remark,
  };
}

export function buildFullUpdatePayload(
  values: Record<string, any>,
  characters: QuickCreateCharacterItem[],
): Jx3AccountApi.AccountFullUpdatePayload {
  return {
    account: values.account,
    characters: characters.map((character) => ({
      bigIron: character.bigIron ? 1 : 0,
      characterName: character.characterName!.trim(),
      gameArea: character.gameArea!,
      gameServerId: character.gameServerId!,
      id: character.id,
      smallIron: character.smallIron ? 1 : 0,
      specs: character.specs
        .filter(hasSpecValue)
        .map((spec) => ({
          combatPower: Number(spec.combatPower),
          id: spec.id,
          isCw: spec.isCw ? 1 : 0,
          specId: spec.specId!,
        })),
    })),
    password: values.password,
    remark: values.remark,
  };
}
