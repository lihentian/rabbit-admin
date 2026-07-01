import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace Jx3CharacterApi {
  export interface Character {
    accountId: string;
    characterName: string;
    gameArea: string;
    gameServerId: string;
    id: string;
  }

  export interface CharacterSpec {
    characterId?: string;
    combatPower: number;
    id: string;
    isCw?: boolean | number;
    specId: string;
    specAlias?: string;
  }
}

async function getCharacterList(params: Recordable<any>) {
  const res = await requestClient.get('/jx3/characters', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getCharacterForm(id: string) {
  return requestClient.get<Jx3CharacterApi.Character>(
    `/jx3/characters/${id}/form`,
  );
}

async function createCharacter(data: Recordable<any>) {
  return requestClient.post('/jx3/characters', data);
}

async function updateCharacter(id: string, data: Recordable<any>) {
  return requestClient.put(`/jx3/characters/${id}`, data);
}

async function deleteCharacter(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/jx3/characters/${idStr}`);
}

async function getCharacterSpecs(characterId: string) {
  return requestClient.get<Jx3CharacterApi.CharacterSpec[]>(
    `/jx3/characters/${characterId}/specs`,
  );
}

async function createCharacterSpec(
  characterId: string,
  data: Recordable<any>,
) {
  return requestClient.post(`/jx3/characters/${characterId}/specs`, data);
}

async function updateCharacterSpec(
  characterId: string,
  specRowId: string,
  data: Recordable<any>,
) {
  return requestClient.put(
    `/jx3/characters/${characterId}/specs/${specRowId}`,
    data,
  );
}

async function deleteCharacterSpec(
  characterId: string,
  specRowIds: string | string[],
) {
  const idStr = Array.isArray(specRowIds) ? specRowIds.join(',') : specRowIds;
  return requestClient.delete(
    `/jx3/characters/${characterId}/specs/${idStr}`,
  );
}

export {
  createCharacter,
  createCharacterSpec,
  deleteCharacter,
  deleteCharacterSpec,
  getCharacterForm,
  getCharacterList,
  getCharacterSpecs,
  updateCharacter,
  updateCharacterSpec,
};
