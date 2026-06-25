import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideInMenu: true,
      title: $t('system.notice.myList'),
    },
    name: 'MyNotice',
    path: '/profile/notice',
    component: () => import('#/views/profile/notice/list.vue'),
  },
];

export default routes;
