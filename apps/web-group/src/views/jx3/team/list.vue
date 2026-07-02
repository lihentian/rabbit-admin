<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Jx3TeamApi } from '#/api/jx3/team';

import { h, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { completeTeam, deleteTeam, getTeamList } from '#/api/jx3/team';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import MemberDrawer from './modules/member-drawer.vue';
import { useJx3TeamAccess } from '#/composables/use-jx3-team-access';

const router = useRouter();
const teamAccess = useJx3TeamAccess();
const memberDrawerRef = ref<InstanceType<typeof MemberDrawer>>();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: Jx3TeamApi.Team) {
  formDrawerApi.setData(row).open();
}

function onCreate() {
  formDrawerApi.setData(null).open();
}

function onConfig(row: Jx3TeamApi.Team) {
  router.push({
    name: 'Jx3TeamConfig',
    query: {
      teamId: row.id,
    },
  });
}

function onMembers(row: Jx3TeamApi.Team) {
  memberDrawerRef.value?.open(row);
}

function isTeamFull(team: Jx3TeamApi.Team) {
  return (
    team.status === 2 ||
    (team.playerCount != null && (team.memberCount ?? 0) >= team.playerCount)
  );
}

function confirmComplete(team: Jx3TeamApi.Team) {
  const full = isTeamFull(team);
  const memberSummary = `${team.memberCount ?? 0}/${team.playerCount ?? '-'}`;

  return new Promise<void>((resolve, reject) => {
    Modal.confirm({
      cancelText: $t('common.cancel'),
      content: full
        ? $t('jx3.team.completeConfirm')
        : h('div', { class: 'space-y-2' }, [
            h(
              'p',
              { class: 'font-semibold text-destructive' },
              $t('jx3.team.forceCompleteConfirm'),
            ),
            h(
              'p',
              { class: 'text-sm text-muted-foreground' },
              `${$t('jx3.team.memberPlayerCount')}：${memberSummary}`,
            ),
          ]),
      okText: $t('jx3.team.complete'),
      okType: full ? 'primary' : 'danger',
      onCancel() {
        reject(new Error('cancelled'));
      },
      onOk() {
        resolve();
      },
      title: $t('jx3.team.complete'),
    });
  });
}

async function onComplete(row: Jx3TeamApi.Team) {
  if (row.status === 3) return;
  try {
    await confirmComplete(row);
    await completeTeam(row.id, !isTeamFull(row));
    message.success($t('jx3.team.completeSuccess'));
    refreshGrid();
  } catch {
    // cancelled or failed
  }
}

function onDelete(row: Jx3TeamApi.Team) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.teamName]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteTeam(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.teamName]),
        key: 'action_process_msg',
      });
      refreshGrid();
    })
    .catch(() => {
      hideLoading();
    });
}

function onActionClick({ code, row }: OnActionClickParams<Jx3TeamApi.Team>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'config': {
      onConfig(row);
      break;
    }
    case 'members': {
      onMembers(row);
      break;
    }
    case 'complete': {
      onComplete(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick, teamAccess),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getTeamList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<Jx3TeamApi.Team>,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="refreshGrid" />
    <MemberDrawer ref="memberDrawerRef" @success="refreshGrid" />
    <Grid :table-title="$t('jx3.team.list')">
      <template #toolbar-tools>
        <Button v-if="teamAccess.canCreate.value" type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('jx3.team.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
