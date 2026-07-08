<script lang="ts" setup>
import type { QuickCreateCharacterItem, QuickCreateSpecItem } from '#/utils/jx3/account-create';

import { onMounted, ref, watch } from 'vue';

import { Plus, X } from '@vben/icons';

import { Button, Card, Collapse, CollapsePanel, Input, Select, Switch } from 'antdv-next';
import { storeToRefs } from 'pinia';

import { getGameServerOptions } from '#/api/jx3/game-server';
import CombatPowerInput from '#/components/jx3/CombatPowerInput.vue';
import { $t } from '#/locales';
import { useJx3SpecDictStore } from '#/store/jx3-spec-dict';
import { createEmptySpec } from '#/utils/jx3/account-create';
import { EXTRA_SECT_NAMES, getGameAreaOptions } from '#/utils/jx3/jx';

const modelValue = defineModel<null | QuickCreateCharacterItem[]>({
  default: null,
});

const specDictStore = useJx3SpecDictStore();
const { specOptionList: specOptions } = storeToRefs(specDictStore);
const serverOptionsMap = ref<Record<number, Array<{ label: string; value: string }>>>({});

const gameAreaOptions = getGameAreaOptions();

function createEmptyCharacter(): QuickCreateCharacterItem {
  return {
    characterName: '',
    gameArea: undefined,
    gameServerId: undefined,
    specs: [createEmptySpec()],
  };
}

onMounted(() => {
  void specDictStore.ensureLoaded();
});

watch(
  () => modelValue.value?.map((item) => item.gameArea),
  async (areas) => {
    if (!areas || !modelValue.value) return;
    for (const [index, gameArea] of areas.entries()) {
      await loadServerOptions(index, gameArea);
    }
  },
  { deep: true },
);

async function loadServerOptions(charIndex: number, gameArea?: string) {
  if (!gameArea) {
    serverOptionsMap.value[charIndex] = [];
    return;
  }
  const list = await getGameServerOptions(gameArea);
  serverOptionsMap.value[charIndex] = list;
}

function updateCharacter<K extends keyof QuickCreateCharacterItem>(
  charIndex: number,
  field: K,
  value: QuickCreateCharacterItem[K],
) {
  const list = modelValue.value ? [...modelValue.value] : [];
  const item = list[charIndex];
  if (!item) return;
  list[charIndex] = { ...item, [field]: value };
  if (field === 'gameArea') {
    list[charIndex]!.gameServerId = undefined;
    void loadServerOptions(charIndex, value as string | undefined);
  }
  modelValue.value = list;
}

function updateSpec<K extends keyof QuickCreateSpecItem>(
  charIndex: number,
  specIndex: number,
  field: K,
  value: QuickCreateSpecItem[K],
) {
  const list = modelValue.value ? [...modelValue.value] : [];
  const character = list[charIndex];
  if (!character) return;
  const specs = [...character.specs];
  const spec = specs[specIndex];
  if (!spec) return;
  specs[specIndex] = { ...spec, [field]: value };
  list[charIndex] = { ...character, specs };
  modelValue.value = list;
}

function addCharacter() {
  const list = modelValue.value ? [...modelValue.value] : [];
  list.push(createEmptyCharacter());
  modelValue.value = list;
}

function removeCharacter(charIndex: number) {
  if (!modelValue.value?.length) return;
  const list = [...modelValue.value];
  list.splice(charIndex, 1);
  modelValue.value = list.length ? list : null;
}

function addSpec(charIndex: number) {
  const list = modelValue.value ? [...modelValue.value] : [];
  const character = list[charIndex];
  if (!character) return;
  list[charIndex] = {
    ...character,
    specs: [...character.specs, createEmptySpec()],
  };
  modelValue.value = list;
}

function removeSpec(charIndex: number, specIndex: number) {
  const list = modelValue.value ? [...modelValue.value] : [];
  const character = list[charIndex];
  if (!character || character.specs.length <= 1) return;
  const specs = [...character.specs];
  specs.splice(specIndex, 1);
  list[charIndex] = { ...character, specs };
  modelValue.value = list;
}

function resolveMainSectName(specs: QuickCreateSpecItem[]): null | string {
  for (const spec of specs) {
    if (!spec.specId) continue;
    const option = specOptions.value.find((item) => item.value === spec.specId);
    if (
      option?.sectName &&
      !(EXTRA_SECT_NAMES as readonly string[]).includes(option.sectName)
    ) {
      return option.sectName;
    }
  }
  return null;
}

