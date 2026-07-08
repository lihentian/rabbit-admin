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
  const specDictData = ref<Jx3TeamApi.AvailableCharacterSpecDict>({});
  const specOptionListData = ref<Jx3SpecApi.SpecOption[]>([]);
  const loaded = ref(false);
  const loading = ref(false);

  let loadTask: Promise<void> | undefined;

  async function load(): Promise<void> {
    if (loaded.value) return;
    if (loadTask) return loadTask;

    loadTask = (async () => {
      loading.value = true;
      try {
        const list = await getSpecOptions();
        specOptionListData.value = list;
        specDictData.value = buildSpecDict(list);
        loaded.value = true;
      } catch {
        // 鉴权失效或网络异常时不抛出
        loadTask = undefined;
      } finally {
        loading.value = false;
      }
    })();

    return loadTask;
  }

  async function refresh(): Promise<void> {
    loaded.value = false;
    loadTask = undefined;
    await load();
  }

  const specDict = computed(() => specDictData.value);

  const specOptionList = computed(() => specOptionListData.value);

  const specOptions = computed(() =>
    Object.entries(specDict.value).map(([specId, meta]) => ({
      specId,
      specAlias: meta.specAlias,
      specIcon: meta.specIcon,
      position: meta.position,
    })),
  );

  function getSpecMeta(specId: string): Jx3TeamApi.AvailableCharacterSpecMeta {
    return (
      specDictData.value[specId] ?? {
        specAlias: specId,
        specIcon: '',
        sectId: '',
        sectName: '',
        position: '',
      }
    );
  }

  function removeSpec(id: string): void {
    if (!specDictData.value[id]) return;
    const next = { ...specDictData.value };
    delete next[id];
    specDictData.value = next;
    specOptionListData.value = specOptionListData.value.filter((item) => item.value !== id);
  }

  function $reset() {
    specDictData.value = {};
    specOptionListData.value = [];
    loaded.value = false;
    loading.value = false;
    loadTask = undefined;
  }

  void load();

  return {
    $reset,
    getSpecMeta,
    load,
    loaded,
    loading,
    refresh,
    removeSpec,
    specDict,
    specOptionList,
    specOptions,
  };
});
