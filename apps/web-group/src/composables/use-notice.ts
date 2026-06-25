import type { NotificationItem } from '@vben/layouts';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { notification } from 'antdv-next';

import {
  getMyNoticeList,
  getNoticeDetail,
  readAllNotices,
} from '#/api/system/notice';
import { $t } from '#/locales';

import { useSse } from './use-sse';

const PAGE_SIZE = 5;
const NOTICE_EVENT = 'notice';
const NOTICE_REVOKE_EVENT = 'notice-revoke';

interface NoticeMessage {
  id: string;
  publishTime?: string;
  title: string;
  type: number;
}

export function useNoticeDropdown() {
  const router = useRouter();
  const { connect, on } = useSse();

  const notifications = ref<NotificationItem[]>([]);
  const unreadTotal = ref(0);
  const activeRead = ref<0 | 1>(0);

  let stopSubscriptions: (() => void) | null = null;

  const showDot = computed(() => unreadTotal.value > 0);

  async function fetchUnreadTotal() {
    const result = await getMyNoticeList({
      isRead: 0,
      page: 1,
      pageSize: 1,
    });
    unreadTotal.value = result.total;
  }

  async function fetchList(isRead: 0 | 1 = activeRead.value) {
    activeRead.value = isRead;
    const result = await getMyNoticeList({
      isRead,
      page: 1,
      pageSize: PAGE_SIZE,
    });
    notifications.value = result.items.map((item) => ({
      avatar: '',
      date: item.publishTime || item.createTime || '',
      id: item.id,
      isRead: item.isRead === 1,
      message: item.title,
      title: item.title,
    }));
    if (isRead === 0) {
      unreadTotal.value = result.total;
    }
  }

  function setupSubscription() {
    if (stopSubscriptions) return;
    const stopNotice = on<NoticeMessage>(NOTICE_EVENT, (data) => {
      if (!data.id) return;
      unreadTotal.value += 1;
      if (activeRead.value !== 0) return;
      if (notifications.value.some((item) => item.id === data.id)) return;
      notifications.value.unshift({
        avatar: '',
        date: data.publishTime || '',
        id: data.id,
        isRead: false,
        message: data.title,
        title: data.title,
      });
      if (notifications.value.length > PAGE_SIZE) {
        notifications.value.length = PAGE_SIZE;
      }
      notification.open({
        description: data.title,
        message: $t('system.notice.newMessage'),
        placement: 'bottomRight',
      });
    });
    const stopRevoke = on<{ id: string }>(NOTICE_REVOKE_EVENT, (data) => {
      if (!data.id) return;
      const index = notifications.value.findIndex((item) => item.id === data.id);
      if (index >= 0) {
        const wasUnread = !notifications.value[index]?.isRead;
        notifications.value.splice(index, 1);
        if (wasUnread && unreadTotal.value > 0) unreadTotal.value -= 1;
      }
    });
    stopSubscriptions = () => {
      stopNotice();
      stopRevoke();
    };
  }

  async function handleClick(item: NotificationItem) {
    await getNoticeDetail(String(item.id));
    notifications.value = notifications.value.filter((n) => n.id !== item.id);
    if (!item.isRead && unreadTotal.value > 0) unreadTotal.value -= 1;
    await fetchUnreadTotal();
  }

  async function handleMakeAll() {
    if (unreadTotal.value <= 0) return;
    await readAllNotices();
    unreadTotal.value = 0;
    notifications.value = [];
    notification.success({ message: $t('system.notice.readAllSuccess') });
  }

  function handleClear() {
    notifications.value = [];
  }

  function handleRemove(id: number | string) {
    notifications.value = notifications.value.filter((item) => item.id !== id);
  }

  function handleMarkRead(id: number | string) {
    const item = notifications.value.find((n) => n.id === id);
    if (item) item.isRead = true;
  }

  function viewAll() {
    router.push({ name: 'MyNotice' });
  }

  onMounted(() => {
    connect();
    fetchList(0);
    setupSubscription();
  });

  onBeforeUnmount(() => {
    stopSubscriptions?.();
    stopSubscriptions = null;
  });

  return {
    fetchList,
    handleClear,
    handleClick,
    handleMakeAll,
    handleMarkRead,
    handleRemove,
    notifications,
    showDot,
    unreadTotal,
    viewAll,
  };
}
