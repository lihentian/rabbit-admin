import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      order: 1000,
      title: $t('demos.title'),
    },
    name: 'Demos',
    path: '/demos',
    children: [
      {
        meta: {
          title: $t('demos.antd'),
        },
        name: 'AntDesignDemos',
        path: '/demos/ant-design-next',
        component: () => import('#/views/demos/antd/index.vue'),
      },
      {
        meta: {
          title: $t('demos.form'),
        },
        name: 'AntDesignForm',
        path: '/demos/form',
        component: () => import('#/views/demos/vben-vxe-table/form/index.vue'),
      },
    ],
  },
];

export default routes;
