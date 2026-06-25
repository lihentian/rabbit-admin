<script lang="ts" setup>
import type { UploadFile } from 'antdv-next';

import { ref, watch } from 'vue';

import { Upload } from 'antdv-next';

import { deleteFile, uploadFile } from '#/api/core/upload';
import { $t } from '#/locales';

const props = withDefaults(
  defineProps<{
    accept?: string;
    limit?: number;
    modelValue?: string | string[];
    multiple?: boolean;
  }>(),
  {
    accept: '*',
    limit: 5,
    multiple: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [string | string[] | undefined];
}>();

const fileList = ref<UploadFile[]>([]);

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      fileList.value = [];
      return;
    }
    const urls = Array.isArray(value) ? value : [value];
    fileList.value = urls.map((url, index) => ({
      name: url.split('/').pop() || `file-${index}`,
      status: 'done',
      uid: `${index}`,
      url,
    }));
  },
  { immediate: true },
);

function emitValue() {
  const urls = fileList.value
    .filter((file) => file.status === 'done' && file.url)
    .map((file) => file.url as string);
  if (props.multiple) {
    emit('update:modelValue', urls);
  } else {
    emit('update:modelValue', urls[0]);
  }
}

async function customRequest(options: any) {
  const { file, onError, onProgress, onSuccess } = options;
  try {
    const result = await uploadFile(file as File, (percent) => {
      onProgress?.({ percent });
    });
    onSuccess?.(result);
    const target = fileList.value.find((item) => item.uid === (file as UploadFile).uid);
    if (target) {
      target.url = result.url;
      target.name = result.name;
      target.status = 'done';
    }
    emitValue();
  } catch (error) {
    onError?.(error);
  }
}

async function handleRemove(file: UploadFile) {
  if (file.url) {
    await deleteFile(file.url);
  }
  fileList.value = fileList.value.filter((item) => item.uid !== file.uid);
  emitValue();
}
</script>

<template>
  <Upload
    v-model:file-list="fileList"
    :accept="accept"
    :custom-request="customRequest"
    :max-count="limit"
    :multiple="multiple"
    @remove="handleRemove"
  >
    <slot>{{ $t('system.file.upload') }}</slot>
  </Upload>
</template>
