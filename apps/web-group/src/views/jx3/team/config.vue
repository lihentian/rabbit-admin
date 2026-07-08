<script lang="ts" setup>
import type { SlotMember } from './modules/member-slot-grid.vue';

import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, h, nextTick, onActivated, onBeforeUnmount, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, message, Modal } from 'antdv-next';
import { storeToRefs } from 'pinia';

import {
  getTeamAvailableCharacters,
  getTeamForm,
  getTeamMembers,
  previewTeamMemberLayout,
  updateTeamMemberLayout,
} from '#/api/jx3/team';
import { useJx3TeamAccess } from '#/composables/use-jx3-team-access';
import { $t } from '#/locales';
import { useJx3SpecDictStore } from '#/store/jx3-spec-dict';

import Form from './modules/form.vue';
import MemberAccountModal from './modules/member-account-modal.vue';
import {
  POOL_CARD_MIN_WIDTH,
  POOL_PANEL_MIN_WIDTH,
  SQUAD_COLUMN_MAX_WIDTH,
} from './modules/member-card.constants';
import MemberCard from './modules/member-card.vue';
import MemberPool from './modules/member-pool.vue';
import MemberSlotGrid from './modules/member-slot-grid.vue';
import TeamSwitcher from './modules/team-switcher.vue';
import { getSpecMeta } from './utils/enrich-available-character';
import { getLayoutIssueLabelWidth, renderLayoutIssue } from './utils/layout-composition-issue';

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

const teamRow = ref<Jx3TeamApi.Team>();
const available = ref<Jx3TeamApi.AvailableCharacterSlim[]>([]);
const latestMembers = ref<Jx3TeamApi.TeamMember[]>([]);
const slots = reactive<Record<number, null | SlotMember>>({});
const dragging = ref<DragPayload | null>(null);
const dropTargetJoinSort = ref<number>();
const loading = ref(false);
const poolLoading = ref(false);
const saving = ref(false);
const teamsLoaded = ref(false);
const hasActiveTeams = ref(false);
const accountModalRef = ref<InstanceType<typeof MemberAccountModal>>();
const teamSwitcherRef = ref<InstanceType<typeof TeamSwitcher>>();

const { canCreate, canSaveLayout, canUsePool } = useJx3TeamAccess();
const specDictStore = useJx3SpecDictStore();
const { specDict } = storeToRefs(specDictStore);

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const showEmpty = computed(() => teamsLoaded.value && !teamId.value && !hasActiveTeams.value);

const layoutReadonly = computed(
  () => teamRow.value?.status === 3 || !(teamRow.value?.canManageMembers ?? false),
);
const readonly = layoutReadonly;
const columnCount = computed(() => (teamRow.value?.playerCount === 10 ? 2 : 5));
const slottedCharacterIds = computed(
  () =>
    new Set(
      Object.values(slots)
        .filter(Boolean)
        .map((m) => m!.characterId),
    ),
);

type DragPreviewCharacter = Pick<
  Jx3TeamApi.AvailableCharacter,
  | 'accountRemark'
  | 'characterName'
  | 'combatPower'
  | 'isCw'
  | 'serverName'
  | 'specAlias'
  | 'specIcon'
>;

const dragPreview = ref<{
  character: DragPreviewCharacter;
  fromPool: boolean;
}>();
const dragPreviewEl = ref<HTMLElement | null>(null);

const dragPreviewWidth = computed(() =>
  dragPreview.value?.fromPool ? `${POOL_CARD_MIN_WIDTH}px` : `${SQUAD_COLUMN_MAX_WIDTH - 8}px`,
);

const teamContext = computed(() => {
  const team = teamRow.value;
  if (!team) return undefined;
  return {
    cdLimitEnabled: !!team.cdLimitEnabled,
    dungeonId: team.dungeonId,
    id: teamId.value,
  };
});

function resolveDragPreviewCharacter(payload: DragPayload): DragPreviewCharacter | undefined {
  if (payload.source === 'slot' && payload.fromJoinSort) {
    const member = slots[payload.fromJoinSort];
    if (member) {
      return {
        characterName: member.characterName,
        combatPower: member.combatPower,
        isCw: !!member.isCw,
        serverName: member.serverName,
        specAlias: member.specAlias ?? '',
        specIcon: member.specIcon ?? '',
      };
    }
  }
  const character = available.value.find((c) => c.characterId === payload.characterId);
  if (!character) return;
  const spec =
    character.specs.find((s) => s.characterSpecId === payload.characterSpecId) ??
    character.specs[0];
  const specId = spec?.specId ?? character.specId;
  const meta = getSpecMeta(specDict.value, specId);
  return {
    accountRemark: character.accountRemark,
    characterName: character.characterName,
    combatPower: spec?.combatPower ?? character.combatPower,
    isCw: !!(spec?.isCw ?? character.isCw),
    serverName: character.serverName,
    specAlias: meta.specAlias,
    specIcon: meta.specIcon ?? '',
  };
}

