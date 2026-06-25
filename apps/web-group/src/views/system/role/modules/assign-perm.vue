<script lang="ts" setup>
import type { SystemRoleApi } from '#/api/system/role';

import { computed, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { CircleHelp, MdiMenuClose, MdiMenuOpen, Search } from '@vben/icons';

import { Button, Checkbox, Input, message, Spin, Tooltip, Tree } from 'antdv-next';

import { getMenuOptions } from '#/api/system/menu';
import { getRoleMenuIds, updateRoleMenus } from '#/api/system/role';
import { $t } from '#/locales';

interface MenuTreeNode {
  children?: MenuTreeNode[];
  label: string;
  value: string;
}

const emits = defineEmits(['success']);

const role = ref<SystemRoleApi.SystemRole>();
const menuOptions = ref<MenuTreeNode[]>([]);
const checkedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);
const permKeywords = ref('');
const parentChildLinked = ref(true);
const loading = ref(false);

const filteredMenuOptions = computed(() =>
  filterMenuTree(menuOptions.value, permKeywords.value.trim()),
);

const allMenuKeys = computed(() => collectAllKeys(filteredMenuOptions.value));

const selectAllStatus = computed<'indeterminate' | boolean>(() => {
  const checked = getCheckedKeyList();
  if (!checked.length) return false;
  if (checked.length >= allMenuKeys.value.length) return true;
  return 'indeterminate';
});

const isTreeExpanded = computed(() => expandedKeys.value.length > 0);

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    if (!role.value?.id) return;

    drawerApi.lock();
    try {
      await updateRoleMenus(role.value.id, getCheckedKeyList());
      message.success($t('system.role.assignPermSuccess'));
      emits('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (!isOpen) {
      role.value = undefined;
      checkedKeys.value = [];
      expandedKeys.value = [];
      permKeywords.value = '';
      parentChildLinked.value = true;
      return;
    }

    const data = drawerApi.getData<SystemRoleApi.SystemRole>();
    if (!data?.id) return;

    role.value = data;
    loading.value = true;
    try {
      const [options, menuIds] = await Promise.all([
        menuOptions.value.length ? Promise.resolve(menuOptions.value) : getMenuOptions(),
        getRoleMenuIds(data.id),
      ]);
      menuOptions.value = options as MenuTreeNode[];
      checkedKeys.value = menuIds;
      expandedKeys.value = collectParentKeys(options as MenuTreeNode[]);
    } finally {
      loading.value = false;
    }
  },
});

const drawerTitle = computed(() =>
  $t('system.role.assignPermTitle', [role.value?.name ?? '']),
);

function collectAllKeys(nodes: MenuTreeNode[]): string[] {
  const keys: string[] = [];
  nodes.forEach((node) => {
    keys.push(node.value);
    if (node.children?.length) {
      keys.push(...collectAllKeys(node.children));
    }
  });
  return keys;
}

function collectParentKeys(nodes: MenuTreeNode[]): string[] {
  const keys: string[] = [];
  nodes.forEach((node) => {
    if (node.children?.length) {
      keys.push(node.value);
      keys.push(...collectParentKeys(node.children));
    }
  });
  return keys;
}

function filterMenuTree(nodes: MenuTreeNode[], keyword: string): MenuTreeNode[] {
  if (!keyword) return nodes;

  return nodes
    .map((node) => {
      const children = node.children?.length
        ? filterMenuTree(node.children, keyword)
        : [];
      if (node.label.includes(keyword) || children.length) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean) as MenuTreeNode[];
}

function getCheckedKeyList(): string[] {
  return checkedKeys.value.map(String);
}

function togglePermTree() {
  expandedKeys.value = isTreeExpanded.value
    ? []
    : collectParentKeys(filteredMenuOptions.value);
}

function onSelectAllChange(checked: boolean) {
  checkedKeys.value = checked ? [...allMenuKeys.value] : [];
}

watch(permKeywords, (value) => {
  if (value.trim() && !expandedKeys.value.length) {
    expandedKeys.value = collectParentKeys(filteredMenuOptions.value);
  }
});
</script>

<template>
  <Drawer :title="drawerTitle">
    <Spin :spinning="loading" :classes="{ root: 'w-full' }">
      <div class="mb-4 flex w-full min-w-0 items-center gap-2">
        <Input
          v-model:value="permKeywords"
          allow-clear
          class="min-w-0 flex-1"
          :placeholder="$t('system.role.permKeywords')"
        >
          <template #prefix>
            <Search class="size-4 text-muted-foreground" />
          </template>
        </Input>

        <Button class="shrink-0" size="small" @click="togglePermTree">
          <MdiMenuClose v-if="isTreeExpanded" class="size-4" />
          <MdiMenuOpen v-else class="size-4" />
          {{
            isTreeExpanded
              ? $t('system.role.collapseAll')
              : $t('system.role.expandAll')
          }}
        </Button>

        <Checkbox
          v-model:checked="parentChildLinked"
          class="shrink-0 whitespace-nowrap"
        >
          {{ $t('system.role.parentChildLinked') }}
        </Checkbox>

        <Tooltip :title="$t('system.role.parentChildLinkedTip')">
          <CircleHelp class="size-4 shrink-0 cursor-help text-primary" />
        </Tooltip>
      </div>

      <div class="overflow-hidden rounded-lg border">
        <div class="flex items-center gap-2 border-b px-3 py-2">
          <Checkbox
            :checked="selectAllStatus"
            :indeterminate="selectAllStatus === 'indeterminate'"
            @update:checked="onSelectAllChange"
          >
            {{ $t('system.role.selectAll') }}
          </Checkbox>
        </div>
        <Tree
          v-model:checked-keys="checkedKeys"
          v-model:expanded-keys="expandedKeys"
          block-node
          checkable
          class="px-1 py-1"
          :check-strictly="!parentChildLinked"
          :field-names="{ title: 'label', key: 'value', children: 'children' }"
          :tree-data="filteredMenuOptions"
        />
      </div>
    </Spin>
  </Drawer>
</template>
