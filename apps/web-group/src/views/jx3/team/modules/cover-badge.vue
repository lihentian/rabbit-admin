<script lang="ts" setup>
import { computed } from 'vue';

import { COVER_BADGE_SIZE_CARD, COVER_BADGE_SIZE_MENU } from './member-card.constants';

const props = withDefaults(
  defineProps<{
    label: string;
    size?: 'card' | 'menu';
  }>(),
  {
    size: 'card',
  },
);

const badgeStyle = computed(() => {
  const px = props.size === 'menu' ? COVER_BADGE_SIZE_MENU : COVER_BADGE_SIZE_CARD;
  const fontSize = props.size === 'menu' ? 11 : 9;
  return {
    width: `${px}px`,
    height: `${px}px`,
    fontSize: `${fontSize}px`,
  };
});
</script>

<template>
  <span class="cover-badge select-none" :style="badgeStyle">
    <span class="cover-badge-text">{{ label }}</span>
  </span>
</template>

<style scoped>
.cover-badge {
  box-sizing: border-box;
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  font-weight: 700;
  color: #fde68a;
  background: rgb(0 0 0 / 42%);
  border: 1px solid rgb(253 230 138 / 35%);
  border-radius: 2px;
}

/* 收紧行盒；CJK 在 em 框内视觉偏下，微上移做光学居中 */
.cover-badge-text {
  display: block;
  line-height: 1;
  transform: translateY(-0.08em);
}
</style>
