<script lang="ts" setup>
import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed } from 'vue';

import { Tooltip } from 'antdv-next';

import SpecIcon from '#/components/jx3/SpecIcon.vue';
import { $t } from '#/locales';
import { formatCombatPowerLabel } from '#/utils/jx3/combat-power';

import CoverBadge from './cover-badge.vue';
import { MEMBER_CARD_HEIGHT, MEMBER_CARD_HEIGHT_WITH_REMARK } from './member-card.constants';

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
  /** 徽标数据源：`smallIron` / `bigIron` 来自角色属性，`coversTeam` 仍从成员读取 */
  covers?: {
    bigIron?: boolean;
    coversTeam?: boolean;
    smallIron?: boolean;
  };
  disabled?: boolean;
  /** 拖拽源占位：变灰且不可再次拖动 */
  dragging?: boolean;
  /** 已上阵等不可用态：黑色半透明遮罩 */
  overlay?: boolean;
  /** 角色池等内部场景显示账号备注，团队面板不显示 */
  showAccountRemark?: boolean;
}>();

const emit = defineEmits<{
  pickup: [event: PointerEvent];
}>();

const cardHeight = computed(() =>
  props.showAccountRemark ? MEMBER_CARD_HEIGHT_WITH_REMARK : MEMBER_CARD_HEIGHT,
);

const accountRemarkText = computed(() => props.character.accountRemark?.trim() || '');
const accountRemarkDisplay = computed(() => accountRemarkText.value || '—');
const accountRemarkEmpty = computed(() => !accountRemarkText.value);

const combatPowerText = computed(() => {
  return formatCombatPowerLabel(props.character.combatPower, $t('jx3.team.combatPowerUnit'));
});

const inactive = computed(() => props.disabled || props.dragging);

const coverBadges = computed(() => {
  const covers = props.covers;
  if (!covers) return [];
  const badges: string[] = [];
  if (covers.smallIron) badges.push($t('jx3.team.coverBadgeSmallIron'));
  if (covers.bigIron) badges.push($t('jx3.team.coverBadgeBigIron'));
  if (covers.coversTeam) badges.push($t('jx3.team.coverBadgeTeam'));
  return badges;
});

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || inactive.value) return;
  emit('pickup', event);
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="member-card relative flex items-stretch"
    :style="{ height: `${cardHeight}px` }"
    :class="{
      'pointer-events-none': inactive,
      'member-card--overlay': overlay && !dragging,
      'member-card--dragging': dragging,
      'cursor-default': inactive,
      'cursor-grab active:cursor-grabbing': !inactive,
    }"
    @pointerdown="onPointerDown"
  >
    <Tooltip v-if="cdConflict" :title="cdConflictMessage" placement="topRight">
      <span class="member-card-cd absolute right-1 top-1 z-10 cursor-help select-none"> CD </span>
    </Tooltip>

    <div
      v-if="coverBadges.length"
      class="member-card-badges pointer-events-none absolute bottom-0.5 right-1 z-10 flex items-center gap-0.5"
    >
      <CoverBadge v-for="badge in coverBadges" :key="badge" :label="badge" size="card" />
    </div>
    <div
      class="member-card-icon-col pointer-events-none absolute bottom-1 left-0 top-0 z-10 flex w-8 flex-col items-center justify-between"
    >
      <div class="member-card-icon shrink-0">
        <SpecIcon
          :alt="character.specAlias"
          class="size-8 object-contain"
          draggable="false"
          :src="character.specIcon"
        />
      </div>
      <span v-if="character.isCw" class="member-card-cw select-none" aria-hidden="true">橙</span>
    </div>
    <div
      class="flex min-w-0 flex-1 flex-col justify-between self-stretch select-none py-1 pb-1 pl-9"
    >
      <div class="member-card-text truncate text-[16px] font-semibold leading-tight">
        {{ character.characterName }}
      </div>
      <div class="member-card-text truncate text-xs leading-tight opacity-90">
        {{ character.serverName }}
      </div>
      <div
        v-if="showAccountRemark"
        class="member-card-remark-row truncate"
        :class="{ 'member-card-remark-row--empty': accountRemarkEmpty }"
        :title="accountRemarkText"
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

.member-card--dragging .member-card-cd {
  pointer-events: none;
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
