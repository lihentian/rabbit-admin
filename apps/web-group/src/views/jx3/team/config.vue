<script lang="ts" setup>
import type { SlotMember } from './modules/member-slot-grid.vue';

import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, h, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, message, Modal } from 'antdv-next';

import {
  getTeamAvailableCharacters,
  getTeamForm,
  getTeamMembers,
  previewTeamMemberLayout,
  updateTeamMemberLayout,
} from '#/api/jx3/team';
import { $t } from '#/locales';

import MemberAccountModal from './modules/member-account-modal.vue';
import { POOL_CARD_MIN_WIDTH, POOL_PANEL_MIN_WIDTH, SQUAD_COLUMN_MAX_WIDTH } from './modules/member-card.constants';
import MemberCard from './modules/member-card.vue';
import MemberPool from './modules/member-pool.vue';
import MemberSlotGrid from './modules/member-slot-grid.vue';
import {
  getLayoutIssueLabelWidth,
  renderLayoutIssue,
} from './utils/layout-composition-issue';

interface DragPayload {
  characterId: string;
  characterSpecId: string;
  fromJoinSort?: number;
  source: 'pool' | 'slot';
}

const POINTER_DRAG_THRESHOLD = 4;

const route = useRoute();
const router = useRouter();
const { setTabTitle } = useTabs();

const teamId = computed(() => String(route.query.teamId ?? ''));
const pageTitle = computed(() =>
  String(route.query.title ?? $t('jx3.team.config')),
);

watch(
  pageTitle,
  (title) => {
    setTabTitle(title);
  },
  { immediate: true },
);

const teamRow = ref<Jx3TeamApi.Team>();
const available = ref<Jx3TeamApi.AvailableCharacter[]>([]);
const slots = reactive<Record<number, null | SlotMember>>({});
const dragging = ref<DragPayload | null>(null);
const dropTargetJoinSort = ref<number>();
const loading = ref(false);
const saving = ref(false);
const accountModalRef = ref<InstanceType<typeof MemberAccountModal>>();

const readonly = computed(() => teamRow.value?.status === 3);
const columnCount = computed(() => (teamRow.value?.playerCount === 10 ? 2 : 5));
const slottedCharacterIds = computed(
  () =>
    new Set(
      Object.values(slots)
        .filter(Boolean)
        .map((m) => m!.characterId),
    ),
);

const dragPreview = ref<{
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
  fromPool: boolean;
  x: number;
  y: number;
}>();

function resolveDragPreviewCharacter(payload: DragPayload) {
  if (payload.source === 'slot' && payload.fromJoinSort) {
    const member = slots[payload.fromJoinSort];
    if (member) return member;
  }
  const character = available.value.find((c) => c.characterId === payload.characterId);
  if (!character) return;
  const spec =
    character.specs.find((s) => s.characterSpecId === payload.characterSpecId) ??
    character.specs[0];
  return {
    accountRemark: character.accountRemark,
    characterName: character.characterName,
    combatPower: spec?.combatPower ?? character.combatPower,
    isCw: !!(spec?.isCw ?? character.isCw),
    serverName: character.serverName,
    specAlias: spec?.specAlias ?? character.specAlias,
    specIcon: spec?.specIcon ?? character.specIcon,
  };
}

function updateDragPreview(payload: DragPayload, clientX: number, clientY: number) {
  const character = resolveDragPreviewCharacter(payload);
  if (!character) {
    dragPreview.value = undefined;
    return;
  }
  dragPreview.value = {
    character,
    fromPool: payload.source === 'pool',
    x: clientX,
    y: clientY,
  };
}

function resetSlots(playerCount: number) {
  for (const key of Object.keys(slots)) {
    delete slots[Number(key)];
  }
  for (let i = 1; i <= playerCount; i++) {
    slots[i] = null;
  }
}

