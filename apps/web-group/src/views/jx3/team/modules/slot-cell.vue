<script lang="ts" setup>
import type { SlotMember } from './member-slot-grid.vue';

import type { Jx3TeamApi } from '#/api/jx3/team';

import { $t } from '#/locales';

import { MEMBER_CARD_HEIGHT } from './member-card.constants';
import MemberCard from './member-card.vue';

type SlotCardCharacter = Pick<
  Jx3TeamApi.AvailableCharacter,
  | 'accountRemark'
  | 'characterName'
  | 'combatPower'
  | 'isCw'
  | 'serverName'
  | 'specAlias'
  | 'specIcon'
>;

defineProps<{
  cdConflict?: boolean;
  cdConflictMessage?: string;
  isDragging?: boolean;
  isDropTarget?: boolean;
  joinSort: number;
  member: SlotMember | null;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  pickup: [event: PointerEvent];
}>();

function toCardCharacter(member: SlotMember): SlotCardCharacter {
  return {
    characterName: member.characterName,
    combatPower: member.combatPower,
    isCw: !!member.isCw,
    serverName: member.serverName,
    specAlias: member.specAlias ?? '',
    specIcon: member.specIcon ?? '',
  };
}

function toCardCovers(member: SlotMember) {
  return {
    bigIron: !!member.bigIron,
    coversTeam: !!member.coversTeam,
    smallIron: !!member.smallIron,
  };
}
</script>

<template>
  <div
    class="relative rounded border border-dashed border-border/70 bg-background/50 p-1 transition-colors"
    :style="{ minHeight: `${MEMBER_CARD_HEIGHT + 8}px` }"
    :class="{
      'border-primary/50': member,
      'border-primary bg-primary/10': isDropTarget,
    }"
    :data-join-sort="joinSort"
  >
    <MemberCard
      v-if="member"
      :character="toCardCharacter(member)"
      :cd-conflict="cdConflict"
      :cd-conflict-message="cdConflictMessage"
      :covers="toCardCovers(member)"
      :disabled="readonly"
      :dragging="isDragging"
      @pickup="emit('pickup', $event)"
    />
    <div
      v-else
      class="flex flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground"
      :style="{ minHeight: `${MEMBER_CARD_HEIGHT}px` }"
    >
      <span>{{ joinSort }} · {{ $t('jx3.team.emptySlot') }}</span>
    </div>
  </div>
</template>
