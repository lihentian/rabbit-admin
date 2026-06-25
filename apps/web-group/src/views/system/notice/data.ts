import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemNoticeApi } from '#/api/system/notice';

import { getDictItemOptions } from '#/api/system/dict';
import { getUserOptions } from '#/api/system/user';
import { $t } from '#/locales';

export const NOTICE_STATUS_DRAFT = 0;
export const NOTICE_STATUS_PUBLISHED = 1;
export const NOTICE_STATUS_REVOKED = 2;
export const NOTICE_TARGET_ALL = 1;
export const NOTICE_TARGET_SPECIFIED = 2;

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('system.notice.noticeTitle'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: () => getDictItemOptions('notice_type'),
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
      },
      fieldName: 'type',
      label: $t('system.notice.type'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: () => getDictItemOptions('notice_level'),
        class: 'w-full',
        labelField: 'label',
        valueField: 'value',
      },
      defaultValue: 'L',
      fieldName: 'level',
      label: $t('system.notice.level'),
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('system.notice.targetAll'), value: NOTICE_TARGET_ALL },
          {
            label: $t('system.notice.targetSpecified'),
            value: NOTICE_TARGET_SPECIFIED,
          },
        ],
        optionType: 'button',
      },
      defaultValue: NOTICE_TARGET_ALL,
      fieldName: 'targetType',
      label: $t('system.notice.targetType'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getUserOptions,
        class: 'w-full',
        labelField: 'label',
        mode: 'multiple',
        valueField: 'value',
      },
      dependencies: {
        show: (values) => values.targetType === NOTICE_TARGET_SPECIFIED,
        triggerFields: ['targetType'],
      },
      fieldName: 'targetUserIds',
      label: $t('system.notice.targetUsers'),
      rules: 'required',
    },
    {
      component: 'Textarea',
      componentProps: { rows: 8 },
      fieldName: 'content',
      label: $t('system.notice.content'),
      rules: 'required',
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keywords',
      label: $t('system.notice.noticeTitle'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('system.notice.statusDraft'), value: NOTICE_STATUS_DRAFT },
          {
            label: $t('system.notice.statusPublished'),
            value: NOTICE_STATUS_PUBLISHED,
          },
          {
            label: $t('system.notice.statusRevoked'),
            value: NOTICE_STATUS_REVOKED,
          },
        ],
      },
      fieldName: 'publishStatus',
      label: $t('system.notice.publishStatus'),
    },
  ];
}

export function getPublishStatusOptions() {
  return [
    { color: 'default', label: $t('system.notice.statusDraft'), value: 0 },
    { color: 'success', label: $t('system.notice.statusPublished'), value: 1 },
    { color: 'warning', label: $t('system.notice.statusRevoked'), value: 2 },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<SystemNoticeApi.Notice>,
): VxeTableGridColumns<SystemNoticeApi.Notice> {
  return [
    { field: 'title', minWidth: 180, title: $t('system.notice.noticeTitle') },
    { field: 'type', title: $t('system.notice.type'), width: 100 },
    { field: 'level', title: $t('system.notice.level'), width: 90 },
    { field: 'publisherName', title: $t('system.notice.publisher'), width: 110 },
    {
      cellRender: { name: 'CellTag', options: getPublishStatusOptions() },
      field: 'publishStatus',
      title: $t('system.notice.publishStatus'),
      width: 100,
    },
    { field: 'publishTime', title: $t('system.notice.publishTime'), width: 170 },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'title',
          nameTitle: $t('system.notice.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'detail', text: $t('system.notice.detail') },
          { code: 'publish', text: $t('system.notice.publish'), show: (row) => row.publishStatus !== NOTICE_STATUS_PUBLISHED },
          { code: 'revoke', text: $t('system.notice.revoke'), show: (row) => row.publishStatus === NOTICE_STATUS_PUBLISHED },
          { code: 'edit', text: $t('common.edit'), show: (row) => row.publishStatus !== NOTICE_STATUS_PUBLISHED },
          { code: 'delete', text: $t('common.delete'), show: (row) => row.publishStatus !== NOTICE_STATUS_PUBLISHED },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.notice.operation'),
      width: 220,
    },
  ];
}
