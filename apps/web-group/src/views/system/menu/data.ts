import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemMenuApi } from '#/api/system/menu';

import { markRaw } from 'vue';

import { getMenuOptions } from '#/api/system/menu';
import { $t } from '#/locales';

import MenuParamsField from './modules/menu-params-field.vue';

export function getMenuTypeOptions() {
  return [
    { color: 'warning', label: $t('system.menu.typeCatalog'), value: 'C' },
    { color: 'success', label: $t('system.menu.typeMenu'), value: 'M' },
    { color: 'error', label: $t('system.menu.typeButton'), value: 'B' },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('system.menu.keywords'),
    },
  ];
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getMenuOptions,
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
        childrenField: 'children',
      },
      defaultValue: '0',
      fieldName: 'parentId',
      label: $t('system.menu.parent'),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.menu.menuName'),
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: getMenuTypeOptions(),
        optionType: 'button',
      },
      defaultValue: 'M',
      fieldName: 'type',
      label: $t('system.menu.type'),
    },
    {
      component: 'Input',
      dependencies: {
        show: (values) => ['C', 'M'].includes(values.type),
        triggerFields: ['type'],
      },
      fieldName: 'routePath',
      help: (values) =>
        values.type === 'C'
          ? $t('system.menu.routePathHelpCatalog')
          : $t('system.menu.routePathHelpMenu'),
      label: $t('system.menu.routePath'),
    },
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.type === 'C',
        triggerFields: ['type'],
      },
      fieldName: 'redirect',
      help: $t('system.menu.redirectHelp'),
      label: $t('system.menu.redirect'),
    },
    {
      component: 'Input',
      componentProps: {
        addonAfter: '.vue',
        addonBefore: 'src/views/',
      },
      dependencies: {
        rules: (values) => (values.type === 'M' ? 'required' : null),
        show: (values) => values.type === 'M',
        triggerFields: ['type'],
      },
      fieldName: 'component',
      help: $t('system.menu.componentHelp'),
      label: $t('system.menu.component'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.yes'), value: 1 },
          { label: $t('common.no'), value: 0 },
        ],
        optionType: 'button',
      },
      defaultValue: 0,
      dependencies: {
        show: (values) => values.type === 'M',
        triggerFields: ['type'],
      },
      fieldName: 'keepAlive',
      label: $t('system.menu.keepAlive'),
    },
    {
      component: 'Input',
      dependencies: {
        rules: (values) =>
          values.type === 'M' && values.keepAlive === 1 ? 'required' : null,
        show: (values) => values.type === 'M' && values.keepAlive === 1,
        triggerFields: ['type', 'keepAlive'],
      },
      fieldName: 'routeName',
      help: $t('system.menu.routeNameHelp'),
      label: $t('system.menu.routeName'),
    },
    {
      component: markRaw(MenuParamsField),
      defaultValue: null,
      dependencies: {
        show: (values) => values.type === 'M',
        triggerFields: ['type'],
      },
      fieldName: 'params',
      help: $t('system.menu.routeParamsHelp'),
      label: $t('system.menu.routeParams'),
    },
    {
      component: 'Input',
      dependencies: {
        rules: (values) => (values.type === 'B' ? 'required' : null),
        show: (values) => values.type === 'B',
        triggerFields: ['type'],
      },
      fieldName: 'perm',
      label: $t('system.menu.perm'),
    },
    {
      component: 'IconPicker',
      componentProps: { prefix: 'mdi' },
      dependencies: {
        show: (values) => values.type !== 'B',
        triggerFields: ['type'],
      },
      fieldName: 'icon',
      label: $t('system.menu.icon'),
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full' },
      defaultValue: 0,
      fieldName: 'sort',
      label: $t('system.menu.sort'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'visible',
      label: $t('system.menu.visible'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.yes'), value: 1 },
          { label: $t('common.no'), value: 0 },
        ],
        optionType: 'button',
      },
      defaultValue: 0,
      dependencies: {
        show: (values) => values.type === 'C',
        triggerFields: ['type'],
      },
      fieldName: 'alwaysShow',
      label: $t('system.menu.alwaysShow'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<SystemMenuApi.Menu>,
): VxeTableGridColumns<SystemMenuApi.Menu> {
  return [
    {
      field: 'name',
      fixed: 'left',
      title: $t('system.menu.menuName'),
      treeNode: true,
      width: 200,
    },
    {
      align: 'center',
      cellRender: { name: 'CellTag', options: getMenuTypeOptions() },
      field: 'type',
      title: $t('system.menu.type'),
      width: 90,
    },
    { field: 'routePath', minWidth: 140, title: $t('system.menu.routePath') },
    { field: 'component', minWidth: 160, title: $t('system.menu.component') },
    { field: 'perm', minWidth: 160, title: $t('system.menu.perm') },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.enabled'), value: 1 },
          { color: 'default', label: $t('common.disabled'), value: 0 },
        ],
      },
      field: 'visible',
      title: $t('system.menu.visible'),
      width: 90,
    },
    { field: 'sort', title: $t('system.menu.sort'), width: 80 },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.menu.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [{ code: 'append', text: $t('system.menu.appendChild') }, 'edit', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.menu.operation'),
      width: 200,
    },
  ];
}
