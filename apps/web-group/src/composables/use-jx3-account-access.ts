import { computed } from 'vue';

import { useAccess } from '@vben/access';

export function useJx3AccountAccess() {
  const { hasAccessByCodes } = useAccess();

  const canList = computed(() => hasAccessByCodes(['jx3:account:list']));
  const canView = computed(() => hasAccessByCodes(['jx3:account:view']));
  const canCreate = computed(() => hasAccessByCodes(['jx3:account:create']));
  const canUpdate = computed(() => hasAccessByCodes(['jx3:account:update']));
  const canDelete = computed(() => hasAccessByCodes(['jx3:account:delete']));

  return {
    canCreate,
    canDelete,
    canList,
    canUpdate,
    canView,
  };
}