function startDragPreview(payload: DragPayload) {
  const character = resolveDragPreviewCharacter(payload);
  if (!character) {
    dragPreview.value = undefined;
    return;
  }
  dragPreview.value = {
    character,
    fromPool: payload.source === 'pool',
  };
}

function updatePreviewPosition(clientX: number, clientY: number) {
  const el = dragPreviewEl.value;
  if (!el) return;
  el.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`;
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
  char: Jx3TeamApi.AvailableCharacterSlim,
  characterSpecId?: string,
  member?:
    | Pick<Jx3TeamApi.TeamMember, 'coversBigIron' | 'coversSmallIron' | 'coversTeam'>
    | SlotMember,
): SlotMember {
  const spec = char.specs.find((s) => s.characterSpecId === characterSpecId) ?? char.specs[0];
  const specId = spec?.specId ?? char.specId;
  const meta = getSpecMeta(specDict.value, specId);
  return {
    cdConflict: char.cdConflict,
    characterId: char.characterId,
    characterName: char.characterName,
    characterSpecId: spec?.characterSpecId ?? char.characterSpecId,
    combatPower: spec?.combatPower ?? char.combatPower,
    coversSmallIron: !!member?.coversSmallIron,
    coversBigIron: !!member?.coversBigIron,
    coversTeam: !!member?.coversTeam,
    isCw: !!(spec?.isCw ?? char.isCw),
    sectId: meta.sectId,
    sectName: meta.sectName,
    serverName: char.serverName,
    specAlias: meta.specAlias,
    specIcon: meta.specIcon,
  };
}

function toSlotMemberFromTeamMember(member: Jx3TeamApi.TeamMember): SlotMember {
  return {
    characterId: member.characterId,
    characterName: member.characterName ?? '',
    characterSpecId: member.characterSpecId ?? '',
    combatPower: member.combatPower ?? 0,
    coversSmallIron: !!member.coversSmallIron,
    coversBigIron: !!member.coversBigIron,
    coversTeam: !!member.coversTeam,
    sectId: member.sectId,
    sectName: member.sectName,
    serverName: member.serverName ?? undefined,
    specAlias: member.specAlias,
    specIcon: null,
  };
}

function applySlotsFromMembers(members: Jx3TeamApi.TeamMember[]) {
  for (const member of members) {
    if (!member.joinSort) continue;
    const char = available.value.find((item) => item.characterId === member.characterId);
    slots[member.joinSort] = char
      ? toSlotMember(char, member.characterSpecId, member)
      : toSlotMemberFromTeamMember(member);
  }
}

async function loadTeamLayout() {
  if (!teamId.value) return;
  loading.value = true;
  try {
    void specDictStore.ensureLoaded();
    const [team, members] = await Promise.all([
      getTeamForm(teamId.value),
      getTeamMembers(teamId.value),
    ]);
    latestMembers.value = members;
    teamRow.value = team;
    updateTabTitle(team.teamName);
    resetSlots(team.playerCount);
    applySlotsFromMembers(members);
  } finally {
    loading.value = false;
  }
}

async function loadPool() {
  if (!teamId.value || !canUsePool.value) return;
  poolLoading.value = true;
  try {
    const pool = await getTeamAvailableCharacters(teamId.value);
    if (teamRow.value) {
      teamRow.value = {
        ...teamRow.value,
        canManageMembers: pool.canManageMembers ?? teamRow.value.canManageMembers ?? false,
      };
    }
    available.value = pool.characters;
    applySlotsFromMembers(latestMembers.value);
  } finally {
    poolLoading.value = false;
  }
}

async function loadData() {
  if (!teamId.value) return;
  await loadTeamLayout();
  void loadPool();
}

onActivated(() => {
  loadData();
});

let activePointerId: null | number = null;
let pendingPayload: DragPayload | null = null;
let pointerStartX = 0;
let pointerStartY = 0;
let pointerDragStarted = false;
let rafId: null | number = null;
let latestPointerEvent: null | PointerEvent = null;

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
    if (dropTargetJoinSort.value !== target.joinSort) {
      dropTargetJoinSort.value = target.joinSort;
    }
    return;
  }
  if (dropTargetJoinSort.value !== undefined) {
    dropTargetJoinSort.value = undefined;
  }
}

function cancelPointerFrame() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  latestPointerEvent = null;
}

function processPointerFrame() {
  rafId = null;
  const event = latestPointerEvent;
  if (!event || activePointerId !== event.pointerId) return;

  if (!pointerDragStarted) {
    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;
    if (Math.hypot(dx, dy) < POINTER_DRAG_THRESHOLD) return;
    pointerDragStarted = true;
    dragging.value = pendingPayload;
    if (pendingPayload) {
      startDragPreview(pendingPayload);
      void nextTick(() => {
        updatePreviewPosition(event.clientX, event.clientY);
      });
    }
  }

  if (pointerDragStarted && dragging.value) {
    updatePreviewPosition(event.clientX, event.clientY);
  }

  updateDropTarget(event.clientX, event.clientY);
}

function schedulePointerFrame(event: PointerEvent) {
  latestPointerEvent = event;
  if (rafId !== null) return;
  rafId = requestAnimationFrame(processPointerFrame);
}

function cleanupPointerDrag() {
  cancelPointerFrame();
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
  schedulePointerFrame(event);
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

function onPoolPickup(character: Jx3TeamApi.AvailableCharacter, event: PointerEvent) {
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
  character: Jx3TeamApi.AvailableCharacterSlim,
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

function updateTabTitle(teamName?: string) {
  const title = teamName ? `${$t('jx3.team.config')} - ${teamName}` : $t('jx3.team.config');
  setTabTitle(title);
}

function navigateToTeam(id: string, teamName?: string) {
  if (teamName) {
    updateTabTitle(teamName);
  }
  router.replace({
    path: route.path,
    query: { teamId: id },
  });
}

function onCreate() {
  formDrawerApi.setData(null).open();
}

function onFormSuccess(payload?: { id: string; teamName: string }) {
  teamSwitcherRef.value?.refresh();
  if (payload?.id) {
    navigateToTeam(payload.id, payload.teamName);
    return;
  }
  loadData();
}

function onTeamSwitch(id: string) {
  if (!id || id === teamId.value) return;
  navigateToTeam(id);
}

function onTeamsLoaded(teams: Jx3TeamApi.Team[]) {
  teamsLoaded.value = true;
  hasActiveTeams.value = teams.length > 0;
  if (!teamId.value && teams.length > 0) {
    navigateToTeam(teams[0]!.id, teams[0]!.teamName);
  } else if (!teamId.value) {
    updateTabTitle();
  }
}

function onBack() {
  router.push({ name: 'Jx3TeamList' });
}
</script>

<template>
  <Page auto-content-height content-class="select-none" header-class="select-none">
    <template #title>
      <TeamSwitcher
        ref="teamSwitcherRef"
        :model-value="teamId"
        @teams-loaded="onTeamsLoaded"
        @update:model-value="onTeamSwitch"
      />
    </template>
    <template #extra>
      <div class="flex items-center gap-2">
        <Button v-if="canCreate" type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('jx3.team.name')]) }}
        </Button>
        <Button @click="onBack">{{ $t('common.back') }}</Button>
        <Button
          v-if="canSaveLayout"
          :disabled="readonly || !teamId"
          :loading="saving"
          type="primary"
          @click="onSave"
        >
          {{ $t('jx3.team.saveLayout') }}
        </Button>
      </div>
    </template>

    <div v-if="showEmpty" class="flex h-full flex-col items-center justify-center gap-4">
      <p class="text-muted-foreground">{{ $t('jx3.team.noActiveTeam') }}</p>
      <Button v-if="canCreate" type="primary" @click="onCreate">
        <Plus class="size-5" />
        {{ $t('ui.actionTitle.create', [$t('jx3.team.name')]) }}
      </Button>
    </div>

    <div v-else-if="teamId" class="flex h-full min-h-0 flex-col gap-4">
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
          :dragging-from-join-sort="dragging?.source === 'slot' ? dragging.fromJoinSort : undefined"
          :drop-target-join-sort="dropTargetJoinSort"
          :player-count="teamRow?.playerCount ?? 25"
          :readonly="readonly"
          :slots="slots"
          :team-context="teamContext"
          :team-id="teamId"
          @covers-updated="onCoversUpdated"
          @pickup="onSlotPickup"
          @view-account="onViewAccount"
        />
        <MemberPool
          v-if="canUsePool"
          class="h-full min-h-0 min-w-0 flex-1"
          :style="{ minWidth: `${POOL_PANEL_MIN_WIDTH}px` }"
          :characters="available"
          :dragging-character-id="dragging?.characterId"
          :dragging-character-spec-id="dragging?.characterSpecId"
          :dragging-source="dragging?.source"
          :loading="poolLoading"
          :slotted-character-ids="slottedCharacterIds"
          :team-context="teamContext"
          @pickup="onPoolPickup"
        />
      </div>
    </div>

    <Teleport to="body">
      <div
        v-show="dragPreview"
        ref="dragPreviewEl"
        class="pointer-events-none fixed left-0 top-0 z-[9999] opacity-90 shadow-lg"
        :style="{ width: dragPreviewWidth }"
      >
        <MemberCard
          v-if="dragPreview"
          :character="dragPreview.character"
          :show-account-remark="dragPreview.fromPool"
          disabled
        />
      </div>
    </Teleport>

    <MemberAccountModal ref="accountModalRef" />
    <FormDrawer @success="onFormSuccess" />
  </Page>
</template>
