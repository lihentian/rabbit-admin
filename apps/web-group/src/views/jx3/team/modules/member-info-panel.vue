<script lang="ts" setup>
import type { SlotMember } from './member-slot-grid.vue';

import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, ref, watch } from 'vue';

import { Copy } from '@vben/icons';

import { message, Switch } from 'antdv-next';

import { getTeamMemberAccount, updateTeamMemberCovers } from '#/api/jx3/team';
import { $t } from '#/locales';

import { getCoverMenuItem } from '../utils/team-covers-availability';
import { SQUAD_COLUMN_MAX_WIDTH } from './member-card.constants';
import MemberCard from './member-card.vue';

const props = defineProps<{
  allMembers: SlotMember[];
  columnCount: number;
  member?: null | SlotMember;
  readonly?: boolean;
  teamId: string;
}>();

const emit = defineEmits<{
  coversUpdated: [
    characterId: string,
    payload: {
      coversTeam: boolean;
    },
  ];
}>();

const loading = ref(false);
const accountInfo = ref<Jx3TeamApi.MemberAccountInfo>();
const coversSaving = ref(false);

const panelWidth = computed(() => {
  const gap = 8;
  return props.columnCount * SQUAD_COLUMN_MAX_WIDTH + (props.columnCount - 1) * gap;
});

const panelStyle = computed(() => ({ width: `${panelWidth.value}px` }));

const cardCharacter = computed(() => {
  const m = props.member;
  if (!m) return null;
  return {
    characterName: m.characterName,
    combatPower: m.combatPower,
    isCw: !!m.isCw,
    serverName: m.serverName,
    specAlias: m.specAlias ?? '',
    specIcon: m.specIcon ?? '',
  };
});

const cardCovers = computed(() => {
  const m = props.member;
  if (!m) return undefined;
  return {
    bigIron: !!m.bigIron,
    coversTeam: !!m.coversTeam,
    smallIron: !!m.smallIron,
  };
});

const serverLine = computed(() => {
  if (!accountInfo.value) return '—';
  const { gameArea, serverName } = accountInfo.value;
  return [gameArea, serverName || '—'].filter(Boolean).join(' · ');
});

const remarkText = computed(() => accountInfo.value?.remark?.trim() || '—');

async function copyText(text: string | undefined) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  message.success($t('ui.jsonViewer.copied'));
}

const infoRows = computed(() => {
  const info = accountInfo.value;
  return [
    {
      copyable: true,
      key: 'account',
      label: $t('jx3.account.account'),
      value: info?.account ?? '',
    },
    {
      copyable: true,
      key: 'password',
      label: $t('jx3.account.password'),
      value: info?.password ?? '',
    },
    {
      copyable: false,
      key: 'server',
      label: $t('jx3.team.gameServer'),
      value: info ? serverLine.value : '',
    },
    {
      copyable: false,
      key: 'remark',
      label: $t('jx3.account.remark'),
      value: info ? remarkText.value : '',
    },
  ];
});

const coversTeamAvailability = computed(() => {
  const m = props.member;
  if (!m) return { checked: false, visible: false };
  return getCoverMenuItem(
    'coversTeam',
    {
      characterId: m.characterId,
      coversTeam: !!m.coversTeam,
      sectId: m.sectId,
    },
    props.allMembers.map((item) => ({
      characterId: item.characterId,
      characterName: item.characterName,
      coversTeam: !!item.coversTeam,
      sectId: item.sectId,
    })),
  );
});

const coversTeamChecked = computed(() => coversTeamAvailability.value.checked);
const coversTeamDisabled = computed(
  () => props.readonly || coversSaving.value || !coversTeamAvailability.value.visible,
);

async function onToggleCoversTeam(checked: boolean | number | string) {
  const m = props.member;
  if (!m || props.readonly || coversSaving.value) return;
  const nextChecked = !!checked;
  coversSaving.value = true;
  const payload = {
    coversTeam: nextChecked ? 1 : 0,
  };
  try {
    await updateTeamMemberCovers(props.teamId, m.characterId, payload);
    emit('coversUpdated', m.characterId, {
      coversTeam: !!payload.coversTeam,
    });
  } catch {
    message.error($t('jx3.team.coversUpdateFailed'));
  } finally {
    coversSaving.value = false;
  }
}

let requestSeq = 0;

watch(
  () => [props.teamId, props.member?.characterId] as const,
  async ([teamId, characterId]) => {
    if (!teamId || !characterId) {
      accountInfo.value = undefined;
      loading.value = false;
      return;
    }
    const seq = ++requestSeq;
    loading.value = true;
    try {
      const data = await getTeamMemberAccount(teamId, characterId);
      if (seq === requestSeq) {
        accountInfo.value = data;
      }
    } finally {
      if (seq === requestSeq) {
        loading.value = false;
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="member-info-panel mt-2 shrink-0" :style="panelStyle">
    <div v-if="!member" class="member-info-empty member-info-empty--full">
      {{ $t('jx3.team.memberInfoEmpty') }}
    </div>

    <div v-else class="member-info-body">
      <div class="member-info-card">
        <MemberCard v-if="cardCharacter" :character="cardCharacter" :covers="cardCovers" disabled />
      </div>

      <div class="member-info-rows">
        <div
          v-for="row in infoRows"
          :key="row.key"
          class="member-info-row"
          :class="{ 'member-info-row--interactive': row.copyable && !!row.value }"
        >
          <span class="member-info-label">{{ row.label }}</span>
          <span class="member-info-value truncate">{{ row.value || '—' }}</span>
          <button
            v-if="row.copyable"
            type="button"
            class="member-info-copy"
            :disabled="!row.value"
            :title="$t('ui.jsonViewer.copy')"
            @click="copyText(row.value)"
          >
            <Copy class="size-4" />
          </button>
        </div>
        <div class="member-info-row member-info-row--covers">
          <span class="member-info-label">{{ $t('jx3.team.coversTeam') }}</span>
          <Switch
            :checked="coversTeamChecked"
            :disabled="coversTeamDisabled"
            :loading="coversSaving"
            size="small"
            @change="onToggleCoversTeam"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.member-info-panel {
  min-height: 144px;
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

.member-info-header {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.22);
}

.member-info-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.75);
}

.member-info-subtitle {
  font-size: 12px;
  color: rgba(230, 245, 240, 0.78);
}

.member-info-empty {
  padding: 6px 4px;
  font-size: 12px;
  color: rgba(230, 245, 240, 0.7);
  text-align: center;
}

.member-info-empty--full {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.member-info-body {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.member-info-card {
  flex-shrink: 0;
  width: 160px;
}

.member-info-rows {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.22);
  border-radius: 4px;
}

.member-info-row {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 26px;
  padding: 0 4px;
  border-radius: 4px;
}

.member-info-row--interactive:hover {
  background: rgba(255, 255, 255, 0.08);
}

.member-info-row--covers {
  justify-content: flex-start;
}

.member-info-label {
  flex-shrink: 0;
  width: 48px;
  font-size: 12px;
  color: rgba(230, 245, 240, 0.78);
}

.member-info-value {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.7);
}

.member-info-copy {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.member-info-copy:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
