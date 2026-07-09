<script lang="ts" setup>
import type { Jx3AccountApi } from '#/api/jx3/account';
import type { AccountQuickImportRow } from '#/utils/jx3/account-import-template';

import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Download, Inbox } from '@vben/icons';

import { useVirtualList } from '@vueuse/core';
import { Alert, Upload as AntUpload, Button, Input, message } from 'antdv-next';
import { storeToRefs } from 'pinia';

import { quickImportAccounts } from '#/api/jx3/account';
import { getGameServerOptions } from '#/api/jx3/game-server';
import { $t } from '#/locales';
import { useJx3SpecDictStore } from '#/store/jx3-spec-dict';
import {
  buildAccountImportTemplate,
  downloadAccountImportTemplate,
  parseAccountImportWorkbook,
  parseImportText,
} from '#/utils/jx3/account-import-template';
import { getActionLabel } from '#/utils/jx3/account-quick-import';

const emit = defineEmits<{
  success: [];
}>();
const PREVIEW_ROW_HEIGHT = 40;
const PREVIEW_MAX_HEIGHT = 320;

const pasteText = ref('');
const loading = ref(false);
const downloading = ref(false);
const previewResult = ref<Jx3AccountApi.QuickImportResult>();
const parsedRows = ref<AccountQuickImportRow[]>([]);
const dataDirty = ref(false);

const { specOptionList } = storeToRefs(useJx3SpecDictStore());
const specDictStore = useJx3SpecDictStore();

interface PreviewTableRow {
  account: string;
  action?: Jx3AccountApi.QuickImportAction;
  characterName: string;
  errors?: string[];
  password: string;
  remark?: string;
  rowIndex: number;
  serverText: string;
  specText: string;
}

const PREVIEW_GRID_COLUMNS =
  '48px minmax(160px, 2fr) 120px 90px 90px 48px minmax(200px, 2fr) 72px minmax(120px, 1.2fr)';

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    if (!isOpen) {
      resetState();
      return;
    }
    modalApi.setState({
      confirmDisabled: true,
      confirmText: $t('jx3.account.quickImportConfirm'),
      title: $t('jx3.account.quickImport'),
    });
    await specDictStore.load();
  },
  async onConfirm() {
    await handleConfirm();
  },
});

const previewRows = computed<PreviewTableRow[]>(() => {
  if (!previewResult.value) return [];
  return previewResult.value.rows.map((item, index) => {
    const source = parsedRows.value[index];
    return {
      account: source?.account ?? '',
      action: item.action,
      characterName: source?.characterName ?? '',
      errors: item.errors,
      password: source?.password ?? '',
      remark: source?.remark,
      rowIndex: item.rowIndex,
      serverText: source?.serverText ?? '',
      specText: source?.specText ?? '',
    };
  });
});

const {
  list: virtualPreviewRows,
  containerProps: previewContainerProps,
  wrapperProps: previewWrapperProps,
} = useVirtualList(previewRows, {
  itemHeight: PREVIEW_ROW_HEIGHT,
});

const canConfirm = computed(
  () =>
    !!previewResult.value &&
    !previewResult.value.hasError &&
    parsedRows.value.length > 0 &&
    !loading.value &&
    !dataDirty.value,
);

const summaryText = computed(() => {
  if (!previewResult.value) return '';
  const { summary } = previewResult.value;
  return $t('jx3.account.importSummary', {
    create: summary.create,
    skip: summary.skip,
    updateRemark: summary.updateRemark,
  });
});

const stepStatus = computed(() => ({
  confirm: canConfirm.value,
  input: parsedRows.value.length > 0,
  validate: !!previewResult.value && !dataDirty.value,
}));

const statusHint = computed(() => {
  if (!parsedRows.value.length) {
    return $t('jx3.account.importStatusEmpty');
  }
  if (dataDirty.value || !previewResult.value) {
    return $t('jx3.account.importStatusNeedValidate', { count: parsedRows.value.length });
  }
  if (previewResult.value.hasError) {
    return $t('jx3.account.importHasErrors');
  }
  return summaryText.value;
});

