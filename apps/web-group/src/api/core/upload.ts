import { requestClient } from '#/api/request';

export namespace FileApi {
  export interface FileInfo {
    name: string;
    url: string;
  }
}

interface UploadFileParams {
  file: File;
  onError?: (error: Error) => void;
  onProgress?: (progress: { percent: number }) => void;
  onSuccess?: (data: FileApi.FileInfo, file: File) => void;
}

async function uploadFile(file: File, onProgress?: (percent: number) => void) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<FileApi.FileInfo>('/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress?.(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
}

/** Ant Design Upload customRequest 适配 */
async function upload_file({
  file,
  onError,
  onProgress,
  onSuccess,
}: UploadFileParams) {
  try {
    onProgress?.({ percent: 0 });
    const data = await uploadFile(file, (percent) => {
      onProgress?.({ percent });
    });
    onProgress?.({ percent: 100 });
    onSuccess?.(data, file);
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

async function deleteFile(filePath: string) {
  return requestClient.delete('/files', { params: { filePath } });
}

export { deleteFile, upload_file, uploadFile };
