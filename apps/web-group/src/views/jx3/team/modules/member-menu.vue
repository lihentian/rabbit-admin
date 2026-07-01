<script lang="ts" setup>
import type { CoverKey, CoversMember } from '../utils/team-covers-availability';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { Check, Eye } from '@vben/icons';

import { message } from 'antdv-next';

import { updateTeamMemberCovers } from '#/api/jx3/team';
import { $t } from '#/locales';

import { getCoverMenuItem } from '../utils/team-covers-availability';
import CoverBadge from './cover-badge.vue';

const props = defineProps<{
  allMembers: CoversMember[];
  characterId: string;
  coversBigIron?: boolean;
  coversSmallIron?: boolean;
  coversTeam?: boolean;
  enabled?: boolean;
  readonly?: boolean;
  sectId?: string;
  teamId: string;
}>();

const emit = defineEmits<{
  updated: [
    payload: {
      coversBigIron: boolean;
      coversSmallIron: boolean;
      coversTeam: boolean;
    },
  ];
  viewAccount: [];
}>();

const open = ref(false);
const saving = ref(false);
const anchor = ref({ x: 0, y: 0 });
const popupRef = ref<HTMLElement>();

const popupStyle = computed(() => ({
  left: `${anchor.value.x}px`,
  top: `${anchor.value.y}px`,
}));

const selfMember = computed<CoversMember>(() => ({
  characterId: props.characterId,
  coversBigIron: props.coversBigIron,
  coversSmallIron: props.coversSmallIron,
  coversTeam: props.coversTeam,
  sectId: props.sectId,
}));

const coverItems = computed(() => {
  const member = selfMember.value;
  const all = props.allMembers;
  return [
    {
      key: 'coversSmallIron' as CoverKey,
      label: $t('jx3.team.coversSmallIron'),
      ...getCoverMenuItem('coversSmallIron', member, all),
    },
    {
      key: 'coversBigIron' as CoverKey,
      label: $t('jx3.team.coversBigIron'),
      ...getCoverMenuItem('coversBigIron', member, all),
    },
    {
      key: 'coversTeam' as CoverKey,
      label: $t('jx3.team.coversTeam'),
      ...getCoverMenuItem('coversTeam', member, all),
    },
  ].filter((item) => item.visible);
});

function coverBadgeText(key: CoverKey) {
  if (key === 'coversSmallIron') return $t('jx3.team.coverBadgeSmallIron');
  if (key === 'coversBigIron') return $t('jx3.team.coverBadgeBigIron');
  return $t('jx3.team.coverBadgeTeam');
}

function closeMenu() {
  open.value = false;
}

function onDocumentDismiss(event: Event) {
  if (!open.value) return;
  const target = event.target as Node | null;
  if (popupRef.value?.contains(target)) return;
  closeMenu();
}

watch(open, (visible) => {
  if (visible) {
    document.addEventListener('pointerdown', onDocumentDismiss, true);
    document.addEventListener('contextmenu', onDocumentDismiss, true);
    document.addEventListener('scroll', onDocumentDismiss, true);
  } else {
    document.removeEventListener('pointerdown', onDocumentDismiss, true);
    document.removeEventListener('contextmenu', onDocumentDismiss, true);
    document.removeEventListener('scroll', onDocumentDismiss, true);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentDismiss, true);
  document.removeEventListener('contextmenu', onDocumentDismiss, true);
  document.removeEventListener('scroll', onDocumentDismiss, true);
});

function onContextMenu(event: MouseEvent) {
  if (!props.enabled || props.readonly) return;
  event.preventDefault();
  event.stopPropagation();

  const menuWidth = 196;
  const menuHeight = 168;
  const padding = 8;
  let x = event.clientX;
  let y = event.clientY;
  if (x + menuWidth + padding > window.innerWidth) {
    x = window.innerWidth - menuWidth - padding;
  }
  if (y + menuHeight + padding > window.innerHeight) {
    y = window.innerHeight - menuHeight - padding;
  }

  anchor.value = { x, y };
  open.value = true;
}

