<script lang="ts" setup>
import { computed } from 'vue';

import { $t } from '#/locales';
import { formatCombatPowerLabel } from '#/utils/jx3/combat-power';

import { getCdConflictMessage, hasCdConflict } from '../utils/use-cd-conflict';
import { SQUAD_COLUMN_MAX_WIDTH } from './member-card.constants';
import SlotCell from './slot-cell.vue';

export interface SlotMember {
  cdConflict?: string;
  characterId: string;
  characterName: string;
  characterSpecId: string;
  combatPower: number;
  coversBigIron?: boolean;
  coversSmallIron?: boolean;
  coversTeam?: boolean;
  isCw?: boolean;
  sectId?: string;
  sectName?: string;
  serverName?: string;
  specAlias?: string;
  specIcon?: null | string;
}

interface SlotMenuContext {
  allMembers: {
    characterId: string;
    characterName: string;
    coversBigIron?: boolean;
    coversSmallIron?: boolean;
    coversTeam?: boolean;
    sectId?: string;
  }[];
  characterId: string;
  coversBigIron?: boolean;
  coversSmallIron?: boolean;
  coversTeam?: boolean;
  readonly?: boolean;
  sectId?: string;
  teamId: string;
}

const props = defineProps<{
  columnCount: number;
  draggingFromJoinSort?: number;
  dropTargetJoinSort?: number;
  playerCount: number;
  readonly?: boolean;
  slots: Record<number, null | SlotMember>;
  teamContext?: {
    cdLimitEnabled: boolean;
    dungeonId: string;
    id: string;
  };
  teamId: string;
}>();

const emit = defineEmits<{
  coversUpdated: [
    joinSort: number,
    payload: {
      coversBigIron: boolean;
      coversSmallIron: boolean;
      coversTeam: boolean;
    },
  ];
  pickup: [joinSort: number, event: PointerEvent];
  viewAccount: [characterId: string];
}>();

const rowCount = computed(() => Math.ceil(props.playerCount / props.columnCount));

const columns = computed(() =>
  Array.from({ length: props.columnCount }, (_, col) => ({
    col,
    label: `${$t('jx3.team.squad')}${col + 1}`,
    slots: Array.from({ length: rowCount.value }, (_, row) => {
      const joinSort = col * rowCount.value + row + 1;
      return {
        joinSort,
        member: props.slots[joinSort] ?? null,
      };
    }).filter((s) => s.joinSort <= props.playerCount),
  })),
);

const squadGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columnCount}, minmax(0, ${SQUAD_COLUMN_MAX_WIDTH}px))`,
}));

const squadGridWidth = computed(() => {
  const gap = 8;
  return props.columnCount * SQUAD_COLUMN_MAX_WIDTH + (props.columnCount - 1) * gap;
});

const summaryStyle = computed(() => ({
  width: `${squadGridWidth.value}px`,
}));

const totalCombatPower = computed(() =>
  Object.values(props.slots).reduce((sum, m) => sum + (m?.combatPower ?? 0), 0),
);

const totalCombatPowerText = computed(() =>
  formatCombatPowerLabel(totalCombatPower.value, $t('jx3.team.combatPowerUnit')),
);

const slottedMembers = computed(() =>
  Object.values(props.slots).filter((m): m is SlotMember => !!m),
);

const cdLimitEnabled = computed(() => !!props.teamContext?.cdLimitEnabled);

const menuContextByJoinSort = computed(() => {
  const allMembers = slottedMembers.value.map((item) => ({
    characterId: item.characterId,
    characterName: item.characterName,
    coversBigIron: item.coversBigIron,
    coversSmallIron: item.coversSmallIron,
    coversTeam: item.coversTeam,
    sectId: item.sectId,
  }));
  const map = new Map<number, SlotMenuContext>();
  for (const [joinSortStr, member] of Object.entries(props.slots)) {
    if (!member) continue;
    map.set(Number(joinSortStr), {
      allMembers,
      characterId: member.characterId,
      coversBigIron: member.coversBigIron,
      coversSmallIron: member.coversSmallIron,
      coversTeam: member.coversTeam,
      readonly: props.readonly,
      sectId: member.sectId,
      teamId: props.teamId,
    });
  }
  return map;
});

function findHolders(key: 'coversBigIron' | 'coversSmallIron'): string[] {
  return slottedMembers.value.filter((m) => m[key]).map((m) => m.characterName);
}

function formatHolders(names: string[]): string {
  if (!names.length) return '';
  return names.join('、');
}

function formatCoverTeamHolder(member: SlotMember): string {
  const sect = member.sectName?.trim();
  return sect ? `${sect}-${member.characterName}` : member.characterName;
}

const smallIronHolder = computed(() => formatHolders(findHolders('coversSmallIron')));
const bigIronHolder = computed(() => formatHolders(findHolders('coversBigIron')));
const teamCoverHolders = computed(() =>
  formatHolders(slottedMembers.value.filter((m) => m.coversTeam).map(formatCoverTeamHolder)),
);
const teamCoverTitle = computed(() => teamCoverHolders.value || undefined);

function onPickup(joinSort: number, event: PointerEvent) {
  emit('pickup', joinSort, event);
}

function onCoversUpdated(
  joinSort: number,
  payload: {
    coversBigIron: boolean;
    coversSmallIron: boolean;
    coversTeam: boolean;
  },
) {
  emit('coversUpdated', joinSort, payload);
}

function resolveCdConflict(member: SlotMember) {
  if (!cdLimitEnabled.value) return false;
  return hasCdConflict(member, props.teamContext!);
}

function resolveCdConflictMessage(member: SlotMember) {
  if (!cdLimitEnabled.value || !member.cdConflict) return undefined;
  return getCdConflictMessage(member, props.teamContext!);
}
</script>

<template>
  <div class="flex w-fit flex-col">
    <div class="grid gap-2" :style="squadGridStyle">
      <div v-for="column in columns" :key="column.col" class="space-y-1">
        <div class="text-center text-xs text-muted-foreground">{{ column.label }}</div>
        <SlotCell
          v-for="slot in column.slots"
          :key="slot.joinSort"
          :cd-conflict="slot.member ? resolveCdConflict(slot.member) : false"
          :cd-conflict-message="slot.member ? resolveCdConflictMessage(slot.member) : undefined"
          :is-dragging="draggingFromJoinSort === slot.joinSort"
          :is-drop-target="dropTargetJoinSort === slot.joinSort"
          :join-sort="slot.joinSort"
          :member="slot.member"
          :menu-context="menuContextByJoinSort.get(slot.joinSort)"
          :readonly="readonly"
          @covers-updated="(payload: { coversBigIron: boolean; coversSmallIron: boolean; coversTeam: boolean }) => onCoversUpdated(slot.joinSort, payload)"
          @pickup="(e: PointerEvent) => onPickup(slot.joinSort, e)"
          @view-account="emit('viewAccount', $event)"
        />
      </div>
    </div>
    <div class="team-summary mt-2 shrink-0" :style="summaryStyle">
      <div class="team-summary-stats">
        <div class="team-summary-stat">
          <span class="team-summary-label">{{ $t('jx3.team.summaryCombatPower') }}</span>
          <span class="team-summary-value team-summary-value--cp">{{ totalCombatPowerText }}</span>
        </div>
        <div class="team-summary-stat">
          <span class="team-summary-label">{{ $t('jx3.team.summarySmallIron') }}</span>
          <span v-if="smallIronHolder" class="team-summary-value">{{ smallIronHolder }}</span>
        </div>
        <div class="team-summary-stat">
          <span class="team-summary-label">{{ $t('jx3.team.summaryBigIron') }}</span>
          <span v-if="bigIronHolder" class="team-summary-value">{{ bigIronHolder }}</span>
        </div>
      </div>
      <div class="team-summary-team" :title="teamCoverTitle">
        <span class="team-summary-label">{{ $t('jx3.team.summaryCoversTeam') }}</span>
        <span v-if="teamCoverHolders" class="team-summary-value team-summary-value--team">
          {{ teamCoverHolders }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.team-summary {
  padding: 10px 12px;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(to bottom, #348e77, #236d5a);
  border: 1px solid #1a1a1a;
  border-radius: 6px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.12);
}

.team-summary-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.team-summary-stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
  min-height: 56px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.22);
  border-radius: 4px;
}

.team-summary-label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  color: rgba(230, 245, 240, 0.78);
  letter-spacing: 0.04em;
}

.team-summary-value {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.75);
  word-break: break-word;
}

.team-summary-value--cp {
  font-size: 17px;
  font-weight: 700;
  color: #fde68a;
}

.team-summary-value--team {
  line-height: 1.5;
}

.team-summary-team {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.16);
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 4px;
}
</style>
