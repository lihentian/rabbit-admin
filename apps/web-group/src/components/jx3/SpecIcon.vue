<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps<{ alt?: string; src?: null | string }>();

const resolvedSrc = computed(() => {
  if (!props.src) return '';
  if (/^https?:\/\//i.test(props.src)) return props.src;
  const path = props.src.startsWith('/') ? props.src.slice(1) : props.src;
  return `${import.meta.env.BASE_URL}${path}`;
});
</script>

<template>
  <img v-if="resolvedSrc" v-bind="$attrs" :alt="alt ?? ''" :src="resolvedSrc" />
</template>
