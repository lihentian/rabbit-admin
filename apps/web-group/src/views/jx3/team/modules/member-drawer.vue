<script lang="ts" setup>
import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Button, message, Modal, Space } from 'antdv-next';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  completeTeam,
  getTeamMembers,
  joinTeam,
  leaveTeam,
} from '#/api/jx3/team';
import { $t } from '#/locales';

import { useJoinFormSchema, useMemberColumns } from '../data';

const emit = defineEmits<{ success: [] }>();

const teamRow = ref<Jx3TeamApi.Team>();

const [JoinForm, joinFormApi] = useVbenForm({
  schema: useJoinFormSchema(),
  showDefaultActions: false,
});

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
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!teamRow.value) return { items: [], total: 0 };
          const items = await getTeamMembers(teamRow.value.id);
          return { items, total: items.length };
        },
      },
    },
    rowConfig: { keyField: 'characterId' },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<Jx3TeamApi.TeamMember>,
});

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen) {
    if (isOpen) {
      teamRow.value = drawerApi.getData<Jx3TeamApi.Team>();
      joinFormApi.resetForm();
      memberGridApi.query();
    }
  },
});

const drawerTitle = computed(() =>
  teamRow.value
    ? `${$t('jx3.team.members')} - ${teamRow.value.teamName}`
    : $t('jx3.team.members'),
);

async function onJoin() {
  const { valid } = await joinFormApi.validate();
  if (!valid || !teamRow.value) return;
  const values = await joinFormApi.getValues();
  await joinTeam(teamRow.value.id, values);
  message.success($t('jx3.team.joinSuccess'));
  joinFormApi.resetForm();
  memberGridApi.query();
  emit('success');
}

function confirm(content: string, title: string) {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      content,
      onCancel() {
        reject(new Error('cancelled'));
      },
      onOk() {
        resolve(true);
      },
      title,
    });
  });
}

async function onComplete(force = false) {
  if (!teamRow.value) return;
  try {
    if (force) {
      await confirm(
        $t('jx3.team.forceCompleteConfirm'),
        $t('jx3.team.forceComplete'),
      );
    } else {
      await confirm(
        $t('jx3.team.completeConfirm'),
        $t('jx3.team.complete'),
      );
    }
    await completeTeam(teamRow.value.id, force);
    message.success($t('jx3.team.completeSuccess'));
    emit('success');
    drawerApi.close();
  } catch {
    // cancelled or failed
  }
}

function open(row: Jx3TeamApi.Team) {
  drawerApi.setData(row).open();
}

defineExpose({ open });
</script>

<template>
  <Drawer :title="drawerTitle" class="w-[900px]">
    <div class="mb-4">
      <JoinForm />
      <div class="mt-3 flex justify-end">
        <Button type="primary" @click="onJoin">
          {{ $t('jx3.team.join') }}
        </Button>
      </div>
    </div>
    <MemberGrid />
    <div class="mt-4 flex justify-end">
      <Space>
        <Button type="primary" @click="onComplete(false)">
          {{ $t('jx3.team.complete') }}
        </Button>
        <Button danger @click="onComplete(true)">
          {{ $t('jx3.team.forceComplete') }}
        </Button>
      </Space>
    </div>
  </Drawer>
</template>
