<script lang="ts" setup>
import { InputNumber } from 'antdv-next';

import { $t } from '#/locales';

defineOptions({ inheritAttrs: false });

const modelValue = defineModel<number | undefined>();

function onUpdate(value: null | number | string | undefined) {
  modelValue.value =
    value === null || value === undefined || value === '' ? undefined : Number(value);
}
</script>

<template>
  <InputNumber
    v-bind="$attrs"
    :addon-after="$t('jx3.team.combatPowerUnit')"
    :min="0"
    :precision="0"
    :value="modelValue"
    @update:value="onUpdate"
  />
</template>
