import type { Recordable } from '@vben/types';

import { toPageParams, toPageResult } from '#/api/helper/pagination';
import { requestClient } from '#/api/request';

export namespace Jx3DungeonTemplateApi {
  export interface SpecRule {
    count: number;
    isCw?: boolean;
    position?: string;
    sectName?: string;
    specAlias?: string;
    specId: number;
  }

  export interface Template {
    cdLimitEnabled?: number;
    id: string;
    minNCount: number;
    minOrangeWeapon?: null | number;
    minTCount: number;
    minTotalCombatPower?: null | number;
    specRules?: null | SpecRule[];
    templateName: string;
  }

  export interface TemplateOption {
    cdLimitEnabled?: number;
    label: string;
    minNCount: number;
    minOrangeWeapon?: null | number;
    minTCount: number;
    minTotalCombatPower?: null | number;
    specRules?: null | SpecRule[];
    value: string;
  }
}

async function getDungeonTemplateList(params: Recordable<any>) {
  const res = await requestClient.get('/jx3/dungeon-templates', {
    params: toPageParams(params),
  });
  return toPageResult(res);
}

async function getDungeonTemplateForm(id: string) {
  return requestClient.get<Jx3DungeonTemplateApi.Template>(
    `/jx3/dungeon-templates/${id}/form`,
  );
}

async function createDungeonTemplate(data: Recordable<any>) {
  return requestClient.post('/jx3/dungeon-templates', data);
}

async function updateDungeonTemplate(id: string, data: Recordable<any>) {
  return requestClient.put(`/jx3/dungeon-templates/${id}`, data);
}

async function deleteDungeonTemplate(ids: string | string[]) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  return requestClient.delete(`/jx3/dungeon-templates/${idStr}`);
}

async function getDungeonTemplateOptions() {
  return requestClient.get<Jx3DungeonTemplateApi.TemplateOption[]>(
    '/jx3/dungeon-templates/options',
  );
}

export {
  createDungeonTemplate,
  deleteDungeonTemplate,
  getDungeonTemplateForm,
  getDungeonTemplateList,
  getDungeonTemplateOptions,
  updateDungeonTemplate,
};
