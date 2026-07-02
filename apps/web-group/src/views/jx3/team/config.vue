<script lang="ts" setup>
import type { SlotMember } from './modules/member-slot-grid.vue';

import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, h, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'antdv-next';

import {
  getTeamAvailableCharacters,
  getTeamForm,
  getTeamMembers,
  previewTeamMemberLayout,
  updateTeamMemberLayout,
} from '#/api/jx3/team';
import { $t } from '#/locales';

import Form from './modules/form.vue';
import MemberAccountModal from './modules/member-account-modal.vue';
import { POOL_CARD_MIN_WIDTH, POOL_PANEL_MIN_WIDTH, SQUAD_COLUMN_MAX_WIDTH } from './modules/member-card.constants';
import MemberCard from './modules/member-card.vue';
import MemberPool from './modules/member-pool.vue';
import MemberSlotGrid from './modules/member-slot-grid.vue';
import TeamSwitcher from './modules/team-switcher.vue';
import {
  getLayoutIssueLabelWidth,
  renderLayoutIssue,
} from './utils/layout-composition-issue';
import {
  getSpecMeta,
} from './utils/enrich-available-character';
import { useJx3TeamAccess } from '#/composables/use-jx3-team-access';

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
const availableSpecDict = ref<Jx3TeamApi.AvailableCharacterSpecDict>({});
const available = ref<Jx3TeamApi.AvailableCharacterSlim[]>([]);
const slots = reactive<Record<number, null | SlotMember>>({});
const dragging = ref<DragPayload | null>(null);
const dropTargetJoinSort = ref<number>();
const loading = ref(false);
const saving = ref(false);
const teamsLoaded = ref(false);
const hasActiveTeams = ref(false);
const accountModalRef = ref<InstanceType<typeof MemberAccountModal>>();
const teamSwitcherRef = ref<InstanceType<typeof TeamSwitcher>>();

const { canCreate, canSaveLayout, canUsePool } = useJx3TeamAccess();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const showEmpty = computed(
  () => teamsLoaded.value && !teamId.value && !hasActiveTeams.value,
);

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
  const specId = spec?.specId ?? character.specId;
  const meta = getSpecMeta(availableSpecDict.value, specId);
  return {
    accountRemark: character.accountRemark,
    characterName: character.characterName,
    combatPower: spec?.combatPower ?? character.combatPower,
    isCw: !!(spec?.isCw ?? character.isCw),
    serverName: character.serverName,
    specAlias: meta.specAlias,
    specIcon: meta.specIcon,
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
  char: Jx3TeamApi.AvailableCharacterSlim,
  characterSpecId?: string,
  member?: Pick<
    Jx3TeamApi.TeamMember,
    'coversBigIron' | 'coversSmallIron' | 'coversTeam'
  > | SlotMember,
): SlotMember {
  const spec =
    char.specs.find((s) => s.characterSpecId === characterSpecId) ??
    char.specs[0];
  const specId = spec?.specId ?? char.specId;
  const meta = getSpecMeta(availableSpecDict.value, specId);
  return {
    characterId: char.characterId,
    characterName: char.characterName,
    characterSpecId: spec?.characterSpecId ?? char.characterSpecId,
    combatPower: spec?.combatPower ?? char.combatPower,
    coversSmallIron: !!member?.coversSmallIron,
    coversBigIron: !!member?.coversBigIron,
    coversTeam: !!member?.coversTeam,
    isCw: !!(spec?.isCw ?? char.isCw),
    sectId: meta.sectId,
    serverName: char.serverName,
    specAlias: meta.specAlias,
    specIcon: meta.specIcon,
  };
}

async function loadData() {
  if (!teamId.value) return;
  loading.value = true;
  try {
    const [team, members, pool] = await Promise.all([
      getTeamForm(teamId.value),
      getTeamMembers(teamId.value),
      getTeamAvailableCharacters(teamId.value),
    ]);
    teamRow.value = {
      ...team,
      canManageMembers: pool.canManageMembers ?? team.canManageMembers ?? false,
    };
    updateTabTitle(team.teamName);
    availableSpecDict.value = pool.specDict;
    available.value = pool.characters;
    resetSlots(team.playerCount);

    const charMap = new Map(pool.characters.map((c) => [c.characterId, c]));
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
  const title = teamName
    ? `${$t('jx3.team.config')} - ${teamName}`
    : $t('jx3.team.config');
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
  <Page auto-content-height>
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
          v-if="canUsePool"
          class="h-full min-h-0 min-w-0 flex-1"
          :style="{ minWidth: `${POOL_PANEL_MIN_WIDTH}px` }"
          :characters="available"
          :dragging-character-id="dragging?.characterId"
          :dragging-character-spec-id="dragging?.characterSpecId"
          :dragging-source="dragging?.source"
          :slotted-character-ids="slottedCharacterIds"
          :spec-dict="availableSpecDict"
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
    <FormDrawer @success="onFormSuccess" />
  </Page>
</template>
