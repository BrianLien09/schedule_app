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

  // 依遊戲 ID 篩選
  const getGuidesByGame = useCallback(
    (gameId: string) => {
      return guides.filter((g) => g.gameId === gameId);
    },
    [guides]
  );

  // 依遊戲 + 版本篩選
  const getGuidesByVersion = useCallback(
    (gameId: string, version: string) => {
      return guides.filter((g) => g.gameId === gameId && g.version === version);
    },
    [guides]
  );

  // 計算完成度（特定遊戲/版本）
  const calculateProgress = useCallback(
    (gameId: string, version?: string) => {
      const filtered = version
        ? getGuidesByVersion(gameId, version)
        : getGuidesByGame(gameId);

      if (filtered.length === 0) return 0;

      const completed = filtered.filter((g) => g.completed).length;
      return Math.round((completed / filtered.length) * 100);
    },
    [getGuidesByGame, getGuidesByVersion]
  );

  // 取得所有遊戲 ID（去重）
  const gameIds = useMemo(() => {
    return Array.from(new Set(guides.map((g) => g.gameId)));
  }, [guides]);

  // 取得特定遊戲的所有版本（去重 + 排序）
  const getVersionsByGame = useCallback(
    (gameId: string) => {
      const versions = guides
        .filter((g) => g.gameId === gameId && g.version)
        .map((g) => g.version as string);

      return Array.from(new Set(versions)).sort((a, b) => {
        // 嘗試轉換成數字比較（如 "3.1" vs "3.2"）
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return bNum - aNum; // 降序排列（最新版本在前）
        }
        return b.localeCompare(a); // 字串比較
      });
    },
    [guides]
  );

  return {
    guides,
    loading,
    error,
    addGuide,
    updateGuide,
    removeGuide,
    toggleCompleted,
    getGuidesByGame,
    getGuidesByVersion,
    calculateProgress,
    gameIds,
    getVersionsByGame,
  };
}
