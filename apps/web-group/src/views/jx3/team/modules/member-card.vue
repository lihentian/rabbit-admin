<script lang="ts" setup>
import type { CoversMember } from '../utils/team-covers-availability';

import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed } from 'vue';

import { $t } from '#/locales';

import CoverBadge from './cover-badge.vue';
import { MEMBER_CARD_HEIGHT, MEMBER_CARD_HEIGHT_WITH_REMARK } from './member-card.constants';
import MemberMenu from './member-menu.vue';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  /** CD 冲突提示（客服布局仅展示，不禁止拖拽） */
  cdConflict?: boolean;
  cdConflictMessage?: string;
  character: Pick<
    Jx3TeamApi.AvailableCharacter,
    | 'accountRemark'
    | 'characterName'
    | 'combatPower'
    | 'isCw'
    | 'serverName'
    | 'specAlias'
    | 'specIcon'
  >;
  disabled?: boolean;
  /** 拖拽源占位：变灰且不可再次拖动 */
  dragging?: boolean;
  menuContext?: {
    allMembers: CoversMember[];
    characterId: string;
    coversBigIron?: boolean;
    coversSmallIron?: boolean;
    coversTeam?: boolean;
    readonly?: boolean;
    sectId?: string;
    teamId: string;
  };
  /** 已上阵等不可用态：黑色半透明遮罩 */
  overlay?: boolean;
  /** 角色池等内部场景显示账号备注，团队面板不显示 */
  showAccountRemark?: boolean;
}>();

const emit = defineEmits<{
  coversUpdated: [
    payload: {
      coversBigIron: boolean;
      coversSmallIron: boolean;
      coversTeam: boolean;
    },
  ];
  pickup: [event: PointerEvent];
  viewAccount: [];
}>();

const cardHeight = computed(() =>
  props.showAccountRemark ? MEMBER_CARD_HEIGHT_WITH_REMARK : MEMBER_CARD_HEIGHT,
);

const accountRemarkText = computed(() => props.character.accountRemark?.trim() || '');
const accountRemarkDisplay = computed(() => accountRemarkText.value || '—');
const accountRemarkEmpty = computed(() => !accountRemarkText.value);

const combatPowerText = computed(() => `${Math.floor(props.character.combatPower / 10000)}万`);

const inactive = computed(() => props.disabled || props.dragging);

const showMemberMenu = computed(() => !!props.menuContext);

const coverBadges = computed(() => {
  const ctx = props.menuContext;
  if (!ctx) return [];
  const badges: string[] = [];
  if (ctx.coversSmallIron) badges.push($t('jx3.team.coverBadgeSmallIron'));
  if (ctx.coversBigIron) badges.push($t('jx3.team.coverBadgeBigIron'));
  if (ctx.coversTeam) badges.push($t('jx3.team.coverBadgeTeam'));
  return badges;
});

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || inactive.value) return;
  emit('pickup', event);
}
</script>

