/** 已加载选项的前端搜索（按 label 过滤） */
export function useLabelSearchSelectProps() {
  return {
    filterOption: true,
    optionFilterProp: 'label',
    showSearch: true,
  } as const;
}
