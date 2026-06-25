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
    minTCount?: number;
    playerCount: number;
    status: number;
    teamName: string;
    templateId?: null | string;
    templateName?: string;
    specRules?: Jx3DungeonTemplateApi.SpecRule[] | null;
  }

  export interface TeamMember {
    characterId: string;
    characterName?: string;
    characterSpecId?: string;
    combatPower?: number;
    coversBigIron?: number;
    coversSmallIron?: number;
    coversTeam?: number;
    joinTime?: string;
    joinType?: number;
    position?: string;
    specAlias?: string;
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
  return requestClient.post('/jx3/teams', data);
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

async function joinTeam(teamId: string, data: Recordable<any>) {
  return requestClient.post(`/jx3/teams/${teamId}/members`, data);
}

async function leaveTeam(teamId: string, characterId: string) {
  return requestClient.delete(`/jx3/teams/${teamId}/members/${characterId}`);
}

async function completeTeam(teamId: string, force?: boolean) {
  return requestClient.post(`/jx3/teams/${teamId}/complete`, null, {
    params: force ? { force: 1 } : undefined,
  });
}

export {
  completeTeam,
  createTeam,
  deleteTeam,
  getTeamForm,
  getTeamList,
  getTeamMembers,
  joinTeam,
  leaveTeam,
  updateTeam,
};
