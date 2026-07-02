import { computed } from 'vue';

import { useAccess } from '@vben/access';

export function useJx3CharacterAccess() {
  const { hasAccessByCodes } = useAccess();

  const canList = computed(() => hasAccessByCodes(['jx3:character:list']));
  const canCreate = computed(() => hasAccessByCodes(['jx3:character:create']));
  const canUpdate = computed(() => hasAccessByCodes(['jx3:character:update']));
  const canDelete = computed(() => hasAccessByCodes(['jx3:character:delete']));
  const canSpecList = computed(() => hasAccessByCodes(['jx3:character:spec:list']));
  const canSpecCreate = computed(() => hasAccessByCodes(['jx3:character:spec:create']));
  const canSpecUpdate = computed(() => hasAccessByCodes(['jx3:character:spec:update']));
  const canSpecDelete = computed(() => hasAccessByCodes(['jx3:character:spec:delete']));

  return {
    canCreate,
    canDelete,
    canList,
    canSpecCreate,
    canSpecDelete,
    canSpecList,
    canSpecUpdate,
    canUpdate,
  };
}
