<script lang="ts" setup>
import type { Jx3DungeonTemplateApi } from '#/api/jx3/dungeon-template';

import {
  formatCwSpecLabel,
} from '#/views/jx3/team/utils/layout-composition-issue';

defineProps<{
  rules: Jx3DungeonTemplateApi.SpecRule[];
}>();
</script>

<template>
  <span class="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
    <template v-for="(item, index) in rules" :key="index">
      <span v-if="index > 0" class="text-muted-foreground">、</span>
      <span class="font-medium">
        <template v-if="item.isCw">{{ formatCwSpecLabel(item.specAlias ?? String(item.specId)) }}</template>
        <template v-else>{{ item.specAlias ?? item.specId }}</template>
      </span>
      <span class="text-muted-foreground">×</span>
      <span
        class="mx-0.5 font-semibold tabular-nums text-[15px] leading-none text-primary"
      >
        {{ item.count }}
      </span>
    </template>
  </span>
</template>
