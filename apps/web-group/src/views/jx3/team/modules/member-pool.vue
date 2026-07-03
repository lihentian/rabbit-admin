<script lang="ts" setup>
import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, onMounted, ref, watch } from 'vue';

import { useElementSize, useLocalStorage, useVirtualList } from '@vueuse/core';
import { Input } from 'antdv-next';

import { getSpecOptions } from '#/api/jx3/spec';
import { $t } from '#/locales';

import { enrichAvailableSpec } from '../utils/enrich-available-character';
import { getCdConflictMessage, hasCdConflict } from '../utils/use-cd-conflict';
import {
  POOL_CARD_MIN_WIDTH,
  POOL_GRID_GAP,
  POOL_ROW_HEIGHT,
} from './member-card.constants';
import MemberCard from './member-card.vue';

type PositionFilter = 'all' | 'd' | 'n' | 't';

interface SpecFilterOption {
  position?: string;
  specAlias?: string;
  specIcon?: null | string;
  specId: string;
}

const props = defineProps<{
  characters: Jx3TeamApi.AvailableCharacterSlim[];
  draggingCharacterId?: string;
  draggingCharacterSpecId?: string;
  draggingSource?: 'pool' | 'slot';
  slottedCharacterIds: Set<string>;
  specDict: Jx3TeamApi.AvailableCharacterSpecDict;
  teamContext?: {
    cdLimitEnabled: boolean;
    dungeonId: string;
    id: string;
  };
}>();
const emit = defineEmits<{
  pickup: [character: Jx3TeamApi.AvailableCharacter, event: PointerEvent];
}>();
const POOL_ATTR_FILTER_CD_KEY = 'jx3-team-pool-filter-cd';
const POOL_ATTR_FILTER_CW_KEY = 'jx3-team-pool-filter-cw';

const scrollContainerRef = ref<HTMLElement | null>(null);
const { width: scrollWidth } = useElementSize(scrollContainerRef);

const positionFilter = ref<PositionFilter>('all');
const specFilterId = ref<null | string>(null);
const filterCd = useLocalStorage(POOL_ATTR_FILTER_CD_KEY, true);
const filterCw = useLocalStorage(POOL_ATTR_FILTER_CW_KEY, false);
const allSpecOptions = ref<SpecFilterOption[]>([]);
const searchKeyword = ref('');

const positionOptions = computed(() => [
  { label: $t('jx3.team.poolPositionAll'), value: 'all' as const },
  { label: $t('jx3.spec.positionT'), value: 't' as const },
  { label: $t('jx3.spec.positionN'), value: 'n' as const },
  { label: $t('jx3.spec.positionD'), value: 'd' as const },
]);

function toPoolEntry(
  char: Jx3TeamApi.AvailableCharacterSlim,
  spec: Jx3TeamApi.AvailableCharacterSpecSlim,
): Jx3TeamApi.AvailableCharacter {
  return enrichAvailableSpec(char, spec, props.specDict);
}

const poolCharacters = computed(() => {
  const result: Jx3TeamApi.AvailableCharacter[] = [];
  for (const char of props.characters) {
    if (char.specs.length <= 1) {
      result.push(enrichAvailableSpec(char, char.specs[0] ?? {
        characterSpecId: char.characterSpecId,
        specId: char.specId,
        combatPower: char.combatPower,
        isCw: char.isCw,
      }, props.specDict));
      continue;
    }
    for (const spec of char.specs) {
      result.push(toPoolEntry(char, spec));
    }
  }
  return result;
});

const specFilterOptions = computed(() => {
  if (positionFilter.value === 'all') return allSpecOptions.value;
  return allSpecOptions.value.filter(
    (item) => normalizePosition(item.position) === positionFilter.value,
  );
});

watch(specFilterOptions, (options) => {
  if (specFilterId.value && !options.some((item) => item.specId === specFilterId.value)) {
    specFilterId.value = null;
  }
});

onMounted(async () => {
  const list = await getSpecOptions();
  allSpecOptions.value = list.map((item) => ({
    specId: item.value,
    specAlias: item.specAlias ?? item.label,
    specIcon: item.specIcon,
    position: item.position,
  }));
});