watch(canConfirm, (value) => {
  modalApi.setState({ confirmDisabled: !value });
});

function resetState() {
  pasteText.value = '';
  previewResult.value = undefined;
  parsedRows.value = [];
  dataDirty.value = false;
  loading.value = false;
  downloading.value = false;
}

function markDataDirty() {
  dataDirty.value = true;
  previewResult.value = undefined;
  modalApi.setState({ confirmDisabled: true });
}

async function loadAllServers() {
  return getGameServerOptions();
}

async function handleDownloadTemplate() {
  downloading.value = true;
  try {
    await specDictStore.load();
    const servers = await loadAllServers();
    const blob = await buildAccountImportTemplate(servers, specOptionList.value);
    downloadAccountImportTemplate(blob);
  } finally {
    downloading.value = false;
  }
}

async function collectRows(): Promise<AccountQuickImportRow[]> {
  if (parsedRows.value.length) return parsedRows.value;
  if (!pasteText.value.trim()) {
    message.warning($t('jx3.account.importEmpty'));
    return [];
  }
  return parseImportText(pasteText.value);
}

async function handleValidate() {
  const rows = await collectRows();
  if (!rows.length) return;
  parsedRows.value = rows;
  loading.value = true;
  try {
    previewResult.value = await quickImportAccounts(rows, true);
    dataDirty.value = false;
  } finally {
    loading.value = false;
  }
}

async function handleConfirm() {
  if (!previewResult.value) {
    message.warning($t('jx3.account.importValidateFirst'));
    return;
  }
  if (!canConfirm.value) {
    message.warning(
      dataDirty.value ? $t('jx3.account.importValidateFirst') : $t('jx3.account.importHasErrors'),
    );
    return;
  }
  modalApi.lock();
  loading.value = true;
  try {
    const result = await quickImportAccounts(parsedRows.value, false);
    previewResult.value = result;
    message.success(summaryText.value || $t('jx3.account.importSuccess'));
    emit('success');
    modalApi.close();
  } finally {
    loading.value = false;
    modalApi.lock(false);
  }
}

async function handleUpload(file: File) {
  loading.value = true;
  try {
    const rows = await parseAccountImportWorkbook(file);
    if (!rows.length) {
      message.warning($t('jx3.account.importEmpty'));
      return false;
    }
    parsedRows.value = rows;
    pasteText.value = '';
    markDataDirty();
    message.info($t('jx3.account.importStatusNeedValidate', { count: rows.length }));
  } finally {
    loading.value = false;
  }
  return false;
}

function onPasteInput() {
  markDataDirty();
  parsedRows.value = [];
}

