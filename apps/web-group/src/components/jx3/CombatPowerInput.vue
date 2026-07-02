<script lang="ts" setup>
import type { InputNumberProps } from 'antdv-next';

import { InputNumber } from 'antdv-next';

import { $t } from '#/locales';
import {
  formatCombatPowerWan,
  parseCombatPowerInput,
} from '#/utils/jx3/combat-power';

defineOptions({ inheritAttrs: false });

const modelValue = defineModel<number | undefined>();

const formatter: InputNumberProps['formatter'] = (value) =>
  formatCombatPowerWan(value);

const parser: InputNumberProps['parser'] = (display) =>
  parseCombatPowerInput(display);

function onUpdate(value: null | number | string | undefined) {
  modelValue.value =
    value === null || value === undefined || value === '' ? undefined : Number(value);
}
</script>

<template>
  <InputNumber
    v-bind="$attrs"
    :addon-after="$t('jx3.team.combatPowerUnit')"
    :formatter="formatter"
    :parser="parser"
    :value="modelValue"
    @update:value="onUpdate"
  />
</template>
