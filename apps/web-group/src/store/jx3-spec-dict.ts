import type { Jx3SpecApi } from '#/api/jx3/spec';
import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import { getSpecOptions } from '#/api/jx3/spec';

function toSpecMeta(option: Jx3SpecApi.SpecOption): Jx3TeamApi.AvailableCharacterSpecMeta {
  return {
    position: option.position,
    sectId: '',
    sectName: option.sectName,
    specAlias: option.specAlias ?? option.label,
    specIcon: option.specIcon ?? '',
  };
}

function buildSpecDict(
  options: Jx3SpecApi.SpecOption[],
): Jx3TeamApi.AvailableCharacterSpecDict {
  const dict: Jx3TeamApi.AvailableCharacterSpecDict = {};
  for (const option of options) {
    dict[option.value] = toSpecMeta(option);
  }
  return dict;
}

export const useJx3SpecDictStore = defineStore('jx3-spec-dict', () => {
  const specDict = ref<Jx3TeamApi.AvailableCharacterSpecDict>({});
  const specOptionList = ref<Jx3SpecApi.SpecOption[]>([]);
  const loaded = ref(false);
  const loading = ref(false);
  let loadPromise: Promise<void> | null = null;

  const specOptions = computed(() =>
    Object.entries(specDict.value).map(([specId, meta]) => ({
      specId,
      specAlias: meta.specAlias,
      specIcon: meta.specIcon,
      position: meta.position,
    })),
  );

  async function refresh(): Promise<void> {
    loading.value = true;
    try {
      const list = await getSpecOptions();
      specOptionList.value = list;
      specDict.value = buildSpecDict(list);
      loaded.value = true;
    } finally {
      loading.value = false;
      loadPromise = null;
    }
  }

  async function ensureLoaded(): Promise<void> {
    if (loaded.value) return;
    if (loadPromise) {
      await loadPromise;
      return;
    }
    loadPromise = refresh();
    await loadPromise;
  }

  function removeSpec(id: string): void {
    if (!specDict.value[id]) return;
    const next = { ...specDict.value };
    delete next[id];
    specDict.value = next;
  }

  return {
    ensureLoaded,
    loaded,
    loading,
    refresh,
    removeSpec,
    specDict,
    specOptionList,
    specOptions,
  };
});