function buildCoversPayload(key: CoverKey, checked: boolean) {
  return {
    coversSmallIron: key === 'coversSmallIron' ? (checked ? 1 : 0) : props.coversSmallIron ? 1 : 0,
    coversBigIron: key === 'coversBigIron' ? (checked ? 1 : 0) : props.coversBigIron ? 1 : 0,
    coversTeam: key === 'coversTeam' ? (checked ? 1 : 0) : props.coversTeam ? 1 : 0,
  };
}

async function onToggle(key: CoverKey, checked: boolean) {
  if (props.readonly || saving.value) return;
  saving.value = true;
  const payload = buildCoversPayload(key, checked);
  try {
    await updateTeamMemberCovers(props.teamId, props.characterId, payload);
    emit('updated', {
      coversSmallIron: !!payload.coversSmallIron,
      coversBigIron: !!payload.coversBigIron,
      coversTeam: !!payload.coversTeam,
    });
  } catch {
    message.error($t('jx3.team.coversUpdateFailed'));
  } finally {
    saving.value = false;
  }
}

function onViewAccount() {
  closeMenu();
  emit('viewAccount');
}
</script>

<template>
  <div v-if="enabled" class="member-menu-target" @contextmenu="onContextMenu">
    <slot></slot>
  </div>
  <slot v-else></slot>

  <Teleport to="body">
    <Transition name="member-menu">
      <div
        v-if="open"
        ref="popupRef"
        class="member-menu-popup fixed z-[1050]"
        :style="popupStyle"
        @contextmenu.prevent
        @pointerdown.stop
      >
        <div class="member-menu-panel bg-popover text-popover-foreground">
          <div class="member-menu-body">
            <button
              v-for="item in coverItems"
              :key="item.key"
              type="button"
              class="member-menu-row"
              :class="{ 'member-menu-row--active': item.checked }"
              :disabled="readonly || saving"
              @click="onToggle(item.key, !item.checked)"
            >
              <CoverBadge :label="coverBadgeText(item.key)" size="menu" />
              <span class="member-menu-label">{{ item.label }}</span>
              <span
                class="member-menu-check"
                :class="{ 'member-menu-check--active': item.checked }"
                aria-hidden="true"
              >
                <Check v-if="item.checked" class="size-3.5" />
              </span>
            </button>
            <div v-if="coverItems.length" class="member-menu-divider"></div>
            <button
              type="button"
              class="member-menu-row member-menu-row--action"
              @click="onViewAccount"
            >
              <span class="member-menu-action-icon">
                <Eye class="size-3.5" />
              </span>
              <span class="member-menu-label">{{ $t('jx3.team.viewAccountInfo') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.member-menu-target {
  display: block;
  width: 100%;
  height: 100%;
}

.member-menu-enter-active,
.member-menu-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.member-menu-enter-from,
.member-menu-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-2px);
}

.member-menu-panel {
  min-width: 196px;
  overflow: hidden;
  border: 1px solid hsl(var(--border) / 0.85);
  border-radius: 10px;
  box-shadow:
    0 8px 24px rgb(0 0 0 / 10%),
    0 2px 8px rgb(0 0 0 / 6%);
}

.member-menu-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
}

.member-menu-row {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 7px 8px;
  font: inherit;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
  transition: background-color 0.15s ease;
}

.member-menu-row:hover:not(:disabled) {
  background: hsl(var(--accent));
}

.member-menu-row:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.member-menu-row--active {
  background: hsl(var(--accent) / 0.45);
}

.member-menu-row--active:hover:not(:disabled) {
  background: hsl(var(--accent) / 0.72);
}

.member-menu-label {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
  text-align: left;
}

.member-menu-check {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: transparent;
  border: 1.5px solid hsl(var(--border));
  border-radius: 5px;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.member-menu-check--active {
  color: #fff;
  background: #348e77;
  border-color: #348e77;
}

.member-menu-divider {
  height: 1px;
  margin: 3px 4px;
  background: hsl(var(--border) / 0.75);
}

.member-menu-action-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: hsl(var(--muted-foreground));
}
</style>
