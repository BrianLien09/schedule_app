'use client';

/**
 * 遊戲攻略中心頁面
 * 
 * 功能：
 * - 從 Firestore 讀取攻略資料（即時同步）
 * - 支援依遊戲/版本篩選
 * - 顯示進度統計
 * - 編輯模式：新增/修改/刪除攻略
 * - 視覺化：標籤、星級、進度條、完成標記
 */

import { useState, useMemo, useCallback } from 'react';
import { useGameGuides } from '@/hooks/useGameGuides';
import { useAuth } from '@/context/AuthContext';
import { GuideCard, CategoryBadge } from '@/components/GuideComponents';
import { GuideEditForm } from '@/components/GuideEditForm';
import type { GameGuide, GuideCategory } from '@/data/gameGuides';
import { GUIDE_CATEGORIES } from '@/data/gameGuides';
import { games } from '@/data/games';
import styles from './page.module.css';

export default function GamesPage() {
  const { user } = useAuth();
  const {
    guides,
    loading,
    addGuide,
    updateGuide,
    removeGuide,
  } = useGameGuides();

  // UI 狀態
  const [editMode, setEditMode] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>(games[0]?.id || '');
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [editingGuide, setEditingGuide] = useState<GameGuide | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // 取得當前遊戲資訊
  const currentGame = games.find((g) => g.id === selectedGame);

  // 取得當前遊戲的版本列表（直接在這裡計算，避免額外的函式依賴）
  const availableVersions = useMemo(() => {
    const versions = guides
      .filter((g) => g.gameId === selectedGame && g.version)
      .map((g) => g.version as string);

    return Array.from(new Set(versions)).sort((a, b) => {
      const aNum = parseFloat(a);
      const bNum = parseFloat(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return bNum - aNum;
      }
      return b.localeCompare(a);
    });
  }, [guides, selectedGame]);

  // 篩選顯示的攻略（直接計算，不使用額外函式）
  const filteredGuides = useMemo(() => {
    if (selectedVersion) {
      return guides.filter((g) => g.gameId === selectedGame && g.version === selectedVersion);
    }
    return guides.filter((g) => g.gameId === selectedGame);
  }, [guides, selectedGame, selectedVersion]);

  // 按照分類分組攻略（保持順序）
  const groupedGuides = useMemo(() => {
    const groups: Record<GuideCategory, GameGuide[]> = {
      '角色養成': [],
      '角色攻略': [],
      '活動攻略': [],
      '版本總覽': [],
      '通用資源': [],
    };

    filteredGuides.forEach((guide) => {
      groups[guide.category].push(guide);
    });

    // 按照 GUIDE_CATEGORIES 順序返回有資料的分類
    return GUIDE_CATEGORIES.map((category) => [category, groups[category]] as const)
      .filter(([_, guides]) => guides.length > 0);
  }, [filteredGuides]);

  // 處理新增攻略（使用 useCallback 避免重新建立）
  const handleAddGuide = useCallback(async (guide: Omit<GameGuide, 'id'>) => {
    await addGuide(guide);
    setShowAddForm(false);
  }, [addGuide]);

  // 處理更新攻略
  const handleUpdateGuide = useCallback(async (guide: Omit<GameGuide, 'id'>) => {
    if (editingGuide) {
      await updateGuide(editingGuide.id, guide);
      setEditingGuide(null);
    }
  }, [editingGuide, updateGuide]);

  // 處理刪除攻略
  const handleDeleteGuide = useCallback((guideId: string, title: string) => {
    if (confirm(`確定要刪除「${title}」嗎？\n\n此操作無法復原。`)) {
      removeGuide(guideId);
    }
  }, [removeGuide]);

  // 登入提示
  if (!user) {
    return (
      <div className={styles.loginPrompt}>
        <h2>🔒 請先登入</h2>
        <p>登入後即可查看和管理遊戲攻略</p>
      </div>
    );
  }

  // 載入中
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>載入攻略資料中...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ============================================================
          工具列：標題 + 編輯模式切換
          ============================================================ */}
      <div className={styles.toolbar}>
        <h1 className={styles.pageTitle}>
          <span className={styles.icon}>🎮</span>
          遊戲攻略中心
        </h1>
        <button
          className={`${styles.btnEditToggle} ${editMode ? styles.active : ''}`}
          onClick={() => {
            setEditMode(!editMode);
            setShowAddForm(false);
            setEditingGuide(null);
          }}
        >
          {editMode ? '✓ 完成編輯' : '✎ 編輯模式'}
        </button>
      </div>

      {/* ============================================================
          遊戲切換器
          ============================================================ */}
      <div className={styles.gameSelector}>
        {games.map((game) => (
          <button
            key={game.id}
            className={`${styles.gameTab} ${selectedGame === game.id ? styles.active : ''}`}
            onClick={() => {
              setSelectedGame(game.id);
              setSelectedVersion(null);
              setEditingGuide(null);
              setShowAddForm(false);
            }}
          >
            {game.icon && <span className={styles.gameIcon}>{game.icon}</span>}
            {game.name}
          </button>
        ))}
      </div>

      {/* ============================================================
          版本篩選器（如果有版本）
          ============================================================ */}
      {availableVersions.length > 0 && (
        <div className={styles.versionSelector}>
          <button
            className={`${styles.versionChip} ${selectedVersion === null ? styles.active : ''}`}
            onClick={() => setSelectedVersion(null)}
          >
            全部版本
          </button>
          {availableVersions.map((ver) => (
            <button
              key={ver}
              className={`${styles.versionChip} ${selectedVersion === ver ? styles.active : ''}`}
              onClick={() => setSelectedVersion(ver)}
            >
              v{ver}
            </button>
          ))}
        </div>
      )}

      {/* ============================================================
          編輯模式：新增攻略按鈕
          ============================================================ */}
      {editMode && !showAddForm && !editingGuide && (
        <button className={styles.btnAddGuide} onClick={() => setShowAddForm(true)}>
          + 新增攻略
        </button>
      )}

      {/* ============================================================
          新增/編輯表單
          ============================================================ */}
      {(showAddForm || editingGuide) && (
        <GuideEditForm
          guide={editingGuide || undefined}
          gameId={selectedGame}
          version={selectedVersion || undefined}
          onSave={editingGuide ? handleUpdateGuide : handleAddGuide}
          onCancel={() => {
            setShowAddForm(false);
            setEditingGuide(null);
          }}
        />
      )}

      {/* ============================================================
          攻略卡片網格 - 依分類分組顯示
          ============================================================ */}
      {filteredGuides.length === 0 ? (
        <div className={styles.emptyState}>
          <p>📝 目前沒有攻略資料</p>
          {editMode && (
            <button className={styles.btnAddGuide} onClick={() => setShowAddForm(true)}>
              + 新增第一筆攻略
            </button>
          )}
        </div>
      ) : (
        <div className={styles.groupedGuidesContainer}>
          {groupedGuides.map(([category, guides]) => (
            <div key={category} className={styles.categoryGroup}>
              <div className={styles.categoryHeader}>
                <CategoryBadge category={category as GuideCategory} />
                <span className={styles.categoryCount}>({guides.length})</span>
              </div>
              <div className={styles.guidesGrid}>
                {guides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    editMode={editMode}
                    onEdit={() => setEditingGuide(guide)}
                    onDelete={() => handleDeleteGuide(guide.id, guide.title)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
