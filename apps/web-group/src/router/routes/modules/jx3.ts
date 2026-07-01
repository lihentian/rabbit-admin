import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:sword-cross',
      order: 10,
      title: $t('jx3.title'),
    },
    name: 'Jx3',
    path: '/jx3',
    redirect: '/jx3/server',
    children: [
      {
        path: 'server',
        name: 'Jx3Server',
        meta: {
          icon: 'mdi:server',
          title: $t('jx3.gameServer.title'),
        },
        component: () => import('#/views/jx3/server/list.vue'),
      },
      {
        path: 'sect',
        name: 'Jx3Sect',
        meta: {
          icon: 'mdi:yin-yang',
          title: $t('jx3.sect.title'),
        },
        component: () => import('#/views/jx3/sect/list.vue'),
      },
      {
        path: 'spec',
        name: 'Jx3Spec',
        meta: {
          icon: 'mdi:yin-yang',
          title: $t('jx3.spec.title'),
        },
        component: () => import('#/views/jx3/spec/list.vue'),
      },
      {
        path: 'dungeon',
        name: 'Jx3Dungeon',
        meta: {
          icon: 'mdi:castle',
          title: $t('jx3.dungeon.title'),
        },
        component: () => import('#/views/jx3/dungeon/list.vue'),
      },
      {
        path: 'dungeon-template',
        name: 'Jx3DungeonTemplate',
        meta: {
          icon: 'mdi:file-document-outline',
          title: $t('jx3.dungeonTemplate.title'),
        },
        component: () => import('#/views/jx3/dungeon-template/list.vue'),
      },
      {
        path: 'account',
        name: 'Jx3Account',
        meta: {
          icon: 'mdi:account-key',
          title: $t('jx3.account.title'),
        },
        component: () => import('#/views/jx3/account/list.vue'),
      },
      {
        path: 'character',
        name: 'Jx3Character',
        meta: {
          icon: 'mdi:human-male',
          title: $t('jx3.character.title'),
        },
        component: () => import('#/views/jx3/character/list.vue'),
      },
      {
        path: 'team',
        name: 'Jx3Team',
        meta: {
          hideChildrenInMenu: true,
          icon: 'mdi:account-group',
          title: $t('jx3.team.title'),
        },
        children: [
          {
            path: '',
            name: 'Jx3TeamList',
            meta: {
              title: $t('jx3.team.list'),
            },
            component: () => import('#/views/jx3/team/list.vue'),
          },
          {
            path: 'config',
            name: 'Jx3TeamConfig',
            meta: {
              fullPathKey: false,
              title: $t('jx3.team.config'),
            },
            component: () => import('#/views/jx3/team/config.vue'),
          },
        ],
      },
    ],
  },
];

export default routes;