function toSlotMember(
  char: Jx3TeamApi.AvailableCharacter,
  characterSpecId?: string,
  member?: Pick<
    Jx3TeamApi.TeamMember,
    'coversBigIron' | 'coversSmallIron' | 'coversTeam'
  > | SlotMember,
): SlotMember {
  const spec =
    char.specs.find((s) => s.characterSpecId === characterSpecId) ??
    char.specs[0];
  return {
    characterId: char.characterId,
    characterName: char.characterName,
    characterSpecId: spec?.characterSpecId ?? char.characterSpecId,
    combatPower: spec?.combatPower ?? char.combatPower,
    coversSmallIron: !!member?.coversSmallIron,
    coversBigIron: !!member?.coversBigIron,
    coversTeam: !!member?.coversTeam,
    isCw: !!(spec?.isCw ?? char.isCw),
    sectId: spec?.sectId ?? char.sectId,
    serverName: char.serverName,
    specAlias: spec?.specAlias ?? char.specAlias,
    specIcon: spec?.specIcon ?? char.specIcon,
  };
}

async function loadData() {
  if (!teamId.value) return;
  loading.value = true;
  try {
    const [team, members, chars] = await Promise.all([
      getTeamForm(teamId.value),
      getTeamMembers(teamId.value),
      getTeamAvailableCharacters(teamId.value),
    ]);
    teamRow.value = team;
    available.value = chars;
    resetSlots(team.playerCount);

    const charMap = new Map(chars.map((c) => [c.characterId, c]));
    for (const member of members) {
      if (!member.joinSort) continue;
      const char = charMap.get(member.characterId);
      if (!char) continue;
      slots[member.joinSort] = toSlotMember(char, member.characterSpecId, member);
    }
  } finally {
    loading.value = false;
  }
}

watch(teamId, loadData, { immediate: true });

let activePointerId: null | number = null;
let pendingPayload: DragPayload | null = null;
let pointerStartX = 0;
let pointerStartY = 0;
let pointerDragStarted = false;

function resolveDropTarget(clientX: number, clientY: number) {
  const el = document.elementFromPoint(clientX, clientY);
  const slotEl = el?.closest('[data-join-sort]') as HTMLElement | null;
  if (slotEl?.dataset.joinSort) {
    return { type: 'slot' as const, joinSort: Number(slotEl.dataset.joinSort) };
  }
  if (el?.closest('[data-drop-pool]')) {
    return { type: 'pool' as const };
  }
  return null;
}

function updateDropTarget(clientX: number, clientY: number) {
  const target = resolveDropTarget(clientX, clientY);
  if (target?.type === 'slot') {
    dropTargetJoinSort.value = target.joinSort;
    return;
  }
  dropTargetJoinSort.value = undefined;
}

function cleanupPointerDrag() {
  activePointerId = null;
  pendingPayload = null;
  pointerDragStarted = false;
  dropTargetJoinSort.value = undefined;
  dragging.value = null;
  dragPreview.value = undefined;
  window.removeEventListener('pointermove', onWindowPointerMove);
  window.removeEventListener('pointerup', onWindowPointerUp);
  window.removeEventListener('pointercancel', onWindowPointerUp);
}

function onWindowPointerMove(event: PointerEvent) {
  if (activePointerId !== event.pointerId) return;

  if (!pointerDragStarted) {
    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;
    if (Math.hypot(dx, dy) < POINTER_DRAG_THRESHOLD) return;
    pointerDragStarted = true;
    dragging.value = pendingPayload;
    if (pendingPayload) {
      updateDragPreview(pendingPayload, event.clientX, event.clientY);
    }
  }

  if (pointerDragStarted && dragging.value) {
    updateDragPreview(dragging.value, event.clientX, event.clientY);
  }

  updateDropTarget(event.clientX, event.clientY);
}

function onWindowPointerUp(event: PointerEvent) {
  if (activePointerId !== event.pointerId) return;

  if (pointerDragStarted && dragging.value) {
    const target = resolveDropTarget(event.clientX, event.clientY);
    if (target?.type === 'slot') {
      onDropToSlot(target.joinSort);
    } else if (target?.type === 'pool') {
      onDropToPool();
    }
  }

  dragging.value = null;
  cleanupPointerDrag();
}