<template>
  <MemberMenu
    :all-members="menuContext?.allMembers ?? []"
    :character-id="menuContext?.characterId ?? ''"
    :covers-big-iron="menuContext?.coversBigIron"
    :covers-small-iron="menuContext?.coversSmallIron"
    :covers-team="menuContext?.coversTeam"
    :enabled="showMemberMenu"
    :readonly="!!menuContext?.readonly"
    :sect-id="menuContext?.sectId"
    :team-id="menuContext?.teamId ?? ''"
    @updated="emit('coversUpdated', $event)"
    @view-account="emit('viewAccount')"
  >
    <div
      v-bind="$attrs"
      class="member-card relative flex items-center"
      :style="{ minHeight: `${cardHeight}px` }"
      :class="{
        'pointer-events-none': inactive,
        'member-card--overlay': overlay && !dragging,
        'member-card--dragging': dragging,
        'cursor-default': inactive,
        'cursor-grab active:cursor-grabbing': !inactive,
      }"
      :title="cdConflictMessage"
      @pointerdown="onPointerDown"
    >
      <span
        v-if="cdConflict"
        class="member-card-cd pointer-events-none absolute right-1 top-1 z-10 select-none"
        aria-hidden="true"
      >
        CD
      </span>
      <div
        v-if="coverBadges.length"
        class="member-card-badges pointer-events-none absolute bottom-0.5 right-1 z-10 flex items-center gap-0.5"
      >
        <CoverBadge v-for="badge in coverBadges" :key="badge" :label="badge" size="card" />
      </div>
      <div
        class="member-card-icon-col pointer-events-none absolute bottom-2 left-1 top-1 z-10 flex w-7 flex-col items-center justify-between"
      >
        <div class="member-card-icon shrink-0">
          <img
            v-if="character.specIcon"
            :alt="character.specAlias"
            class="size-7 object-contain"
            draggable="false"
            :src="character.specIcon"
          />
          <span v-else class="member-card-text flex size-7 items-center justify-center text-xs">
            {{ character.specAlias?.slice(0, 1) ?? '?' }}
          </span>
        </div>
        <span v-if="character.isCw" class="member-card-cw select-none" aria-hidden="true">橙</span>
      </div>
      <div class="min-w-0 flex-1 select-none pl-9 pt-0.2" :class="{ 'pr-6': cdConflict }">
        <div class="member-card-text truncate text-[16px] font-semibold leading-tight">
          {{ character.characterName }}
        </div>
        <div class="member-card-text truncate text-xs leading-tight opacity-90">
          {{ character.serverName ?? '-' }}
        </div>
        <div
          v-if="showAccountRemark"
          class="member-card-remark-row truncate"
          :class="{ 'member-card-remark-row--empty': accountRemarkEmpty }"
          :title="accountRemarkText || undefined"
        >
          {{ accountRemarkDisplay }}
        </div>
      </div>
      <div
        class="member-card-text shrink-0 select-none self-center pr-2 text-sm font-semibold text-amber-200"
      >
        {{ combatPowerText }}
      </div>
    </div>
  </MemberMenu>
</template>

<style scoped>
.member-card {
  touch-action: none;
  user-select: none;
  overflow: hidden;
  background: linear-gradient(to bottom, #348e77, #236d5a);
  border: 1px solid #1a1a1a;
}

.member-card--overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.45);
}

.member-card--dragging {
  filter: grayscale(0.55) brightness(0.92);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.45);
}

.member-card-cd {
  padding: 1px 4px;
  font-size: 9px;
  font-weight: 800;
  line-height: 1.2;
  color: #fff;
  background: rgb(239 68 68 / 88%);
  border: 1px solid rgb(254 202 202 / 75%);
  border-radius: 2px;
  text-shadow: 0 1px 1px rgb(127 29 29 / 85%);
}

.member-card-text {
  color: #fff;
  text-shadow:
    0 1px 1px rgba(0, 0, 0, 0.85),
    1px 0 1px rgba(0, 0, 0, 0.85),
    -1px 0 1px rgba(0, 0, 0, 0.85),
    0 -1px 1px rgba(0, 0, 0, 0.85);
}

.member-card-remark-row {
  min-width: 0;
  margin-top: 4px;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.2;
  color: rgba(230, 245, 240, 0.92);
  background: rgba(0, 0, 0, 0.22);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.75);
}

.member-card-remark-row--empty {
  color: rgba(255, 255, 255, 0.38);
  text-shadow: none;
}

.member-card-cw {
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(
    165deg,
    #fff8dc 0%,
    #ffe566 22%,
    #ffc107 48%,
    #f5a623 72%,
    #d48806 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 3px rgba(255, 214, 64, 0.95)) drop-shadow(0 0 6px rgba(255, 193, 7, 0.55))
    drop-shadow(0 1px 1px rgba(0, 0, 0, 0.85));
}
</style>
