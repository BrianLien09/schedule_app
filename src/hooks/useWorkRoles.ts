import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasWriteAccess } from '@/config/permissions';
import {
  deleteDocument,
  setDocument,
  subscribeToCollection,
  updateDocument,
} from '@/services/firestoreService';
import {
  DEFAULT_WORK_ROLES,
  generateWorkRoleId,
  sortWorkRoles,
  WORK_ROLES_COLLECTION,
  WORK_ROLES_CONFIG_ID,
  type WorkRole,
  type WorkRoleInput,
} from '@/data/workRoles';

interface StoredWorkRole {
  id: string;
  name?: string;
  hourlyRate?: number;
  createdAt?: number;
  initializedAt?: string;
}

const EMPTY_WORK_ROLES: WorkRole[] = [];

function normalizeWorkRoles(data: StoredWorkRole[]): WorkRole[] {
  return data
    .filter(
      (item) =>
        item.id !== WORK_ROLES_CONFIG_ID &&
        typeof item.name === 'string' &&
        item.name.trim().length > 0 &&
        typeof item.hourlyRate === 'number' &&
        Number.isFinite(item.hourlyRate)
    )
    .map((item) => ({
      id: item.id,
      name: item.name!.trim(),
      hourlyRate: item.hourlyRate!,
      createdAt: item.createdAt ?? 0,
    }));
}

/**
 * 首次使用身份管理時建立預設資料，並以設定文件記錄初始化完成狀態。
 * 這樣刪除全部身份後不會在下一次載入時被默默補回。
 */
async function initializeDefaultRoles(
  userId: string,
  existingRoles: WorkRole[]
): Promise<void> {
  const existingIds = new Set(existingRoles.map((role) => role.id));
  const missingRoles = DEFAULT_WORK_ROLES.filter((role) => !existingIds.has(role.id));

  await Promise.all(
    missingRoles.map(({ id, ...role }) =>
      setDocument(userId, WORK_ROLES_COLLECTION, id, role)
    )
  );

  await setDocument(userId, WORK_ROLES_COLLECTION, WORK_ROLES_CONFIG_ID, {
    initializedAt: new Date().toISOString(),
    version: 1,
  });
}

export function useWorkRoles() {
  const { user } = useAuth();
  const [roleState, setRoleState] = useState<{
    userId: string | null;
    roles: WorkRole[];
    loading: boolean;
  }>({ userId: null, roles: [], loading: false });
  const initializationRef = useRef<string | null>(null);

  const activeUserId = user?.uid ?? null;
  const activeRoles = roleState.userId === activeUserId
    ? roleState.roles
    : EMPTY_WORK_ROLES;
  const activeLoading = roleState.userId === activeUserId
    ? roleState.loading
    : Boolean(user);

  useEffect(() => {
    if (!user) {
      initializationRef.current = null;
      return;
    }

    const writable = hasWriteAccess(user.email);
    initializationRef.current = null;

    const unsubscribe = subscribeToCollection<StoredWorkRole>(
      user.uid,
      WORK_ROLES_COLLECTION,
      (data) => {
        const normalizedRoles = normalizeWorkRoles(data);
        setRoleState({ userId: user.uid, roles: normalizedRoles, loading: false });

        const hasInitialized = data.some((item) => item.id === WORK_ROLES_CONFIG_ID);
        if (!hasInitialized && writable && initializationRef.current !== user.uid) {
          initializationRef.current = user.uid;
          void initializeDefaultRoles(user.uid, normalizedRoles).catch((error: unknown) => {
            initializationRef.current = null;
            console.error('初始化身份資料失敗', error);
          });
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  const sortedRoles = useMemo(() => sortWorkRoles(activeRoles), [activeRoles]);

  const addRole = async (input: WorkRoleInput): Promise<void> => {
    if (!user || !hasWriteAccess(user.email)) {
      console.warn('目前沒有寫入身份的權限');
      return;
    }

    const role: WorkRole = {
      id: generateWorkRoleId(),
      name: input.name.trim(),
      hourlyRate: input.hourlyRate,
      createdAt: Date.now(),
    };
    const { id, ...roleData } = role;
    await setDocument(user.uid, WORK_ROLES_COLLECTION, id, roleData);
  };

  const updateRole = async (id: string, updates: Partial<WorkRoleInput>): Promise<void> => {
    if (!user || !hasWriteAccess(user.email)) {
      console.warn('目前沒有寫入身份的權限');
      return;
    }

    await updateDocument(user.uid, WORK_ROLES_COLLECTION, id, {
      ...updates,
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    });
  };

  const deleteRole = async (id: string): Promise<void> => {
    if (!user || !hasWriteAccess(user.email) || id === WORK_ROLES_CONFIG_ID) {
      console.warn('目前沒有刪除職稱／職位的權限');
      return;
    }

    await deleteDocument(user.uid, WORK_ROLES_COLLECTION, id);
  };

  return {
    roles: sortedRoles,
    loading: activeLoading,
    canEdit: Boolean(user && hasWriteAccess(user.email)),
    addRole,
    updateRole,
    deleteRole,
  };
}
