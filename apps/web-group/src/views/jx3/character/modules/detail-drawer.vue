<script lang="ts" setup>
import type { Jx3CharacterApi } from '#/api/jx3/character';

import { computed, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Descriptions, DescriptionsItem } from 'antdv-next';

import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createCharacterSpec,
  deleteCharacterSpec,
  getCharacterForm,
  getCharacterSpecOptions,
  getCharacterSpecs,
  updateCharacterSpec,
} from '#/api/jx3/character';
import { useJx3CharacterAccess } from '#/composables/use-jx3-character-access';
import { $t } from '#/locales';
import { useLabelSearchSelectProps } from '#/utils/jx3/select';

import { useSpecColumns, useSpecFormSchema } from '../data';

const characterAccess = useJx3CharacterAccess();
const characterRow = ref<Jx3CharacterApi.Character>();
const specRowId = ref<string>();
const specCount = ref(0);
const detailLoading = ref(false);
const characterId = computed(() => characterRow.value?.id);

const [SpecForm, specFormApi] = useVbenForm({
  schema: useSpecFormSchema(characterId, specRowId),
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
        specFormApi.setValues({ ...data, isCw: !!data.isCw });
      } else {
        specRowId.value = undefined;
      }
      await specFormApi.updateSchema([
        {
          fieldName: 'specId',
          componentProps: {
            api: async () => {
              const id = characterId.value;
              if (!id) return [];
              return getCharacterSpecOptions(id, specRowId.value);
            },
            ...useLabelSearchSelectProps(),
          },
        },
      ]);
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
    columns: useSpecColumns(onSpecActionClick, characterAccess, specCount),
    height: 360,
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!characterRow.value) {
            specCount.value = 0;
            return { items: [], total: 0 };
          }
          const items = await getCharacterSpecs(characterRow.value.id);
          specCount.value = items.length;
          return { items, total: items.length };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<Jx3CharacterApi.CharacterSpec>,
});

async function loadCharacterDetail(id: string) {
  detailLoading.value = true;
  try {
    characterRow.value = await getCharacterForm(id);
  } finally {
    detailLoading.value = false;
  }
}

const [Drawer, drawerApi] = useVbenDrawer({
  async onOpenChange(isOpen) {
    if (isOpen) {
      const row = drawerApi.getData<Jx3CharacterApi.Character>();
      if (row?.id) {
        await loadCharacterDetail(row.id);
        specGridApi.query();
      }
    }
  },
});

const drawerTitle = computed(() =>
  characterRow.value
    ? `${$t('jx3.character.detail')} - ${characterRow.value.characterName}`
    : $t('jx3.character.detail'),
);

function onCreateSpec() {
  specModalApi.setData(null).open();
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
    <Descriptions
      v-if="characterRow"
      bordered
      :column="2"
      :loading="detailLoading"
      size="small"
    >
      <DescriptionsItem :label="$t('jx3.character.characterName')">
        {{ characterRow.characterName }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('jx3.character.accountId')">
        {{ characterRow.account ?? '-' }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('jx3.character.gameArea')">
        {{ characterRow.gameArea }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('jx3.character.gameServerId')">
        {{ characterRow.serverName ?? '-' }}
      </DescriptionsItem>
    </Descriptions>
    <div class="mt-4">
      <SpecGrid :table-title="$t('jx3.character.specs')">
        <template #toolbar-tools>
          <Button
            v-if="characterAccess.canSpecCreate.value"
            type="primary"
            @click="onCreateSpec"
          >
            <Plus class="size-5" />
            {{ $t('ui.actionTitle.create', [$t('jx3.character.specId')]) }}
          </Button>
        </template>
      </SpecGrid>
    </div>
  </Drawer>
</template>
