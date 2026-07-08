<script lang="ts" setup>
import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, onMounted, ref } from 'vue';

import { Select } from 'antdv-next';

import { getTeamList } from '#/api/jx3/team';
import { $t } from '#/locales';

import { useTeamStatusOptions } from '../data';

const props = defineProps<{
  modelValue: string;
}>();

const emits = defineEmits<{
  'teams-loaded': [teams: Jx3TeamApi.Team[]];
  'update:modelValue': [teamId: string, teamName?: string];
}>();

const loading = ref(false);
const teams = ref<Jx3TeamApi.Team[]>([]);

const statusLabelMap = computed(() => {
  const map = new Map<number, string>();
  for (const item of useTeamStatusOptions()) {
    map.set(item.value, item.label);
  }
  return map;
});

const options = computed(() =>
  teams.value.map((team) => ({
    label: formatTeamLabel(team),
    value: team.id,
  })),
);

function formatTeamLabel(team: Jx3TeamApi.Team) {
  const statusLabel = statusLabelMap.value.get(team.status) ?? '';
  const parts = [team.teamName, team.dungeonName, statusLabel].filter(Boolean);
  return parts.join(' · ');
}

function filterActiveTeams(items: Jx3TeamApi.Team[]) {
  return items.filter((team) => team.status !== 3);
}

async function fetchTeams(keywords?: string) {
  loading.value = true;
  try {
    const res = await getTeamList({
      keywords: keywords?.trim() || undefined,
      page: 1,
      pageSize: keywords?.trim() ? 50 : 100,
    });
    teams.value = filterActiveTeams(res.items);
    if (!keywords?.trim()) {
      emits('teams-loaded', teams.value);
    }
  } finally {
    loading.value = false;
  }
}

function onSearch(keywords: string) {
  return fetchTeams(keywords);
}

function onChange(teamId: string) {
  if (teamId && teamId !== props.modelValue) {
    const team = teams.value.find((item) => item.id === teamId);
    emits('update:modelValue', teamId, team?.teamName);
  }
}

onMounted(() => {
  fetchTeams();
});

defineExpose({ refresh: () => fetchTeams() });
</script>

<template>
  <Select
    allow-clear
    class="w-[280px]"
    :filter-option="false"
    :loading="loading"
    :options="options"
    :placeholder="$t('jx3.team.selectTeam')"
    show-search
    :value="modelValue || undefined"
    @change="onChange"
    @search="onSearch"
  />
</template>
