<script lang="ts" setup>
import type { Jx3TeamApi } from '#/api/jx3/team';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { Copy } from '@vben/icons';

import { useDebounceFn } from '@vueuse/core';
import {
  Alert,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  TabPane,
  Tabs,
} from 'antdv-next';

import { getTeamLootRecords, updateTeamLootRecords } from '#/api/jx3/team';
import { $t } from '#/locales';

interface LootDrawerData {
  teamId: string;
  teamName?: string;
}

const MIN_SLOT = 1;
const MAX_SLOT = 20;
const DEFAULT_SLOT = 7;
const DEFAULT_GOLD_RATIO = 10.5;
const MIN_GOLD_RATIO = 0.01;

const teamId = ref('');
const teamName = ref<string | undefined>();
const records = ref<Jx3TeamApi.LootRecordsResult>();
const loading = ref(false);
const saveStatus = ref<'' | 'error' | 'saved' | 'saving'>('');
const activeTabKey = ref<'accounts' | 'items' | 'summary'>('items');

const bossCount = computed(() => records.value?.bossCount ?? 0);
const slotCount = computed(() => records.value?.slotCount ?? DEFAULT_SLOT);
const goldRatio = computed(() => records.value?.goldRatio ?? DEFAULT_GOLD_RATIO);
const bosses = computed(() => records.value?.bosses ?? []);
const members = computed(() => records.value?.members ?? []);

const memberOptions = computed(() =>
  members.value.map((m) => ({ label: m.characterName, value: m.characterId })),
);

const memberNameMap = computed(() => {
  const map = new Map<string, string>();
  for (const m of members.value) map.set(m.characterId, m.characterName);
  return map;
});

const bossGridRows = computed(() => Math.max(1, Math.ceil(bosses.value.length / 2)));

const drawerTitle = computed(() => {
  const base = $t('jx3.team.loot.title');
  return teamName.value ? `${base} - ${teamName.value}` : base;
});