function getSpecSelectOptions(charIndex: number, specIndex: number) {
  const character = modelValue.value?.[charIndex];
  if (!character) return specOptions.value;

  const usedSpecIds = new Set(
    character.specs
      .map((spec, index) => (index === specIndex ? undefined : spec.specId))
      .filter(Boolean) as string[],
  );

  let options = specOptions.value.filter((item) => !usedSpecIds.has(item.value));

  if (specIndex > 0) {
    const mainSectName = resolveMainSectName(character.specs.slice(0, specIndex));
    if (mainSectName) {
      options = options.filter(
        (item) =>
          item.sectName === mainSectName ||
          (EXTRA_SECT_NAMES as readonly string[]).includes(item.sectName),
      );
    }
  }

  return options;
}

function getCharacterTitle(charIndex: number) {
  const character = modelValue.value?.[charIndex];
  const name = character?.characterName?.trim();
  return name || `${$t('jx3.character.name')} ${charIndex + 1}`;
}
</script>

<template>
  <div class="w-full">
    <Collapse
      v-if="modelValue?.length"
      :bordered="false"
      class="quick-create-characters"
      default-active-key="0"
    >
      <CollapsePanel
        v-for="(character, charIndex) in modelValue"
        :key="charIndex"
        :header="getCharacterTitle(charIndex)"
      >
        <Card size="small" variant="borderless">
          <div class="mb-3 grid gap-3 md:grid-cols-3">
            <div>
              <div class="text-muted-foreground mb-1 text-sm">
                {{ $t('jx3.character.characterName') }}
              </div>
              <Input
                :placeholder="$t('jx3.character.characterName')"
                :value="character.characterName"
                @update:value="(v) => updateCharacter(charIndex, 'characterName', v)"
              />
            </div>
            <div>
              <div class="text-muted-foreground mb-1 text-sm">
                {{ $t('jx3.character.gameArea') }}
              </div>
              <Select
                :options="gameAreaOptions"
                :placeholder="$t('jx3.character.gameArea')"
                :value="character.gameArea"
                allow-clear
                class="w-full"
                @update:value="(v) => updateCharacter(charIndex, 'gameArea', v as string)"
              />
            </div>
            <div>
              <div class="text-muted-foreground mb-1 text-sm">
                {{ $t('jx3.character.gameServerId') }}
              </div>
              <Select
                :disabled="!character.gameArea"
                :options="serverOptionsMap[charIndex] ?? []"
                :placeholder="$t('jx3.character.gameServerId')"
                :value="character.gameServerId"
                allow-clear
                class="w-full"
                show-search
                @update:value="(v) => updateCharacter(charIndex, 'gameServerId', v as string)"
              />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div
              v-for="(spec, specIndex) in character.specs"
              :key="specIndex"
              class="spec-rule-row flex items-center gap-2"
            >
              <Select
                :options="getSpecSelectOptions(charIndex, specIndex)"
                :placeholder="$t('jx3.dungeonTemplate.specId')"
                :value="spec.specId"
                class="min-w-[140px] flex-1"
                show-search
                @update:value="(v) => updateSpec(charIndex, specIndex, 'specId', v as string)"
              />
              <CombatPowerInput
                :model-value="spec.combatPower"
                :placeholder="$t('jx3.character.combatPower')"
                class="w-[120px]! shrink-0"
                @update:model-value="(v) => updateSpec(charIndex, specIndex, 'combatPower', v)"
              />
              <div class="flex shrink-0 items-center gap-1.5">
                <span class="text-muted-foreground text-sm">
                  {{ $t('jx3.dungeonTemplate.isCw') }}
                </span>
                <Switch
                  :checked="!!spec.isCw"
                  @update:checked="(v) => updateSpec(charIndex, specIndex, 'isCw', !!v)"
                />
              </div>
              <div class="ml-3 flex shrink-0 items-center gap-1">
                <Button
                  :disabled="character.specs.length <= 1"
                  danger
                  size="small"
                  @click="removeSpec(charIndex, specIndex)"
                >
                  <X class="size-4" />
                </Button>
                <Button
                  :aria-hidden="specIndex !== character.specs.length - 1"
                  :class="{
                    invisible: specIndex !== character.specs.length - 1,
                    'pointer-events-none': specIndex !== character.specs.length - 1,
                  }"
                  :tabindex="specIndex === character.specs.length - 1 ? 0 : -1"
                  size="small"
                  type="dashed"
                  @click="addSpec(charIndex)"
                >
                  <Plus class="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div class="mt-3 flex justify-end">
            <Button danger size="small" @click="removeCharacter(charIndex)">
              {{ $t('jx3.account.removeCharacter') }}
            </Button>
          </div>
        </Card>
      </CollapsePanel>
    </Collapse>

    <Button block class="mt-2" type="dashed" @click="addCharacter">
      <Plus class="size-4" />
      {{ $t('jx3.account.addCharacter') }}
    </Button>
  </div>
</template>
