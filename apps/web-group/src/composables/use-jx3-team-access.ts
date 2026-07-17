import { computed } from 'vue';

import { useAccess } from '@vben/access';

export function useJx3TeamAccess() {
  const { hasAccessByCodes } = useAccess();

  const canList = computed(() => hasAccessByCodes(['jx3:team:list']));
  const canCreate = computed(() => hasAccessByCodes(['jx3:team:create']));
  const canUpdate = computed(() => hasAccessByCodes(['jx3:team:update']));
  const canDelete = computed(() => hasAccessByCodes(['jx3:team:delete']));
  const canComplete = computed(() => hasAccessByCodes(['jx3:team:complete']));
  const canManageMembers = computed(() =>
    hasAccessByCodes([
      'jx3:team:member:layout',
      'jx3:team:member:join',
      'jx3:team:member:covers',
      'jx3:team:member:account',
      'jx3:team:available:list',
    ]),
  );
  const canSaveLayout = computed(() => hasAccessByCodes(['jx3:team:member:layout']));
  const canEditCovers = computed(() => hasAccessByCodes(['jx3:team:member:covers']));
  const canViewAccount = computed(() => hasAccessByCodes(['jx3:team:member:account']));
  const canUsePool = computed(() => hasAccessByCodes(['jx3:team:available:list']));
  const canManageLoot = computed(() => hasAccessByCodes(['jx3:team:loot']));

  return {
    canComplete,
    canCreate,
    canDelete,
    canEditCovers,
    canList,
    canManageLoot,
    canManageMembers,
    canSaveLayout,
    canUpdate,
    canUsePool,
    canViewAccount,
  };
}