function genId(bossIndex: number, slot: number) {
  return `${bossIndex}-${slot}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function fillBossSlots(boss: Jx3TeamApi.LootBoss, target: number): Jx3TeamApi.LootBoss {
  const bySlot = new Map<number, Jx3TeamApi.LootItem>();
  for (const it of boss.items ?? []) {
    if (Number.isFinite(it.slot) && it.slot >= 1 && it.slot <= target) {
      bySlot.set(it.slot, it);
    }
  }
  const items: Jx3TeamApi.LootItem[] = [];
  for (let s = 1; s <= target; s++) {
    const existed = bySlot.get(s);
    items.push(existed ?? { id: genId(boss.bossIndex, s), slot: s });
  }
  return { ...boss, items };
}

function isSlotFilled(item?: Jx3TeamApi.LootItem) {
  if (!item) return false;
  return Boolean(
    (item.name && item.name.trim())
      || (item.category && item.category.trim())
      || item.ownerCharacterId
      || (item.quantity && item.quantity > 0)
      || (item.price && item.price > 0)
      || (item.remark && item.remark.trim()),
  );
}

async function onChangeSlotCount(next: null | number | string | undefined) {
  const current = records.value;
  if (!current) return;
  const value = Number(next);
  if (!Number.isFinite(value) || value < MIN_SLOT || value > MAX_SLOT) return;
  if (value === current.slotCount) return;
  if (value < current.slotCount) {
    const droppedHasContent = current.bosses.some((boss) =>
      (boss.items ?? []).some((it) => it.slot > value && isSlotFilled(it)),
    );
    if (droppedHasContent) {
      const ok = await new Promise<boolean>((resolve) => {
        Modal.confirm({
          cancelText: $t('common.cancel'),
          okText: $t('common.confirm'),
          title: $t('jx3.team.loot.slotCountShrinkConfirm'),
          onCancel: () => resolve(false),
          onOk: () => resolve(true),
        });
      });
      if (!ok) return;
    }
  }
  current.slotCount = value;
  current.bosses = current.bosses.map((b) => fillBossSlots(b, value));
  scheduleAutoSave();
}

function onChangeGoldRatio(next: null | number | string | undefined) {
  const current = records.value;
  if (!current) return;
  const value = Number(next);
  if (!Number.isFinite(value) || value < MIN_GOLD_RATIO) return;
  const rounded = Math.round(value * 100) / 100;
  if (rounded === current.goldRatio) return;
  current.goldRatio = rounded;
  scheduleAutoSave();
}

function onSlotFieldChange() {
  scheduleAutoSave();
}

function onClearSlot(bossIndex: number, slot: number) {
  Modal.confirm({
    cancelText: $t('common.cancel'),
    okText: $t('common.confirm'),
    title: $t('jx3.team.loot.clearSlotConfirm'),
    onOk() {
      const boss = records.value?.bosses.find((b) => b.bossIndex === bossIndex);
      if (!boss) return;
      const idx = boss.items.findIndex((it) => it.slot === slot);
      if (idx >= 0) {
        boss.items.splice(idx, 1, { id: genId(bossIndex, slot), slot });
        scheduleAutoSave();
      }
    },
  });
}

const debouncedSave = useDebounceFn(async () => {
  if (!teamId.value) return;
  const current = records.value;
  if (!current) return;
  const payload: Jx3TeamApi.UpdateLootRecordsPayload = {
    slotCount: current.slotCount,
    goldRatio: current.goldRatio ?? DEFAULT_GOLD_RATIO,
    bosses: current.bosses.map((b) => ({
      bossIndex: b.bossIndex,
      bossName: b.bossName,
      items: b.items,
    })),
  };
  saveStatus.value = 'saving';
  try {
    const result = await updateTeamLootRecords(teamId.value, payload);
    records.value = result;
    saveStatus.value = 'saved';
  } catch {
    saveStatus.value = 'error';
    message.error($t('jx3.team.loot.autoSaveFailed'));
  }
}, 600);

function scheduleAutoSave() {
  saveStatus.value = 'saving';
  debouncedSave();
}

async function loadData() {
  if (!teamId.value) {
    records.value = undefined;
    return;
  }
  loading.value = true;
  try {
    const result = await getTeamLootRecords(teamId.value);
    if (result.goldRatio === undefined || result.goldRatio === null) {
      result.goldRatio = DEFAULT_GOLD_RATIO;
    }
    records.value = result;
    saveStatus.value = '';
  } finally {
    loading.value = false;
  }
}

function reset() {
  records.value = undefined;
  teamId.value = '';
  teamName.value = undefined;
  saveStatus.value = '';
  activeTabKey.value = 'items';
  loading.value = false;
}

const summaryByOwner = computed(() => {
  const ratio = goldRatio.value || DEFAULT_GOLD_RATIO;
  const map = new Map<
    string,
    {
      characterId: string;
      characterName: string;
      equipments: string[];
      items: string[];
      totalPrice: number;
    }
  >();
  for (const boss of bosses.value) {
    for (const it of boss.items) {
      if (!isSlotFilled(it)) continue;
      const cid = it.ownerCharacterId;
      if (!cid) continue;
      const name = memberNameMap.value.get(cid) ?? cid;
      const bucket = map.get(cid) ?? {
        characterId: cid,
        characterName: name,
        equipments: [],
        items: [],
        totalPrice: 0,
      };
      const qty = Number(it.quantity) || 1;
      const goldPrice = Number(it.price) || 0;
      const rmb = Math.floor((goldPrice * 100) / ratio);
      const category = it.category?.trim() || '';
      const itemName = it.name?.trim() || '';
      const parts: string[] = [];
      if (category) parts.push(category);
      if (itemName) parts.push(itemName);
      const label = parts.join('-');
      if (label) bucket.items.push(label);
      if (label) bucket.equipments.push(label);
      bucket.totalPrice += qty * rmb;
      map.set(cid, bucket);
    }
  }
  return [...map.values()].sort((a, b) => b.totalPrice - a.totalPrice);
});

const settlementRows = computed(() => {
  const memberMap = new Map<string, Jx3TeamApi.LootMember>();
  for (const m of members.value) memberMap.set(m.characterId, m);
  return summaryByOwner.value.map((row) => {
    const m = memberMap.get(row.characterId);
    return {
      characterId: row.characterId,
      characterName: row.characterName,
      equipments: row.equipments,
      account: m?.account ?? '',
      password: m?.password ?? '',
      gameArea: m?.gameArea ?? '',
      serverName: m?.serverName ?? '',
      accountRemark: m?.accountRemark ?? '',
    };
  });
});

const grandTotal = computed(() =>
  summaryByOwner.value.reduce((acc, x) => acc + x.totalPrice, 0),
);

async function copyText(text?: null | string) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  message.success($t('ui.jsonViewer.copied'));
}

function formatUpdatedAt(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen) {
    if (!isOpen) {
      reset();
      return;
    }
    const data = drawerApi.getData<LootDrawerData>();
    teamId.value = data?.teamId ?? '';
    teamName.value = data?.teamName;
    activeTabKey.value = 'items';
    if (teamId.value) void loadData();
  },
});
</script>

<template>
  <Drawer :title="drawerTitle" class="w-[80%]">
    <template #extra>
      <div class="flex items-center gap-2 text-xs">
        <span v-if="saveStatus === 'saving'" class="text-muted-foreground">
          {{ $t('jx3.team.loot.autoSaving') }}
        </span>
        <span v-else-if="saveStatus === 'saved'" class="text-emerald-500">
          {{ $t('jx3.team.loot.autoSaved') }}
        </span>
        <span v-else-if="saveStatus === 'error'" class="text-red-500">
          {{ $t('jx3.team.loot.autoSaveFailed') }}
        </span>
        <span
          v-if="records?.updatedAt"
          class="text-muted-foreground ml-1"
        >
          {{ $t('jx3.team.loot.updatedAt', [formatUpdatedAt(records.updatedAt)]) }}
        </span>
      </div>
    </template>

    <div class="flex h-full min-h-0 flex-col gap-3">
      <Alert
        v-if="bossCount === 0"
        type="warning"
        show-icon
        :message="$t('jx3.team.loot.notConfigured')"
      />

      <template v-else>
        <Tabs v-model:active-key="activeTabKey">
          <template #rightExtra>
            <div class="flex items-center gap-2 text-sm">
              <span class="text-muted-foreground">
                {{ $t('jx3.team.loot.slotCount') }}
              </span>
              <InputNumber
                :value="slotCount"
                :min="MIN_SLOT"
                :max="MAX_SLOT"
                :precision="0"
                :disabled="loading"
                class="w-24"
                @change="onChangeSlotCount"
              />
              <span class="text-muted-foreground">
                {{ $t('jx3.team.loot.goldRatio') }}
              </span>
              <InputNumber
                :value="goldRatio"
                :min="MIN_GOLD_RATIO"
                :precision="2"
                :step="0.01"
                :disabled="loading"
                class="w-24"
                @change="onChangeGoldRatio"
              />
            </div>
          </template>

          <TabPane key="items" :tab="$t('jx3.team.loot.tabItems')">
            <div
              class="grid border-l border-t border-solid border-gray-200 dark:border-gray-700"
              :style="{
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gridTemplateRows: `repeat(${bossGridRows}, minmax(0, auto))`,
                gridAutoFlow: 'column',
              }"
            >
                <div
                  v-for="boss in bosses"
                  :key="boss.bossIndex"
                  class="flex flex-col overflow-hidden border-b border-r border-solid border-gray-200 dark:border-gray-700"
                >
                  <div class="bg-primary/10 text-primary px-2 py-1 text-sm font-semibold">
                    {{ boss.bossName || $t('jx3.team.loot.bossTab', [boss.bossIndex]) }}
                  </div>
                  <div class="divide-y divide-gray-100 dark:divide-gray-800">
                    <div
                      v-for="item in boss.items"
                      :key="item.id"
                      class="grid items-center gap-1 px-2 py-1"
                      :style="{
                        gridTemplateColumns: '72px 1fr 120px 1fr auto',
                      }"
                    >
                      <Input
                        v-model:value="item.category"
                        :placeholder="$t('jx3.team.loot.columnCategory')"
                        size="small"
                        :bordered="false"
                        @change="onSlotFieldChange"
                      />
                      <Input
                        v-model:value="item.name"
                        :placeholder="$t('jx3.team.loot.columnName')"
                        size="small"
                        :bordered="false"
                        @change="onSlotFieldChange"
                      />
                      <Select
                        v-model:value="item.ownerCharacterId"
                        :options="memberOptions"
                        :placeholder="$t('jx3.team.loot.unassigned')"
                        allow-clear
                        size="small"
                        :bordered="false"
                        class="w-full"
                        @change="onSlotFieldChange"
                      />
                      <InputNumber
                        v-model:value="item.price"
                        :placeholder="$t('jx3.team.loot.columnPrice')"
                        :min="0"
                        :precision="0"
                        size="small"
                        :controls="false"
                        :bordered="false"
                        class="w-full"
                        @change="onSlotFieldChange"
                      />
                      <button
                        v-if="isSlotFilled(item)"
                        type="button"
                        class="text-muted-foreground hover:text-red-500 text-xs"
                        :title="$t('jx3.team.loot.clearSlot')"
                        @click="onClearSlot(boss.bossIndex, item.slot)"
                      >
                        ×
                      </button>
                      <span v-else class="text-muted-foreground/40 text-xs">·</span>
                    </div>
                  </div>
                </div>
              </div>
          </TabPane>

          <TabPane key="summary" :tab="$t('jx3.team.loot.tabSummary')">
            <div class="border border-solid border-gray-200 p-3 dark:border-gray-700">
              <div class="mb-2 flex items-center justify-end">
                <span class="text-xs text-emerald-500">
                  {{ $t('jx3.team.loot.grandTotal') }}: {{ grandTotal }}
                </span>
              </div>
              <div v-if="summaryByOwner.length === 0" class="text-muted-foreground text-xs">
                {{ $t('jx3.team.loot.empty') }}
              </div>
              <table v-else class="w-full text-sm">
                <thead>
                  <tr class="text-muted-foreground text-left text-xs">
                    <th class="py-1 pr-2">{{ $t('jx3.team.loot.summaryColumnCharacter') }}</th>
                    <th class="py-1 pr-2">{{ $t('jx3.team.loot.summaryColumnItems') }}</th>
                    <th class="py-1 text-right">{{ $t('jx3.team.loot.summaryColumnTotalPrice') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in summaryByOwner"
                    :key="row.characterId"
                    class="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td class="py-1 pr-2 font-medium">{{ row.characterName }}</td>
                    <td class="py-1 pr-2">{{ row.items.join('、') }}</td>
                    <td class="py-1 text-right">{{ row.totalPrice }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabPane>

          <TabPane key="accounts" :tab="$t('jx3.team.loot.tabAccounts')">
            <div class="border border-solid border-gray-200 p-3 dark:border-gray-700">
              <div v-if="settlementRows.length === 0" class="text-muted-foreground text-xs">
                {{ $t('jx3.team.loot.empty') }}
              </div>
              <table v-else class="w-full text-sm">
                <thead>
                  <tr class="text-muted-foreground text-left text-xs">
                    <th class="py-1 pr-2">{{ $t('jx3.team.loot.summaryColumnCharacter') }}</th>
                    <th class="py-1 pr-2">{{ $t('jx3.team.loot.settlementColumnEquipments') }}</th>
                    <th class="py-1 pr-2">{{ $t('jx3.account.account') }}</th>
                    <th class="py-1 pr-2">{{ $t('jx3.account.password') }}</th>
                    <th class="py-1 pr-2">{{ $t('jx3.team.gameServer') }}</th>
                    <th class="py-1 pr-2">{{ $t('jx3.account.remark') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in settlementRows"
                    :key="row.characterId"
                    class="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td class="py-1 pr-2 font-medium">{{ row.characterName }}</td>
                    <td class="py-1 pr-2">{{ row.equipments.join('、') || '—' }}</td>
                    <td class="py-1 pr-2">
                      <span class="mr-1">{{ row.account || '—' }}</span>
                      <button
                        v-if="row.account"
                        type="button"
                        class="text-muted-foreground hover:text-primary inline-flex align-middle"
                        :title="$t('ui.jsonViewer.copy')"
                        @click="copyText(row.account)"
                      >
                        <Copy class="size-3.5" />
                      </button>
                    </td>
                    <td class="py-1 pr-2">
                      <span class="mr-1 font-mono">{{ row.password || '—' }}</span>
                      <button
                        v-if="row.password"
                        type="button"
                        class="text-muted-foreground hover:text-primary inline-flex align-middle"
                        :title="$t('ui.jsonViewer.copy')"
                        @click="copyText(row.password)"
                      >
                        <Copy class="size-3.5" />
                      </button>
                    </td>
                    <td class="py-1 pr-2">
                      {{ [row.gameArea, row.serverName].filter(Boolean).join(' · ') || '—' }}
                    </td>
                    <td class="py-1 pr-2">{{ row.accountRemark || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabPane>
        </Tabs>
      </template>
    </div>
  </Drawer>
</template>
