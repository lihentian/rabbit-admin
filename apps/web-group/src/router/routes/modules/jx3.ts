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
    children: [
      {
        path: '/jx3/game-server',
        name: 'Jx3GameServer',
        meta: {
          icon: 'mdi:server',
          title: $t('jx3.gameServer.title'),
        },
        component: () => import('#/views/jx3/game-server/list.vue'),
      },
      {
        path: '/jx3/spec',
        name: 'Jx3Spec',
        meta: {
          icon: 'mdi:yin-yang',
          title: $t('jx3.spec.title'),
        },
        component: () => import('#/views/jx3/spec/list.vue'),
      },
      {
        path: '/jx3/dungeon',
        name: 'Jx3Dungeon',
        meta: {
          icon: 'mdi:castle',
          title: $t('jx3.dungeon.title'),
        },
        component: () => import('#/views/jx3/dungeon/list.vue'),
      },
      {
        path: '/jx3/account',
        name: 'Jx3Account',
        meta: {
          icon: 'mdi:account-key',
          title: $t('jx3.account.title'),
        },
        component: () => import('#/views/jx3/account/list.vue'),
      },
      {
        path: '/jx3/character',
        name: 'Jx3Character',
        meta: {
          icon: 'mdi:account-sword',
          title: $t('jx3.character.title'),
        },
        component: () => import('#/views/jx3/character/list.vue'),
      },
      {
        path: '/jx3/team',
        name: 'Jx3Team',
        meta: {
          icon: 'mdi:account-group',
          title: $t('jx3.team.title'),
        },
        component: () => import('#/views/jx3/team/list.vue'),
      },
    ],
  },
];

export default routes;
