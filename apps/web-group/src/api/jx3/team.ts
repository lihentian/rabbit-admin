import type { Recordable } from '@vben/types';

import type { Jx3DungeonTemplateApi } from './dungeon-template';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace Jx3TeamApi {
  export interface Team {
    dungeonId: string;
    dungeonName?: string;
    id: string;
    isOpen: number;
    memberCount: number;
    minNCount?: number;
    minOrangeWeapon?: null | number;
    minTCount?: number;
    playerCount: number;
    status: number;
    teamName: string;
    templateId?: null | string;
    templateName?: string;
    specRules?: Jx3DungeonTemplateApi.SpecRule[] | null;
    cdLimitEnabled?: boolean;
  }

  export interface TeamMember {
    account?: string;
    characterId: string;
    characterName?: string;
    characterSpecId?: string;
    combatPower?: number;
    coversBigIron?: number;
    coversSmallIron?: number;
    coversTeam?: number;
    gameArea?: string;
    joinSort?: null | number;
    joinTime?: string;
    joinType?: number;
    password?: string;
    position?: string;
    sectId?: string;
    sectName?: string;
    serverName?: null | string;
    specAlias?: string;
  }

  export interface AvailableCharacterSpecMeta {
    position?: string;
    sectId?: string;
    sectName?: string;
    specAlias?: string;
    specIcon?: null | string;
  }

  export type AvailableCharacterSpecDict = Record<string, AvailableCharacterSpecMeta>;

  export interface AvailableCharacterSpecSlim {
    characterSpecId: string;
    combatPower: number;
    isCw?: boolean;
    specId: string;
  }

  export interface AvailableCharacterSlim {
    accountRemark?: null | string;
    cdConflict?: string;
    characterId: string;
    characterName: string;
    characterSpecId: string;
    combatPower: number;
    isCw?: boolean;
    serverName?: string;
    specId: string;
    specs: AvailableCharacterSpecSlim[];
  }

  /** 角色池卡片展示（由 slim + specDict 派生） */
  export interface AvailableCharacter
    extends AvailableCharacterSlim,
      AvailableCharacterSpecMeta {}

  export interface AvailableCharactersResult {
    characters: AvailableCharacterSlim[];
    specDict: AvailableCharacterSpecDict;
  }

  export interface LayoutSlot {
    characterId: string;
    characterSpecId: string;
    joinSort: number;
  }

  export interface LayoutCompositionIssue {
    actual: number;
    kind?: 'composition';
    label: string;
    required: number;
  }

  export interface LayoutCdIssue {
    kind: 'cd';
    label: string;
    message: string;
  }

  export type LayoutIssue = LayoutCdIssue | LayoutCompositionIssue;

  export interface LayoutPreviewResult {
    issues: LayoutIssue[];
  }

  export interface LayoutSaveResult {
    issues: LayoutIssue[];
  }

  export interface MemberAccountInfo {
    account: string;
    characterName: string;
    gameArea: string;
    password: string;
    remark?: null | string;
    serverName?: null | string;
  }

  export interface UpdateMemberCoversPayload {
    coversBigIron?: number;
    coversSmallIron?: number;
    coversTeam?: number;
  }
}

async function getTeamList(params: Recordable<any>) {
  const res = await requestClient.get('/jx3/teams', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getTeamForm(id: string) {
  return requestClient.get<Jx3TeamApi.Team>(`/jx3/teams/${id}/form`);
}

async function createTeam(data: Recordable<any>) {
  return requestClient.post<string>('/jx3/teams', data);
}

async function updateTeam(id: string, data: Recordable<any>) {
  return requestClient.put(`/jx3/teams/${id}`, data);
}

async function deleteTeam(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/jx3/teams/${idStr}`);
}

async function getTeamMembers(teamId: string) {
  return requestClient.get<Jx3TeamApi.TeamMember[]>(
    `/jx3/teams/${teamId}/members`,
  );
}

async function getTeamAvailableCharacters(teamId: string) {
  return requestClient.get<Jx3TeamApi.AvailableCharactersResult>(
    `/jx3/teams/${teamId}/available-characters`,
  );
}

async function previewTeamMemberLayout(
  teamId: string,
  slots: Jx3TeamApi.LayoutSlot[],
) {
  return requestClient.post<Jx3TeamApi.LayoutPreviewResult>(
    `/jx3/teams/${teamId}/members/layout/preview`,
    { slots },
  );
}

async function updateTeamMemberLayout(
  teamId: string,
  slots: Jx3TeamApi.LayoutSlot[],
) {
  return requestClient.put<Jx3TeamApi.LayoutSaveResult>(
    `/jx3/teams/${teamId}/members/layout`,
    { slots },
  );
}

async function joinTeam(teamId: string, data: Recordable<any>) {
  return requestClient.post(`/jx3/teams/${teamId}/members`, data);
}

async function leaveTeam(teamId: string, characterId: string) {
  return requestClient.delete(`/jx3/teams/${teamId}/members/${characterId}`);
}

async function updateTeamMemberCovers(
  teamId: string,
  characterId: string,
  data: Jx3TeamApi.UpdateMemberCoversPayload,
) {
  return requestClient.request(
    `/jx3/teams/${teamId}/members/${characterId}/covers`,
    { data, method: 'PATCH' },
  );
}

async function getTeamMemberAccount(teamId: string, characterId: string) {
  return requestClient.get<Jx3TeamApi.MemberAccountInfo>(
    `/jx3/teams/${teamId}/members/${characterId}/account`,
  );
}

async function completeTeam(teamId: string, force?: boolean) {
  return requestClient.post(`/jx3/teams/${teamId}/complete`, {
    force: !!force,
  });
}

export {
  completeTeam,
  createTeam,
  deleteTeam,
  getTeamAvailableCharacters,
  getTeamForm,
  getTeamList,
  getTeamMemberAccount,
  getTeamMembers,
  joinTeam,
  leaveTeam,
  previewTeamMemberLayout,
  updateTeam,
  updateTeamMemberCovers,
  updateTeamMemberLayout,
};
