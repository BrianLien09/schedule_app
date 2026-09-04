import { startTransition, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
} from '@/services/firestoreService';
import { hasWriteAccess } from '@/config/permissions';
import { sortShiftTemplates, type ShiftTemplate } from '@/data/shiftTemplates';

const SHIFT_TEMPLATES_COLLECTION = 'shiftTemplates';

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
      SHIFT_TEMPLATES_COLLECTION,
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
    await setDocument(user.uid, SHIFT_TEMPLATES_COLLECTION, template.id, template);
  };

  const updateTemplate = async (id: string, updates: Partial<ShiftTemplate>) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }
    await updateDocument(user.uid, SHIFT_TEMPLATES_COLLECTION, id, updates);
  };

  const deleteTemplate = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }
    await deleteDocument(user.uid, SHIFT_TEMPLATES_COLLECTION, id);
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
