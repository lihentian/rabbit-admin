import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ion:settings-outline',
      order: 9997,
      title: $t('system.title'),
    },
    name: 'System',
    path: '/system',
    redirect: '/system/user',
    children: [
      {
        path: 'user',
        name: 'User',
        meta: {
          icon: 'mdi:user',
          title: $t('system.user.title'),
        },
        component: () => import('#/views/system/user/list.vue'),
      },
      {
        path: 'role',
        name: 'Role',
        meta: {
          icon: 'mdi:account-group',
          title: $t('system.role.title'),
        },
        component: () => import('#/views/system/role/list.vue'),
      },
      {
        path: 'menu',
        name: 'SysMenu',
        meta: {
          icon: 'mdi:menu',
          title: $t('system.menu.title'),
        },
        component: () => import('#/views/system/menu/list.vue'),
      },
      {
        path: 'dept',
        name: 'Dept',
        meta: {
          icon: 'mdi:domain',
          title: $t('system.dept.title'),
        },
        component: () => import('#/views/system/dept/list.vue'),
      },
      {
        path: 'dict',
        name: 'Dict',
        meta: {
          icon: 'mdi:book-alphabet',
          title: $t('system.dict.title'),
        },
        component: () => import('#/views/system/dict/list.vue'),
      },
      {
        path: 'dict/items',
        name: 'DictItem',
        meta: {
          activePath: '/system/dict',
          hideInMenu: true,
          title: $t('system.dict.dictData'),
        },
        component: () => import('#/views/system/dict/dict-item.vue'),
      },
      {
        path: 'log',
        name: 'Log',
        meta: {
          icon: 'mdi:file-document-outline',
          title: $t('system.log.title'),
        },
        component: () => import('#/views/system/log/list.vue'),
      },
      {
        path: 'config',
        name: 'Config',
        meta: {
          icon: 'mdi:cog-outline',
          title: $t('system.config.title'),
        },
        component: () => import('#/views/system/config/list.vue'),
      },
      {
        path: 'notice',
        name: 'Notice',
        meta: {
          icon: 'mdi:bell-outline',
          title: $t('system.notice.title'),
        },
        component: () => import('#/views/system/notice/list.vue'),
      },
    ],
  },
];

export default routes;
