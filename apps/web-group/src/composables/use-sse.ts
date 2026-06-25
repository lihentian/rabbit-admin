import { computed, readonly, ref } from 'vue';

import { useAppConfig } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

type EventHandler = (data: unknown) => void;

interface SseParseState {
  buffer: string;
  currentData: string;
  currentEvent: string;
}

let globalInstance: ReturnType<typeof createSseConnection> | null = null;

function createSseConnection() {
  const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
  const url = `${apiURL}/sse/connect`;

  const isConnected = ref(false);
  let abortController: AbortController | null = null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let isManualDisconnect = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  const eventHandlers = new Map<string, Set<EventHandler>>();

  function flushSseEvent(eventName: string, data: string) {
    if (!data) return;
    const handlers = eventHandlers.get(eventName);
    if (!handlers) return;
    try {
      const parsed = JSON.parse(data);
      handlers.forEach((handler) => handler(parsed));
    } catch {
      handlers.forEach((handler) => handler(data));
    }
  }

  function handleSseLine(line: string, state: SseParseState) {
    if (line.startsWith(':')) return;
    if (line.startsWith('event:')) {
      state.currentEvent = line.slice(6).trim() || 'message';
      return;
    }
    if (line.startsWith('data:')) {
      const dataLine = line.slice(5).trim();
      state.currentData = state.currentData
        ? `${state.currentData}\n${dataLine}`
        : dataLine;
      return;
    }
    if (line === '') {
      flushSseEvent(state.currentEvent, state.currentData);
      state.currentEvent = 'message';
      state.currentData = '';
    }
  }

  async function consumeSseStream(
    streamReader: ReadableStreamDefaultReader<Uint8Array>,
  ) {
    const decoder = new TextDecoder();
    const state: SseParseState = {
      buffer: '',
      currentData: '',
      currentEvent: 'message',
    };

    while (true) {
      const { done, value } = await streamReader.read();
      if (done) {
        isConnected.value = false;
        scheduleReconnect();
        return;
      }
      state.buffer += decoder.decode(value, { stream: true });
      const lines = state.buffer.split('\n');
      state.buffer = lines.pop() || '';
      for (const line of lines) {
        handleSseLine(line, state);
      }
    }
  }

  function scheduleReconnect() {
    if (isManualDisconnect || reconnectAttempts >= 10) return;
    reconnectAttempts += 1;
    reconnectTimer = setTimeout(() => connect(), Math.min(5000 * reconnectAttempts, 60000));
  }

  function connect() {
    isManualDisconnect = false;
    const accessStore = useAccessStore();
    const token = accessStore.accessToken;
    if (!token || isConnected.value) return;

    abortController = new AbortController();
    fetch(url, {
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
      },
      method: 'GET',
      signal: abortController.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        isConnected.value = true;
        reconnectAttempts = 0;
        return response.body?.getReader();
      })
      .then((streamReader) => {
        if (!streamReader) return;
        reader = streamReader;
        return consumeSseStream(streamReader);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        isConnected.value = false;
        scheduleReconnect();
      });
  }

  function on<T = unknown>(eventName: string, handler: (data: T) => void) {
    if (!eventHandlers.has(eventName)) {
      eventHandlers.set(eventName, new Set());
    }
    const wrapped: EventHandler = (data) => handler(data as T);
    eventHandlers.get(eventName)!.add(wrapped);
    return () => {
      eventHandlers.get(eventName)?.delete(wrapped);
    };
  }

  function disconnect() {
    isManualDisconnect = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reader?.cancel();
    reader = null;
    abortController?.abort();
    abortController = null;
    isConnected.value = false;
  }

  function cleanup() {
    disconnect();
    eventHandlers.clear();
  }

  return {
    cleanup,
    connect,
    disconnect,
    isConnected: readonly(isConnected),
    on,
  };
}

export function useSse() {
  if (!globalInstance) {
    globalInstance = createSseConnection();
  }
  return globalInstance;
}

export function cleanupSse() {
  globalInstance?.cleanup();
  globalInstance = null;
}

export function useSseConnected() {
  const sse = useSse();
  return computed(() => sse.isConnected.value);
}
