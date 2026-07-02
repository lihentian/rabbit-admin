<script lang="ts" setup>
import type { SystemRoleApi } from '#/api/system/role';

import { computed, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { MdiMenuClose, MdiMenuOpen, Search } from '@vben/icons';

import { Button, Checkbox, Input, message, Spin, Tree } from 'antdv-next';

import { getMenuOptions } from '#/api/system/menu';
import { getRoleMenuIds, updateRoleMenus } from '#/api/system/role';
import { $t } from '#/locales';

interface MenuTreeNode {
  children?: MenuTreeNode[];
  key?: number | string;
  label: string;
  title?: string;
  value: string;
}

const emits = defineEmits(['success']);

const role = ref<SystemRoleApi.SystemRole>();
const menuOptions = ref<MenuTreeNode[]>([]);
const checkedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);
const permKeywords = ref('');
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
      checkedKeys.value = menuIds.map(String);
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

function collectDescendantKeys(node: MenuTreeNode): string[] {
  const keys: string[] = [];
  node.children?.forEach((child) => {
    keys.push(child.value);
    if (child.children?.length) {
      keys.push(...collectDescendantKeys(child));
    }
  });
  return keys;
}

function findNodeByKey(nodes: MenuTreeNode[], key: string): MenuTreeNode | null {
  for (const node of nodes) {
    if (node.value === key) return node;
    if (node.children?.length) {
      const found = findNodeByKey(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

/** 子节点均为叶子时，勾选父节点向下全选（如菜单 → 按钮） */
function shouldCascadeToDescendants(node: MenuTreeNode): boolean {
  if (!node.children?.length) return false;
  return node.children.every((child) => !child.children?.length);
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

function onTreeCheck(
  _keys: string[] | { checked: string[]; halfChecked: string[] },
  info: { checked: boolean; node: { key: string | number } },
) {
  const nodeKey = String(info.node.key);
  const node = findNodeByKey(menuOptions.value, nodeKey);
  if (!node) return;

  const current = new Set(checkedKeys.value.map(String));
  const cascade = shouldCascadeToDescendants(node);
  const descendantKeys = cascade ? collectDescendantKeys(node) : [];

  if (info.checked) {
    current.add(nodeKey);
    descendantKeys.forEach((key) => current.add(key));
  } else {
    current.delete(nodeKey);
    descendantKeys.forEach((key) => current.delete(key));
  }

  checkedKeys.value = [...current];
}

function togglePermTree() {
  expandedKeys.value = isTreeExpanded.value
    ? []
    : collectParentKeys(filteredMenuOptions.value);
}

function onSelectAllChange(checked: boolean) {
  checkedKeys.value = checked ? [...allMenuKeys.value] : [];
}

function getTreeNodeKey(node: Record<string, unknown>): string {
  const value = node.value ?? node.key;
  return value == null ? '' : String(value);
}

function getTreeNodeLabel(node: Record<string, unknown>): string {
  const label = node.label ?? node.title ?? node.key;
  return label == null ? '' : String(label);
}

function hasTreeNodeChildren(node: Record<string, unknown>): boolean {
  const children = node.children;
  return Array.isArray(children) && children.length > 0;
}

function collectNodeWithDescendantKeys(nodeKey: string): string[] {
  const node = findNodeByKey(menuOptions.value, nodeKey);
  if (!node) return [nodeKey];
  return [nodeKey, ...collectDescendantKeys(node)];
}

function getNodeSelectAllStatus(nodeKey: string): 'indeterminate' | boolean {
  const keys = collectNodeWithDescendantKeys(nodeKey);
  const current = new Set(checkedKeys.value.map(String));
  const selectedCount = keys.filter((key) => current.has(key)).length;
  if (!selectedCount) return false;
  if (selectedCount >= keys.length) return true;
  return 'indeterminate';
}

function onNodeSelectAllChange(nodeKey: string, checked: boolean) {
  const keys = collectNodeWithDescendantKeys(nodeKey);
  const current = new Set(checkedKeys.value.map(String));

  if (checked) {
    keys.forEach((key) => current.add(key));
  } else {
    keys.forEach((key) => current.delete(key));
  }

  checkedKeys.value = [...current];
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
      </div>

      <p class="mb-3 text-sm text-muted-foreground">
        {{ $t('system.role.assignPermCheckTip') }}
      </p>

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
          check-strictly
          class="perm-tree px-1 py-1"
          :field-names="{ title: 'label', key: 'value', children: 'children' }"
          :tree-data="filteredMenuOptions"
          @check="onTreeCheck"
        >
          <template #titleRender="node">
            <div class="flex w-full min-w-0 items-center justify-between gap-2 pr-1">
              <span class="min-w-0 flex-1 truncate">{{ getTreeNodeLabel(node) }}</span>
              <Checkbox
                v-if="hasTreeNodeChildren(node)"
                class="perm-tree-select-all shrink-0"
                :checked="getNodeSelectAllStatus(getTreeNodeKey(node))"
                :indeterminate="
                  getNodeSelectAllStatus(getTreeNodeKey(node)) === 'indeterminate'
                "
                @click.stop
                @update:checked="
                  (checked) => onNodeSelectAllChange(getTreeNodeKey(node), checked)
                "
              >
                {{ $t('system.role.selectAllChildren') }}
              </Checkbox>
            </div>
          </template>
        </Tree>
      </div>
    </Spin>
  </Drawer>
</template>

<style scoped>
.perm-tree :deep(.ant-tree-node-content-wrapper) {
  flex: 1;
  min-width: 0;
}

.perm-tree :deep(.ant-tree-title) {
  flex: 1;
  min-width: 0;
}
</style>