function beginPointerDrag(payload: DragPayload, event: PointerEvent) {
  if (readonly.value) return;

  event.preventDefault();
  activePointerId = event.pointerId;
  pendingPayload = payload;
  pointerStartX = event.clientX;
  pointerStartY = event.clientY;
  pointerDragStarted = false;

  window.addEventListener('pointermove', onWindowPointerMove);
  window.addEventListener('pointerup', onWindowPointerUp);
  window.addEventListener('pointercancel', onWindowPointerUp);
}

onBeforeUnmount(cleanupPointerDrag);

function onPoolPickup(
  character: Jx3TeamApi.AvailableCharacter,
  event: PointerEvent,
) {
  if (slottedCharacterIds.value.has(character.characterId)) return;
  beginPointerDrag(
    {
      source: 'pool',
      characterId: character.characterId,
      characterSpecId: character.characterSpecId,
    },
    event,
  );
}

function onSlotPickup(joinSort: number, event: PointerEvent) {
  const member = slots[joinSort];
  if (!member) return;
  beginPointerDrag(
    {
      source: 'slot',
      characterId: member.characterId,
      characterSpecId: member.characterSpecId,
      fromJoinSort: joinSort,
    },
    event,
  );
}

function assignToSlot(
  character: Jx3TeamApi.AvailableCharacter,
  joinSort: number,
  characterSpecId?: string,
) {
  const existing = slots[joinSort];
  if (existing?.characterId === character.characterId) return;

  let previousMember: SlotMember | undefined;
  for (const [sort, member] of Object.entries(slots)) {
    if (member?.characterId === character.characterId) {
      previousMember = member;
      slots[Number(sort)] = null;
    }
  }

  if (existing) {
    slots[joinSort] = null;
  }

  slots[joinSort] = toSlotMember(character, characterSpecId, previousMember);
}

function onCoversUpdated(
  joinSort: number,
  payload: {
    coversBigIron: boolean;
    coversSmallIron: boolean;
    coversTeam: boolean;
  },
) {
  const member = slots[joinSort];
  if (!member) return;
  member.coversSmallIron = payload.coversSmallIron;
  member.coversBigIron = payload.coversBigIron;
  member.coversTeam = payload.coversTeam;
}

function onViewAccount(characterId: string) {
  if (!teamId.value) return;
  accountModalRef.value?.open({ teamId: teamId.value, characterId });
}

function onDropToSlot(joinSort: number) {
  const payload = dragging.value;
  if (!payload || readonly.value) return;

  const character = available.value.find((c) => c.characterId === payload.characterId);
  if (!character) return;

  if (payload.source === 'slot' && payload.fromJoinSort === joinSort) return;

  const targetMember = slots[joinSort];
  if (payload.source === 'slot' && payload.fromJoinSort && targetMember) {
    const fromSort = payload.fromJoinSort;
    const fromMember = slots[fromSort];
    slots[fromSort] = targetMember;
    slots[joinSort] = fromMember ?? null;
    dragging.value = null;
    return;
  }

  assignToSlot(character, joinSort, payload.characterSpecId);
  dragging.value = null;
}

function onDropToPool() {
  const payload = dragging.value;
  if (!payload || readonly.value || payload.source !== 'slot') return;
  if (payload.fromJoinSort) {
    slots[payload.fromJoinSort] = null;
  }
  dragging.value = null;
}

function buildLayoutSlots() {
  return Object.entries(slots)
    .filter(([, member]) => member)
    .map(([joinSort, member]) => ({
      joinSort: Number(joinSort),
      characterId: member!.characterId,
      characterSpecId: member!.characterSpecId,
    }));
}

function shouldPreviewLayout(layoutSlots: Jx3TeamApi.LayoutSlot[]) {
  const team = teamRow.value;
  if (!team || !layoutSlots.length) return false;
  if (team.cdLimitEnabled) return true;
  return !!(team.templateId && layoutSlots.length >= team.playerCount);
}

