import { startTransition, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollectionWithError,
} from '@/services/firestoreService';
import { PERSONAL_COLLECTIONS } from '@/services/firestoreCollections';
import { hasWriteAccess } from '@/config/permissions';
import { sortShiftTemplates, type ShiftTemplate } from '@/data/shiftTemplates';

export function useShiftTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!user) {
      startTransition(() => {
        setTemplates([]);
        setLoading(false);
        setCanEdit(false);
        setLoadError(null);
      });
      return;
    }

    startTransition(() => {
      setLoading(true);
      setLoadError(null);
      setCanEdit(hasWriteAccess(user.email));
    });

    const failed = (): void => { setLoadError('班別範本讀取失敗'); setLoading(false); };
    try {
      return subscribeToCollectionWithError<ShiftTemplate>(user.uid, PERSONAL_COLLECTIONS.shiftTemplates, (data) => {
        setTemplates(data); setLoading(false); setLoadError(null);
      }, failed);
    } catch { startTransition(failed); }
  }, [user]);

  const sortedTemplates = useMemo(() => {
    return sortShiftTemplates(templates);
  }, [templates]);

  const addTemplate = async (template: ShiftTemplate) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }
    await setDocument(user.uid, PERSONAL_COLLECTIONS.shiftTemplates, template.id, template);
  };

  const updateTemplate = async (id: string, updates: Partial<ShiftTemplate>) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }
    await updateDocument(user.uid, PERSONAL_COLLECTIONS.shiftTemplates, id, updates);
  };

  const deleteTemplate = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }
    await deleteDocument(user.uid, PERSONAL_COLLECTIONS.shiftTemplates, id);
  };

  return {
    templates: sortedTemplates,
    loading,
    loadError,
    canEdit,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
