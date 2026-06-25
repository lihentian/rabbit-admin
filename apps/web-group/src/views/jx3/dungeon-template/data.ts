import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3DungeonTemplateApi } from '#/api/jx3/dungeon-template';

import { markRaw } from 'vue';

import { $t } from '#/locales';

import TemplateSpecRulesField from './modules/template-spec-rules-field.vue';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'templateName',
      label: $t('jx3.dungeonTemplate.templateName'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 0 },
      defaultValue: 0,
      fieldName: 'minTCount',
      label: $t('jx3.dungeonTemplate.minTCount'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 0 },
      defaultValue: 0,
      fieldName: 'minNCount',
      label: $t('jx3.dungeonTemplate.minNCount'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 0 },
      fieldName: 'minOrangeWeapon',
      label: $t('jx3.dungeonTemplate.minOrangeWeapon'),
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 0 },
      fieldName: 'minTotalCombatPower',
      label: $t('jx3.dungeonTemplate.minTotalCombatPower'),
    },
    {
      component: markRaw(TemplateSpecRulesField),
      fieldName: 'specRules',
      label: $t('jx3.dungeonTemplate.specRules'),
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('jx3.dungeonTemplate.cdLimitEnabledYes'),
        checkedValue: 1,
        unCheckedChildren: $t('jx3.dungeonTemplate.cdLimitEnabledNo'),
        unCheckedValue: 0,
      },
      defaultValue: 0,
      fieldName: 'cdLimitEnabled',
      label: $t('jx3.dungeonTemplate.cdLimitEnabled'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('jx3.dungeonTemplate.keywords'),
    },
  ];
}

function formatSpecRules(row: Jx3DungeonTemplateApi.Template) {
  const rules = row.specRules;
  if (!rules?.length) return '-';
  return rules
    .map((item) => {
      const name = item.specAlias ?? item.specId;
      const cw = item.isCw ? $t('jx3.dungeonTemplate.isCwShort') : '';
      return `${name}×${item.count}${cw}`;
    })
    .join('、');
}

export function useColumns(
  onActionClick: OnActionClickFn<Jx3DungeonTemplateApi.Template>,
): VxeTableGridColumns {
  return [
    {
      field: 'templateName',
      title: $t('jx3.dungeonTemplate.templateName'),
      width: 140,
    },
    {
      field: 'minTCount',
      title: $t('jx3.dungeonTemplate.minTCount'),
      width: 90,
    },
    {
      field: 'minNCount',
      title: $t('jx3.dungeonTemplate.minNCount'),
      width: 90,
    },
    {
      field: 'minOrangeWeapon',
      formatter: ({ cellValue }) => cellValue ?? '-',
      title: $t('jx3.dungeonTemplate.minOrangeWeapon'),
      width: 100,
    },
    {
      field: 'minTotalCombatPower',
      formatter: ({ cellValue }) => cellValue ?? '-',
      title: $t('jx3.dungeonTemplate.minTotalCombatPower'),
      width: 110,
    },
    {
      field: 'specRules',
      formatter: ({ row }) => formatSpecRules(row),
      minWidth: 200,
      showOverflow: 'tooltip',
      title: $t('jx3.dungeonTemplate.specRules'),
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: $t('jx3.dungeonTemplate.cdLimitEnabledNo'), value: 0 },
          { color: 'success', label: $t('jx3.dungeonTemplate.cdLimitEnabledYes'), value: 1 },
        ],
      },
      field: 'cdLimitEnabled',
      title: $t('jx3.dungeonTemplate.cdLimitEnabled'),
      width: 100,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'templateName',
          nameTitle: $t('jx3.dungeonTemplate.name'),
          onClick: onActionClick,
          options: ['edit', 'delete'],
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.dungeonTemplate.operation'),
      width: 130,
    },
  ];
}