function confirmSaveWithWarnings(issues: Jx3TeamApi.LayoutIssue[]) {
  const labelWidthEm = getLayoutIssueLabelWidth(issues);
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      cancelText: $t('jx3.team.layoutPreviewBack'),
      content: h(
        'div',
        { class: 'flex flex-col gap-2' },
        issues.map((issue) => h('div', [renderLayoutIssue(issue, labelWidthEm)])),
      ),
      okText: $t('jx3.team.layoutPreviewSaveAnyway'),
      onCancel() {
        resolve(false);
      },
      onOk() {
        resolve(true);
      },
      title: $t('jx3.team.layoutPreviewTitle'),
      width: 480,
    });
  });
}

async function saveLayout(layoutSlots: Jx3TeamApi.LayoutSlot[]) {
  if (!teamRow.value) return;
  saving.value = true;
  try {
    await updateTeamMemberLayout(teamRow.value.id, layoutSlots);
    message.success($t('jx3.team.saveLayoutSuccess'));
    await loadData();
  } finally {
    saving.value = false;
  }
}

async function onSave() {
  if (!teamRow.value || readonly.value) return;
  const layoutSlots = buildLayoutSlots();

  if (shouldPreviewLayout(layoutSlots)) {
    try {
      const preview = await previewTeamMemberLayout(teamRow.value.id, layoutSlots);
      if (preview.issues?.length) {
        const confirmed = await confirmSaveWithWarnings(preview.issues);
        if (!confirmed) return;
      }
    } catch {
      return;
    }
  }

  await saveLayout(layoutSlots);
}

function onBack() {
  router.push({ name: 'Jx3TeamList' });
}

</script>

<template>
  <Page auto-content-height :title="pageTitle">
    <template #extra>
      <div class="flex items-center gap-2">
        <Button @click="onBack">{{ $t('common.back') }}</Button>
        <Button :disabled="readonly" :loading="saving" type="primary" @click="onSave">
          {{ $t('jx3.team.saveLayout') }}
        </Button>
      </div>
    </template>

    <div class="flex h-full min-h-0 flex-col gap-4">
      <div v-if="readonly" class="shrink-0 text-sm text-amber-500">
        {{ $t('jx3.team.layoutReadonly') }}
      </div>
      <div
        class="flex min-h-0 flex-1 items-stretch gap-3"
        :class="{ 'pointer-events-none opacity-60': loading }"
      >
        <MemberSlotGrid
          class="shrink-0 self-start"
          :column-count="columnCount"
          :dragging-from-join-sort="
            dragging?.source === 'slot' ? dragging.fromJoinSort : undefined
          "
          :drop-target-join-sort="dropTargetJoinSort"
          :player-count="teamRow?.playerCount ?? 25"
          :readonly="readonly"
          :slots="slots"
          :team-id="teamId"
          @covers-updated="onCoversUpdated"
          @pickup="onSlotPickup"
          @view-account="onViewAccount"
        />
        <MemberPool
          class="h-full min-h-0 min-w-0 flex-1"
          :style="{ minWidth: `${POOL_PANEL_MIN_WIDTH}px` }"
          :characters="available"
          :dragging-character-id="dragging?.characterId"
          :dragging-character-spec-id="dragging?.characterSpecId"
          :dragging-source="dragging?.source"
          :slotted-character-ids="slottedCharacterIds"
          :team-context="
            teamRow
              ? {
                  cdLimitEnabled: !!teamRow.cdLimitEnabled,
                  dungeonId: teamRow.dungeonId,
                  id: teamId,
                }
              : undefined
          "
          @pickup="onPoolPickup"
        />
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="dragPreview"
        class="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2 opacity-90 shadow-lg"
        :style="{
          left: `${dragPreview.x}px`,
          top: `${dragPreview.y}px`,
          width: dragPreview.fromPool ? `${POOL_CARD_MIN_WIDTH}px` : `${SQUAD_COLUMN_MAX_WIDTH - 8}px`,
        }"
      >
        <MemberCard
          :character="dragPreview.character"
          :show-account-remark="dragPreview.fromPool"
          disabled
        />
      </div>
    </Teleport>

    <MemberAccountModal ref="accountModalRef" />
  </Page>
</template>
