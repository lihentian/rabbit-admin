import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Jx3SpecApi } from '#/api/jx3/spec';

import { getSectOptions } from '#/api/jx3/sect';
import { $t } from '#/locales';

function usePositionOptions() {
  return [
    { label: $t('jx3.spec.positionD'), value: 'd' },
    { label: $t('jx3.spec.positionT'), value: 't' },
    { label: $t('jx3.spec.positionN'), value: 'n' },
  ];
}

function useAttackTypeOptions() {
  return [
    { label: $t('jx3.spec.attackTypeMelee'), value: 1 },
    { label: $t('jx3.spec.attackTypeRanged'), value: 2 },
  ];
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        api: getSectOptions,
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
      },
      fieldName: 'sectId',
      label: $t('jx3.spec.sectName'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'specName',
      label: $t('jx3.spec.specName'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'specAlias',
      label: $t('jx3.spec.specAlias'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: usePositionOptions(),
      },
      fieldName: 'position',
      label: $t('jx3.spec.position'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: useAttackTypeOptions(),
      },
      dependencies: {
        show(values) {
          return values.position === 'd';
        },
        triggerFields: ['position'],
      },
      fieldName: 'attackType',
      label: $t('jx3.spec.attackType'),
    },
    {
      component: 'Input',
      fieldName: 'specIcon',
      label: $t('jx3.spec.specIcon'),
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full' },
      defaultValue: 0,
      fieldName: 'sort',
      label: $t('jx3.spec.sort'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('jx3.spec.keywords'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSectOptions,
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
      },
      fieldName: 'sectId',
      label: $t('jx3.spec.sectName'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: usePositionOptions(),
      },
      fieldName: 'position',
      label: $t('jx3.spec.position'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<Jx3SpecApi.Spec>,
): VxeTableGridColumns {
  const positionOptions = usePositionOptions();
  const attackTypeOptions = useAttackTypeOptions();

  return [
    {
      align: 'center',
      cellRender: {
        name: 'CellSpecIcon',
        props: { height: 32, width: 32 },
      },
      field: 'specIcon',
      title: $t('jx3.spec.specIcon'),
      width: 70,
    },
    { field: 'sectName', title: $t('jx3.spec.sectName'), width: 120 },
    { field: 'specName', title: $t('jx3.spec.specName'), width: 120 },
    { field: 'specAlias', minWidth: 120, title: $t('jx3.spec.specAlias') },
    {
      field: 'position',
      formatter: ({ cellValue }) =>
        positionOptions.find((item) => item.value === cellValue)?.label ??
        cellValue,
      title: $t('jx3.spec.position'),
      width: 90,
    },
    {
      field: 'attackType',
      formatter: ({ cellValue }) =>
        attackTypeOptions.find((item) => item.value === cellValue)?.label ??
        cellValue,
      title: $t('jx3.spec.attackType'),
      width: 100,
    },
    { field: 'sort', title: $t('jx3.spec.sort'), width: 80 },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'specAlias',
          nameTitle: $t('jx3.spec.name'),
          onClick: onActionClick,
          options: ['edit', 'delete'],
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('jx3.spec.operation'),
      width: 130,
    },
  ];
}
