<script lang="ts" setup>
import { Plus, X } from '@vben/icons';

import { Button, Input } from 'antdv-next';

export interface MenuParamItem {
  key: string;
  value: string;
}

const modelValue = defineModel<MenuParamItem[] | null>({ default: null });

function addRow() {
  const list = modelValue.value ? [...modelValue.value] : [];
  list.push({ key: '', value: '' });
  modelValue.value = list;
}

function removeRow(index: number) {
  if (!modelValue.value?.length) return;
  const list = [...modelValue.value];
  list.splice(index, 1);
  modelValue.value = list.length ? list : null;
}

function updateItem(index: number, field: 'key' | 'value', value: string) {
  const list = modelValue.value ? [...modelValue.value] : [];
  const item = list[index];
  if (!item) return;
  list[index] = { ...item, [field]: value };
  modelValue.value = list;
}
</script>

<template>
  <div class="w-full">
    <Button v-if="!modelValue?.length" type="dashed" block @click="addRow">
      {{ $t('system.menu.addRouteParam') }}
    </Button>
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="(item, index) in modelValue"
        :key="index"
        class="flex items-center gap-2"
      >
        <Input
          :placeholder="$t('system.menu.routeParamKey')"
          :value="item.key"
          class="min-w-0 flex-1"
          @update:value="(v) => updateItem(index, 'key', v)"
        />
        <span class="text-muted-foreground shrink-0">=</span>
        <Input
          :placeholder="$t('system.menu.routeParamValue')"
          :value="item.value"
          class="min-w-0 flex-1"
          @update:value="(v) => updateItem(index, 'value', v)"
        />
        <Button
          v-if="index === modelValue.length - 1"
          type="text"
          @click="addRow"
        >
          <Plus class="size-4" />
        </Button>
        <Button danger type="text" @click="removeRow(index)">
          <X class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
