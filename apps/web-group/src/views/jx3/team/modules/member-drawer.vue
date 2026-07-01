<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { Copy, Plus } from '@vben/icons';

import { useElementSize } from '@vueuse/core';
import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTeamMembers, leaveTeam } from '#/api/jx3/team';
import { $t } from '#/locales';

import { useMemberColumns } from '../data';
import MemberJoinModal from './member-join-modal.vue';

const emit = defineEmits<{ success: [] }>();

const teamRow = ref<Jx3TeamApi.Team>();
const joinModalRef = ref<InstanceType<typeof MemberJoinModal>>();
const gridWrapRef = ref<HTMLElement | null>(null);
const { height: gridWrapHeight } = useElementSize(gridWrapRef);

function onLeave(row: Jx3TeamApi.TeamMember) {
  if (!teamRow.value) return;
  leaveTeam(teamRow.value.id, row.characterId).then(() => {
    message.success($t('jx3.team.leaveSuccess'));
    memberGridApi.query();
    emit('success');
  });
}

const [MemberGrid, memberGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useMemberColumns(onLeave),
    height: 400,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!teamRow.value) return [];
          return await getTeamMembers(teamRow.value.id);
        },
      },
    },
    rowConfig: { keyField: 'characterId' },
    scrollY: { enabled: true, gt: 0 },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<Jx3TeamApi.TeamMember>,
});

watch(gridWrapHeight, (height) => {
  if (height <= 0) return;
  memberGridApi.setGridOptions({ height: Math.max(180, height) });
});

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen) {
    if (isOpen) {
      teamRow.value = drawerApi.getData<Jx3TeamApi.Team>();
      memberGridApi.query();
    }
  },
});

const drawerTitle = computed(() =>
  teamRow.value ? `${$t('jx3.team.members')} - ${teamRow.value.teamName}` : $t('jx3.team.members'),
);

function onJoin() {
  if (!teamRow.value) return;
  joinModalRef.value?.open(teamRow.value);
}

function onJoinSuccess() {
  memberGridApi.query();
  emit('success');
}

async function copyText(text?: string) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  message.success($t('ui.jsonViewer.copied'));
}

function open(row: Jx3TeamApi.Team) {
  drawerApi.setData(row).open();
}

defineExpose({ open });
</script>

<template>
  <Drawer
    :title="drawerTitle"
    class="w-[1200px]"
    content-class="flex min-h-0 flex-col overflow-hidden"
  >
    <MemberJoinModal ref="joinModalRef" @success="onJoinSuccess" />
    <div ref="gridWrapRef" class="flex min-h-0 flex-1 flex-col">
      <MemberGrid>
        <template #toolbar-tools>
          <Button type="primary" @click="onJoin">
            <Plus class="size-5" />
            {{ $t('jx3.team.join') }}
          </Button>
        </template>
        <template #member-account="{ row }">
          <div class="member-copy-cell">
            <span class="truncate">{{ row.account ?? '—' }}</span>
            <button
              v-if="row.account"
              type="button"
              class="member-copy-btn"
              :title="$t('ui.jsonViewer.copy')"
              @click="copyText(row.account)"
            >
              <Copy class="size-4" />
            </button>
          </div>
        </template>
        <template #member-password="{ row }">
          <div class="member-copy-cell">
            <span class="truncate">{{ row.password ?? '—' }}</span>
            <button
              v-if="row.password"
              type="button"
              class="member-copy-btn"
              :title="$t('ui.jsonViewer.copy')"
              @click="copyText(row.password)"
            >
              <Copy class="size-4" />
            </button>
          </div>
        </template>
      </MemberGrid>
    </div>
  </Drawer>
</template>

<style scoped>
.member-copy-cell {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  padding: 0 4px;
}

.member-copy-btn {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  color: hsl(var(--primary));
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.member-copy-btn:hover {
  background: hsl(var(--primary) / 0.1);
}
</style>
