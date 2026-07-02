<script lang="ts" setup>
import type { Jx3AccountApi } from '#/api/jx3/account';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Collapse,
  CollapsePanel,
  Descriptions,
  DescriptionsItem,
  Empty,
} from 'antdv-next';

import { getAccountDetail } from '#/api/jx3/account';
import { $t } from '#/locales';
import { formatCombatPowerLabel } from '#/utils/jx3/combat-power';

const accountDetail = ref<Jx3AccountApi.AccountDetail>();
const detailLoading = ref(false);

async function loadAccountDetail(accountId: string) {
  detailLoading.value = true;
  try {
    accountDetail.value = await getAccountDetail(accountId);
  } finally {
    detailLoading.value = false;
  }
}

const [Drawer, drawerApi] = useVbenDrawer({
  async onOpenChange(isOpen) {
    if (isOpen) {
      const row = drawerApi.getData<Jx3AccountApi.Account>();
      accountDetail.value = undefined;
      if (row?.id) {
        await loadAccountDetail(row.id);
      }
    }
  },
});

const drawerTitle = computed(() =>
  accountDetail.value
    ? `${$t('jx3.account.detail')} - ${accountDetail.value.account}`
    : $t('jx3.account.detail'),
);

function getCharacterTitle(
  character: Jx3AccountApi.AccountFullUpdateCharacter,
  index: number,
) {
  const name = character.characterName?.trim();
  return name || `${$t('jx3.character.name')} ${index + 1}`;
}

function open(row: Jx3AccountApi.Account) {
  drawerApi.setData(row).open();
}

defineExpose({ open });
</script>

<template>
  <Drawer :title="drawerTitle" class="w-[860px]">
    <Descriptions
      v-if="accountDetail"
      bordered
      :column="2"
      :loading="detailLoading"
      size="small"
    >
      <DescriptionsItem :label="$t('jx3.account.account')">
        {{ accountDetail.account }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('jx3.account.userId')">
        {{ accountDetail.userId }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('jx3.account.serviceId')">
        {{ accountDetail.serviceId }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('jx3.account.remark')">
        {{ accountDetail.remark ?? '-' }}
      </DescriptionsItem>
    </Descriptions>

    <div class="mt-4">
      <div class="mb-2 font-medium">{{ $t('jx3.account.characters') }}</div>
      <Empty
        v-if="!detailLoading && !accountDetail?.characters?.length"
        :description="$t('jx3.account.noCharacters')"
      />
      <Collapse
        v-else-if="accountDetail?.characters?.length"
        :bordered="false"
        class="account-characters-view"
        default-active-key="0"
      >
        <CollapsePanel
          v-for="(character, charIndex) in accountDetail.characters"
          :key="character.id ?? charIndex"
          :header="getCharacterTitle(character, charIndex)"
        >
          <Descriptions bordered :column="2" size="small">
            <DescriptionsItem :label="$t('jx3.character.characterName')">
              {{ character.characterName }}
            </DescriptionsItem>
            <DescriptionsItem :label="$t('jx3.character.gameArea')">
              {{ character.gameArea }}
            </DescriptionsItem>
            <DescriptionsItem :label="$t('jx3.character.gameServerId')">
              {{ character.serverName ?? '-' }}
            </DescriptionsItem>
          </Descriptions>
          <div class="mt-3 flex flex-col gap-2">
            <div
              v-for="spec in character.specs"
              :key="spec.id"
              class="bg-muted/40 flex flex-wrap items-center gap-x-4 gap-y-1 rounded px-3 py-2 text-sm"
            >
              <span class="font-medium">{{ spec.specAlias ?? spec.specId }}</span>
              <span class="text-muted-foreground">
                {{ $t('jx3.character.combatPower') }}:
                {{
                  formatCombatPowerLabel(
                    spec.combatPower,
                    $t('jx3.team.combatPowerUnit'),
                  )
                }}
              </span>
              <span v-if="spec.isCw" class="text-warning">
                {{ $t('jx3.dungeonTemplate.isCwShort') }}
              </span>
            </div>
          </div>
        </CollapsePanel>
      </Collapse>
    </div>
  </Drawer>
</template>
