import type { Jx3TeamApi } from '#/api/jx3/team';

import type { VNode } from 'vue';

import { h } from 'vue';

import { $t } from '#/locales';

const ISSUE_NUM_CLASS =
  'mx-0.5 font-semibold tabular-nums text-[15px] leading-none';

export function formatCwSpecLabel(specAlias: string): string {
  return `cw${specAlias}`;
}

export function getLayoutIssueLabelWidth(
  issues: Jx3TeamApi.LayoutIssue[],
): number {
  return Math.max(
    2,
    ...issues
      .filter((issue) => issue.kind !== 'cd')
      .map((issue) => issue.label.length),
  );
}

export function renderLayoutCompositionIssue(
  issue: Jx3TeamApi.LayoutCompositionIssue,
  labelWidthEm?: number,
): VNode {
  return h('span', { class: 'text-sm' }, [
    h(
      'span',
      {
        class: 'inline-block text-right font-medium text-foreground',
        style: labelWidthEm ? { minWidth: `${labelWidthEm}em` } : undefined,
      },
      issue.label,
    ),
    $t('jx3.team.layoutIssueCurrent'),
    h(
      'span',
      { class: `${ISSUE_NUM_CLASS} text-orange-500` },
      String(issue.actual),
    ),
    $t('jx3.team.layoutIssueMiddle'),
    h(
      'span',
      { class: `${ISSUE_NUM_CLASS} text-primary` },
      String(issue.required),
    ),
    $t('jx3.team.layoutIssueSuffix'),
  ]);
}

export function renderLayoutCdIssue(issue: Jx3TeamApi.LayoutCdIssue): VNode {
  return h('span', { class: 'text-sm' }, [
    h('span', { class: 'font-medium text-foreground' }, issue.label),
    h('span', { class: 'text-muted-foreground' }, '：'),
    h('span', { class: 'text-orange-500' }, issue.message),
  ]);
}

export function renderLayoutIssue(
  issue: Jx3TeamApi.LayoutIssue,
  labelWidthEm?: number,
): VNode {
  if (issue.kind === 'cd') {
    return renderLayoutCdIssue(issue);
  }
  return renderLayoutCompositionIssue(issue, labelWidthEm);
}
