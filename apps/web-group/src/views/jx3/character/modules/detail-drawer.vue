<script lang="ts" setup>
import type { Jx3CharacterApi } from '#/api/jx3/character';

import { computed, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Tabs } from 'antdv-next';

import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createCharacterSpec,
  deleteCharacterSpec,
  getCharacterCds,
  getCharacterSpecs,
  updateCharacterSpec,
} from '#/api/jx3/character';
import { $t } from '#/locales';

import { useCdColumns, useSpecColumns, useSpecFormSchema } from '../data';

const characterRow = ref<Jx3CharacterApi.Character>();
const activeTab = ref('specs');
const specRowId = ref<string>();

const [SpecForm, specFormApi] = useVbenForm({
  schema: useSpecFormSchema(),
  showDefaultActions: false,
});

const [SpecModal, specModalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await specFormApi.validate();
    if (!valid || !characterRow.value) return;
    const values = await specFormApi.getValues();
    specModalApi.lock();
    try {
      if (specRowId.value) {
        await updateCharacterSpec(
          characterRow.value.id,
          specRowId.value,
          values,
        );
      } else {
        await createCharacterSpec(characterRow.value.id, values);
      }
      specModalApi.close();
      specGridApi.query();
    } finally {
      specModalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = specModalApi.getData<Jx3CharacterApi.CharacterSpec>();
      specFormApi.resetForm();
      if (data?.id) {
        specRowId.value = data.id;
        specFormApi.setValues(data);
      } else {
        specRowId.value = undefined;
      }
    }
  },
});

function onSpecActionClick({
  code,
  row,
}: OnActionClickParams<Jx3CharacterApi.CharacterSpec>) {
  if (code === 'edit') {
    specModalApi.setData(row).open();
  } else if (code === 'delete' && characterRow.value) {
    deleteCharacterSpec(characterRow.value.id, row.id).then(() => {
      specGridApi.query();
    });
  }
}

const [SpecGrid, specGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useSpecColumns(onSpecActionClick),
    height: 360,
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!characterRow.value) return { items: [], total: 0 };
          const items = await getCharacterSpecs(characterRow.value.id);
          return { items, total: items.length };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<Jx3CharacterApi.CharacterSpec>,
});

const [CdGrid, cdGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useCdColumns(),
    height: 360,
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!characterRow.value) return { items: [], total: 0 };
          const items = await getCharacterCds(characterRow.value.id);
          return { items, total: items.length };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<Jx3CharacterApi.DungeonCd>,
});

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen) {
    if (isOpen) {
      characterRow.value = drawerApi.getData<Jx3CharacterApi.Character>();
      activeTab.value = 'specs';
      specGridApi.query();
      cdGridApi.query();
    }
  },
});

const drawerTitle = computed(() =>
  characterRow.value
    ? `${$t('jx3.character.detail')} - ${characterRow.value.characterName}`
    : $t('jx3.character.detail'),
);

const tabItems = computed(() => [
  { key: 'specs', label: $t('jx3.character.specs') },
  { key: 'cds', label: $t('jx3.character.cds') },
]);

function onCreateSpec() {
  specModalApi.setData(null).open();
}

function onTabChange(key: string | number) {
  activeTab.value = String(key);
  if (key === 'specs') {
    specGridApi.query();
  } else {
    cdGridApi.query();
  }
}

function open(row: Jx3CharacterApi.Character) {
  drawerApi.setData(row).open();
}

defineExpose({ open });
</script>

<template>
  <Drawer :title="drawerTitle" class="w-[860px]">
    <SpecModal
      :title="
        specRowId
          ? $t('common.edit', $t('jx3.character.specId'))
          : $t('common.create', $t('jx3.character.specId'))
      "
    >
      <SpecForm class="mx-4" />
    </SpecModal>
    <Tabs :active-key="activeTab" :items="tabItems" @change="onTabChange" />
    <div v-show="activeTab === 'specs'" class="mt-4">
      <SpecGrid>
        <template #toolbar-tools>
          <Button type="primary" @click="onCreateSpec">
            <Plus class="size-5" />
            {{ $t('ui.actionTitle.create', [$t('jx3.character.specId')]) }}
          </Button>
        </template>
      </SpecGrid>
    </div>
    <div v-show="activeTab === 'cds'" class="mt-4">
      <CdGrid />
    </div>
  </Drawer>
</template>
