import { startTransition, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
} from '@/services/firestoreService';
import { PERSONAL_COLLECTIONS } from '@/services/firestoreCollections';
import { hasWriteAccess } from '@/config/permissions';
import { sortShiftTemplates, type ShiftTemplate } from '@/data/shiftTemplates';

export function useShiftTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!user) {
      startTransition(() => {
        setTemplates([]);
        setLoading(false);
        setCanEdit(false);
      });
      return;
    }

    startTransition(() => {
      setLoading(true);
      setCanEdit(hasWriteAccess(user.email));
    });

    const unsubscribe = subscribeToCollection<ShiftTemplate>(
      user.uid,
      PERSONAL_COLLECTIONS.shiftTemplates,
      (data) => {
        setTemplates(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
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
    canEdit,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
