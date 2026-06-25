<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Plus, X } from '@vben/icons';

import { Button, InputNumber, Select, Switch } from 'antdv-next';

import { getSpecOptions } from '#/api/jx3/spec';
import { $t } from '#/locales';

export interface TemplateSpecRuleItem {
  count: number;
  isCw?: boolean;
  specId?: number;
}

const modelValue = defineModel<null | TemplateSpecRuleItem[]>({ default: null });

const specOptions = ref<Array<{ label: string; value: number }>>([]);

onMounted(async () => {
  const list = await getSpecOptions();
  specOptions.value = list.map((item) => ({
    label: item.label,
    value: Number(item.value),
  }));
});

function addRow() {
  const list = modelValue.value ? [...modelValue.value] : [];
  list.push({ count: 1, isCw: false });
  modelValue.value = list;
}

function removeRow(index: number) {
  if (!modelValue.value?.length) return;
  const list = [...modelValue.value];
  list.splice(index, 1);
  modelValue.value = list.length ? list : null;
}

function updateItem<K extends keyof TemplateSpecRuleItem>(
  index: number,
  field: K,
  value: TemplateSpecRuleItem[K],
) {
  const list = modelValue.value ? [...modelValue.value] : [];
  const item = list[index];
  if (!item) return;
  list[index] = { ...item, [field]: value };
  modelValue.value = list;
}
</script>

<template>
  <div class="w-full">
    <Button v-if="!modelValue?.length" block type="dashed" @click="addRow">
      {{ $t('jx3.dungeonTemplate.addSpecRule') }}
    </Button>
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="(item, index) in modelValue"
        :key="index"
        class="spec-rule-row flex items-center gap-2"
      >
        <Select
          class="w-[80px]! shrink-0"
          :options="specOptions"
          :placeholder="$t('jx3.dungeonTemplate.specId')"
          :value="item.specId"
          show-search
          @update:value="(v) => updateItem(index, 'specId', Number(v))"
        />
        <InputNumber
          :min="1"
          :value="item.count"
          class="w-[48px]! shrink-0"
          @update:value="(v) => updateItem(index, 'count', Number(v) || 1)"
        />
        <div class="flex shrink-0 items-center gap-1.5">
          <span class="text-muted-foreground text-sm">
            {{ $t('jx3.dungeonTemplate.isCw') }}
          </span>
          <Switch :checked="!!item.isCw" @update:checked="(v) => updateItem(index, 'isCw', v)" />
        </div>
        <div class="ml-3 flex shrink-0 items-center gap-1">
          <Button danger size="small" @click="removeRow(index)">
            <X class="size-4" />
          </Button>
          <Button
            :aria-hidden="index !== modelValue.length - 1"
            :class="{
              invisible: index !== modelValue.length - 1,
              'pointer-events-none': index !== modelValue.length - 1,
            }"
            :tabindex="index === modelValue.length - 1 ? 0 : -1"
            size="small"
            type="dashed"
            @click="addRow"
          >
            <Plus class="size-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