function open() {
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal :loading="loading" class="w-[1040px]">
    <div class="flex flex-col gap-4">
      <p class="text-muted-foreground text-sm">{{ $t('jx3.account.quickImportHint') }}</p>

      <div class="import-steps flex flex-wrap items-center gap-2 text-sm">
        <span
          class="import-step"
          :class="{
            'import-step--active': stepStatus.input,
            'import-step--done': stepStatus.input,
          }"
        >
          1. {{ $t('jx3.account.importStepInput') }}
        </span>
        <span class="text-muted-foreground">→</span>
        <span
          class="import-step"
          :class="{
            'import-step--active': stepStatus.input && (!stepStatus.validate || dataDirty),
            'import-step--done': stepStatus.validate,
          }"
        >
          2. {{ $t('jx3.account.importStepValidate') }}
        </span>
        <span class="text-muted-foreground">→</span>
        <span
          class="import-step"
          :class="{
            'import-step--active': stepStatus.confirm,
            'import-step--done': stepStatus.confirm,
          }"
        >
          3. {{ $t('jx3.account.importStepConfirm') }}
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button :loading="downloading" @click="handleDownloadTemplate">
          <Download class="mr-1 size-4" />
          {{ $t('jx3.account.downloadTemplate') }}
        </Button>
        <AntUpload
          :before-upload="handleUpload"
          :show-upload-list="false"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        >
          <Button>
            <Inbox class="mr-1 size-4" />
            {{ $t('jx3.account.uploadExcel') }}
          </Button>
        </AntUpload>
        <Button
          :disabled="!parsedRows.length && !pasteText.trim()"
          :loading="loading"
          type="primary"
          @click="handleValidate"
        >
          {{ $t('jx3.account.quickImportValidate') }}
        </Button>
      </div>

      <Input.TextArea
        v-model:value="pasteText"
        :auto-size="{ minRows: 4, maxRows: 8 }"
        :placeholder="$t('jx3.account.quickImportPastePlaceholder')"
        @input="onPasteInput"
      />

      <Alert
        :message="statusHint"
        :type="
          previewResult?.hasError
            ? 'error'
            : canConfirm
              ? 'success'
              : parsedRows.length
                ? 'warning'
                : 'info'
        "
        show-icon
      />

      <div v-if="previewResult && !dataDirty" class="preview-table flex flex-col gap-2">
        <div
          class="preview-table-header text-muted-foreground grid shrink-0 gap-2 border-b border-border/60 px-2 pb-2 text-xs font-medium"
          :style="{ gridTemplateColumns: PREVIEW_GRID_COLUMNS }"
        >
          <span>{{ $t('jx3.account.importRowNo') }}</span>
          <span>{{ $t('jx3.account.account') }}</span>
          <span>{{ $t('jx3.account.password') }}</span>
          <span>{{ $t('jx3.account.importServer') }}</span>
          <span>{{ $t('jx3.character.characterName') }}</span>
          <span>{{ $t('jx3.character.specId') }}</span>
          <span>{{ $t('jx3.account.remark') }}</span>
          <span>{{ $t('jx3.account.importAction') }}</span>
          <span>{{ $t('jx3.account.importErrors') }}</span>
        </div>
        <div
          class="preview-table-body min-h-0 overflow-auto"
          :style="{ maxHeight: `${PREVIEW_MAX_HEIGHT}px` }"
          v-bind="previewContainerProps"
        >
          <div v-bind="previewWrapperProps">
            <div
              v-for="{ data: row } in virtualPreviewRows"
              :key="row.rowIndex"
              class="preview-table-row grid items-center gap-2 border-b border-border/40 px-2 text-sm"
              :class="row.errors?.length ? 'bg-destructive/5 text-destructive' : ''"
              :style="{
                gridTemplateColumns: PREVIEW_GRID_COLUMNS,
                height: `${PREVIEW_ROW_HEIGHT}px`,
              }"
            >
              <span>{{ row.rowIndex + 1 }}</span>
              <span class="truncate" :title="row.account">{{ row.account }}</span>
              <span class="truncate" :title="row.password">{{ row.password }}</span>
              <span class="truncate" :title="row.serverText">{{ row.serverText }}</span>
              <span class="truncate" :title="row.characterName">{{ row.characterName }}</span>
              <span class="truncate" :title="row.specText">{{ row.specText }}</span>
              <span class="truncate" :title="row.remark">{{ row.remark || '—' }}</span>
              <span>{{ row.errors?.length ? '—' : getActionLabel(row.action) }}</span>
              <span class="truncate" :title="row.errors?.join('；')">
                {{ row.errors?.length ? row.errors.join('；') : '—' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.import-step {
  padding: 2px 8px;
  border-radius: 9999px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 0.35);
}

.import-step--active {
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.12);
}

.import-step--done {
  color: hsl(var(--foreground));
  background: hsl(var(--accent));
}

.preview-table-body {
  scrollbar-width: thin;
}
</style>
