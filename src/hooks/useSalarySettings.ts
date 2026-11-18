import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasWriteAccess } from '@/config/permissions';
import { setDocument, subscribeToCollectionWithError } from '@/services/firestoreService';
import {
  DEFAULT_SALARY_SETTINGS,
  normalizeSalarySettings,
  SALARY_SETTINGS_COLLECTION,
  SALARY_SETTINGS_ID,
  type SalarySettings,
} from '@/data/salarySettings';

interface StoredSettingsDocument extends Partial<SalarySettings> {
  id: string;
}

interface SettingsState {
  userId: string | null;
  settings: SalarySettings;
  loadError: string | null;
}

/**
 * 訂閱薪資個人設定（目前只有勞保勞工自付額）。
 * 用即時訂閱而不是一次性讀取：手機改了勞保金額，電腦上開著的薪資頁也會立刻更新到帳金額。
 */
export function useSalarySettings() {
  const { user } = useAuth();
  const [state, setState] = useState<SettingsState>({ userId: null, settings: DEFAULT_SALARY_SETTINGS, loadError: null });

  useEffect(() => {
    if (!user) return;
    try {
      return subscribeToCollectionWithError<StoredSettingsDocument>(
        user.uid,
        SALARY_SETTINGS_COLLECTION,
        (documents) => {
          const stored = documents.find((item) => item.id === SALARY_SETTINGS_ID);
          setState({ userId: user.uid, settings: normalizeSalarySettings(stored), loadError: null });
        },
        () => setState({ userId: user.uid, settings: DEFAULT_SALARY_SETTINGS, loadError: '薪資設定讀取失敗' }),
      );
    } catch {
      // Firebase 未設定時 subscribe 會同步拋錯；延後到下一輪再更新狀態，避免在 effect 內同步 setState
      const timer = window.setTimeout(() => setState({ userId: user.uid, settings: DEFAULT_SALARY_SETTINGS, loadError: '薪資設定讀取失敗' }), 0);
      return () => window.clearTimeout(timer);
    }
  }, [user]);

  const isCurrentUser = state.userId === (user?.uid ?? null);

  const saveSettings = async (next: SalarySettings): Promise<void> => {
    if (!user || !hasWriteAccess(user.email)) {
      throw new Error('目前沒有修改薪資設定的權限');
    }
    await setDocument(user.uid, SALARY_SETTINGS_COLLECTION, SALARY_SETTINGS_ID, normalizeSalarySettings(next));
  };

  return {
    settings: isCurrentUser ? state.settings : DEFAULT_SALARY_SETTINGS,
    loadError: isCurrentUser ? state.loadError : null,
    canEdit: Boolean(user && hasWriteAccess(user.email)),
    saveSettings,
  };
}
