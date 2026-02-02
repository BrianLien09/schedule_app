/**
 * useGameGuides Hook
 * 
 * 管理遊戲攻略資料的自訂 Hook，提供：
 * - 即時訂閱 Firestore 資料
 * - CRUD 操作方法
 * - 依遊戲/版本篩選
 * - 進度計算
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GameGuide } from '@/data/gameGuides';
import {
  subscribeToGameGuides,
  addGameGuide,
  updateGameGuide,
  deleteGameGuide,
} from '@/services/firestoreService';
import { useAuth } from '@/context/AuthContext';

export function useGameGuides() {
  const { user } = useAuth();
  const [guides, setGuides] = useState<GameGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 訂閱 Firestore 資料變更
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setGuides([]);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToGameGuides((data) => {
      setGuides(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 新增攻略
  const addGuide = useCallback(async (guide: Omit<GameGuide, 'id'>) => {
    try {
      const id = await addGameGuide(guide);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : '新增失敗';
      setError(message);
      throw err;
    }
  }, []);

  // 更新攻略
  const updateGuide = useCallback(async (guideId: string, updates: Partial<GameGuide>) => {
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
  }, []);

  // 刪除攻略
  const removeGuide = useCallback(async (guideId: string) => {
    try {
      await deleteGameGuide(guideId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除失敗';
      setError(message);
      throw err;
    }
  }, []);

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
    addGuide,
    updateGuide,
    removeGuide,
    toggleCompleted,
  };
}
