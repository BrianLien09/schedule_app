import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
} from '@/services/firestoreService';
import { hasWriteAccess } from '@/config/permissions';
import type { ShiftTemplate } from '@/data/shiftTemplates';
import { sortShiftTemplatesByPriority } from '@/data/shiftTemplates';

const SHARED_DATA_PATH = 'shared';
const SHIFT_TEMPLATES_COLLECTION = 'shiftTemplates';

export function useShiftTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      setCanEdit(false);
      return;
    }

    setLoading(true);
    setCanEdit(hasWriteAccess(user.email));

    const unsubscribe = subscribeToCollection<ShiftTemplate>(
      SHARED_DATA_PATH,
      SHIFT_TEMPLATES_COLLECTION,
      (data) => {
        setTemplates(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const sortedTemplates = useMemo(() => {
    return sortShiftTemplatesByPriority(templates);
  }, [templates]);

  const addTemplate = async (template: ShiftTemplate) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }
    await setDocument(SHARED_DATA_PATH, SHIFT_TEMPLATES_COLLECTION, template.id, template);
  };

  const updateTemplate = async (id: string, updates: Partial<ShiftTemplate>) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }
    await updateDocument(SHARED_DATA_PATH, SHIFT_TEMPLATES_COLLECTION, id, updates);
  };

  const deleteTemplate = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }
    await deleteDocument(SHARED_DATA_PATH, SHIFT_TEMPLATES_COLLECTION, id);
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
