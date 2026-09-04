/**
 * useGameGuides Hook
 * 
 * 管理遊戲攻略資料的自訂 Hook，提供：
 * - 即時訂閱 Firestore 資料
 * - CRUD 操作方法
 * - 依遊戲/版本篩選
 * - 進度計算
 */

import { startTransition, useState, useEffect, useCallback } from 'react';
import type { GameGuide } from '@/data/gameGuides';
import {
  subscribeToGameGuides,
  addGameGuide,
  updateGameGuide,
  deleteGameGuide,
} from '@/services/gameGuideRepository';
import { useAuth } from '@/context/AuthContext';
import { hasGameGuideWriteAccess } from '@/config/permissions';

export function useGameGuides() {
  const { user } = useAuth();
  const [guides, setGuides] = useState<GameGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canEdit = hasGameGuideWriteAccess(user?.email);

  // 訂閱 Firestore 資料變更
  useEffect(() => {
    if (!user) {
      startTransition(() => {
        setLoading(false);
        setGuides([]);
      });
      return;
    }

    startTransition(() => setLoading(true));
    const unsubscribe = subscribeToGameGuides((data) => {
      setGuides(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 新增攻略
  const addGuide = useCallback(async (guide: Omit<GameGuide, 'id'>) => {
    if (!canEdit) {
      throw new Error('目前沒有遊戲攻略編輯權限');
    }

    try {
      const id = await addGameGuide(guide);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : '新增失敗';
      setError(message);
      throw err;
    }
  }, [canEdit]);

  // 更新攻略
  const updateGuide = useCallback(async (guideId: string, updates: Partial<GameGuide>) => {
    if (!canEdit) {
      throw new Error('目前沒有遊戲攻略編輯權限');
    }

    try {
      await updateGameGuide(guideId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新失敗';
      setError(message);
      throw err;
    }
  }, [canEdit]);

  // 刪除攻略
  const removeGuide = useCallback(async (guideId: string) => {
    if (!canEdit) {
      throw new Error('目前沒有遊戲攻略編輯權限');
    }

    try {
      await deleteGameGuide(guideId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除失敗';
      setError(message);
      throw err;
    }
  }, [canEdit]);

  // 切換完成狀態
  const toggleCompleted = useCallback(
    async (guideId: string, completed: boolean) => {
      await updateGuide(guideId, { completed });
    },
    [updateGuide]
  );

  return {
    guides,
    loading,
    error,
    canEdit,
    addGuide,
    updateGuide,
    removeGuide,
    toggleCompleted,
  };
}