function normalizePosition(position?: string): Exclude<PositionFilter, 'all'> {
  const value = position?.toLowerCase();
  if (value === 't' || value === 'n' || value === 'd') return value;
  return 'd';
}

const filteredPoolCharacters = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  return poolCharacters.value
    .filter((item) => {
      if (
        positionFilter.value !== 'all' &&
        normalizePosition(item.position) !== positionFilter.value
      ) {
        return false;
      }
      if (specFilterId.value && item.specId !== specFilterId.value) {
        return false;
      }
      if (filterCd.value && resolveCdConflict(item)) {
        return false;
      }
      if (filterCw.value && !item.isCw) {
        return false;
      }
      if (!keyword) return true;
      return (
        item.characterName.toLowerCase().includes(keyword) ||
        (item.serverName?.toLowerCase().includes(keyword) ?? false) ||
        (item.specAlias?.toLowerCase().includes(keyword) ?? false) ||
        (item.accountRemark?.toLowerCase().includes(keyword) ?? false)
      );
    })
    .sort((a, b) => b.combatPower - a.combatPower);
});

const columnCount = computed(() => {
  const contentWidth = scrollWidth.value;
  if (!contentWidth) return 1;
  return Math.max(
    1,
    Math.floor((contentWidth + POOL_GRID_GAP) / (POOL_CARD_MIN_WIDTH + POOL_GRID_GAP)),
  );
});

const poolRows = computed(() => {
  const items = filteredPoolCharacters.value;
  const cols = columnCount.value;
  const rows: Jx3TeamApi.AvailableCharacter[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }
  return rows;
});

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(poolRows, {
  itemHeight: POOL_ROW_HEIGHT,
  overscan: 3,
});

const poolRowGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columnCount.value}, minmax(0, 1fr))`,
  height: `${POOL_ROW_HEIGHT}px`,
}));

watch([searchKeyword, positionFilter, specFilterId, filterCd, filterCw], () => {
  scrollTo(0);
});

function bindScrollContainer(el: unknown) {
  const node = el instanceof HTMLElement ? el : null;
  scrollContainerRef.value = node;
  containerProps.ref.value = node;
}

function isSlottedItem(item: Jx3TeamApi.AvailableCharacter) {
  return props.slottedCharacterIds.has(item.characterId);
}

function isDraggingItem(item: Jx3TeamApi.AvailableCharacter) {
  if (props.draggingSource !== 'pool') return false;
  return (
    props.draggingCharacterId === item.characterId &&
    props.draggingCharacterSpecId === item.characterSpecId
  );
}

function onPickup(character: Jx3TeamApi.AvailableCharacter, event: PointerEvent) {
  emit('pickup', character, event);
}

function toggleSpecFilter(specId: string) {
  specFilterId.value = specFilterId.value === specId ? null : specId;
}

function specFilterTitle(spec: SpecFilterOption) {
  return spec.specAlias ?? spec.specId;
}

function resolveCdConflict(item: Jx3TeamApi.AvailableCharacterSlim) {
  if (!props.teamContext) return false;
  return hasCdConflict(item, props.teamContext);
}

function resolveCdConflictMessage(item: Jx3TeamApi.AvailableCharacterSlim) {
  if (!props.teamContext) return undefined;
  return getCdConflictMessage(item, props.teamContext);
}

function poolAttrFilterBtnClass(active: boolean) {
  return active
    ? 'border-primary bg-primary/10 text-primary'
    : 'border-border/70 text-muted-foreground hover:border-primary/40';
}
</script>

<template>
  <div class="flex h-full min-h-0 w-full min-w-0 flex-col">
    <div class="mb-2 shrink-0 space-y-2">
      <!-- <div class="text-sm font-medium">{{ $t('jx3.team.characterId') }}</div> -->
      <div class="flex items-center gap-2">
        <Input
          v-model:value="searchKeyword"
          allow-clear
          class="min-w-0 flex-1 select-text"
          :placeholder="$t('jx3.team.poolSearchPlaceholder')"
        />
        <div class="flex shrink-0 gap-1">
          <button
            type="button"
            class="pool-attr-filter-btn flex size-8 items-center justify-center rounded border text-xs font-medium transition-colors"
            :class="poolAttrFilterBtnClass(filterCd)"
            @click="filterCd = !filterCd"
          >
            {{ $t('jx3.team.poolFilterCd') }}
          </button>
          <button
            type="button"
            class="pool-attr-filter-btn flex size-8 items-center justify-center rounded border text-xs font-medium transition-colors"
            :class="poolAttrFilterBtnClass(filterCw)"
            @click="filterCw = !filterCw"
          >
            {{ $t('jx3.team.poolFilterCw') }}
          </button>
        </div>
      </div>
      <div v-if="specFilterOptions.length" class="space-y-1">
        <!-- <div class="text-xs text-muted-foreground">{{ $t('jx3.team.poolSpecFilter') }}</div> -->
        <div class="grid grid-cols-[repeat(auto-fill,2rem)]">
          <button
            v-for="spec in specFilterOptions"
            :key="spec.specId"
            type="button"
            class="spec-filter-btn flex size-8 items-center justify-center rounded border border-transparent bg-transparent transition-all hover:border-primary/40 hover:bg-primary/5"
            :class="{
              'spec-filter-btn--active border-primary bg-primary/10 ring-1 ring-primary/30':
                specFilterId === spec.specId,
            }"
            :title="specFilterTitle(spec)"
            @click="toggleSpecFilter(spec.specId)"
          >
            <img
              v-if="spec.specIcon"
              :alt="spec.specAlias"
              class="size-7 object-contain"
              draggable="false"
              :src="spec.specIcon"
            />
            <span v-else class="text-xs font-medium text-muted-foreground">
              {{ spec.specAlias?.slice(0, 1) ?? '?' }}
            </span>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-1">
        <button
          v-for="option in positionOptions"
          :key="option.value"
          type="button"
          class="truncate rounded border px-2 py-1.5 text-sm transition-colors"
          :class="
            positionFilter === option.value
              ? 'border-primary bg-primary/10 font-medium text-primary'
              : 'border-border/70 text-muted-foreground hover:border-primary/40'
          "
          @click="positionFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
    <div
      class="pool-list-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-border/60"
      data-drop-pool
    >
      <div
        v-if="!poolCharacters.length"
        class="flex flex-1 items-center justify-center text-xs text-muted-foreground"
      >
        —
      </div>
      <div
        v-else-if="!filteredPoolCharacters.length"
        class="flex flex-1 items-center justify-center px-2 text-center text-xs text-muted-foreground"
      >
        {{ $t('jx3.team.poolSearchEmpty') }}
      </div>
      <div
        v-else
        class="pool-list-body pool-list-scroll h-full min-h-0 w-full px-2 py-2"
        :ref="bindScrollContainer"
        :style="containerProps.style"
        @scroll="containerProps.onScroll"
      >
        <div v-bind="wrapperProps">
          <div
            v-for="{ data: row, index } in list"
            :key="index"
            class="pool-card-row"
            :style="poolRowGridStyle"
          >
            <MemberCard
              v-for="item in row"
              :key="`${item.characterId}-${item.characterSpecId}`"
              class="min-w-0"
              :character="item"
              :cd-conflict="resolveCdConflict(item)"
              :cd-conflict-message="resolveCdConflictMessage(item)"
              :disabled="isSlottedItem(item)"
              :dragging="isDraggingItem(item)"
              :overlay="isSlottedItem(item)"
              show-account-remark
              @pickup="(e) => onPickup(item, e)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pool-list-panel,
.pool-list-body,
.pool-list-scroll {
  background: transparent;
}

.pool-list-scroll {
  overflow-x: hidden;
  scrollbar-width: none;
}

.pool-list-scroll::-webkit-scrollbar {
  display: none;
}

.pool-card-row {
  display: grid;
  gap: 0.5rem;
  align-items: start;
}

.spec-filter-btn:not(.spec-filter-btn--active):hover img {
  filter: brightness(1.12);
}
</style>
