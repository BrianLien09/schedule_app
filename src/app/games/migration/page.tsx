/**
 * 遊戲攻略資料遷移工具
 * 
 * 使用方式：
 * 1. 開發伺服器執行中（npm run dev）
 * 2. 登入後訪問此頁面
 * 3. 點擊「開始遷移」按鈕
 * 4. 等待遷移完成
 * 
 * 注意：此工具僅用於初次資料匯入，不應在正式環境中使用
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { games } from '@/data/games';
import { batchImportGameGuides } from '@/services/firestoreService';
import type { GameGuide } from '@/data/gameGuides';
import styles from './migration.module.css';

export default function MigrationPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const startMigration = async () => {
    if (!user) {
      alert('請先登入');
      return;
    }

    if (!confirm('確定要開始遷移資料嗎？\n\n這會將 games.ts 的資料匯入 Firestore。')) {
      return;
    }

    setStatus('running');
    setLog([]);
    setStats({ total: 0, success: 0, failed: 0 });

    const guidesToMigrate: Array<Omit<GameGuide, 'id'>> = [];

    try {
      addLog('🚀 開始解析資料...');

      // 遍歷所有遊戲
      for (const game of games) {
        addLog(`\n📦 處理遊戲：${game.name} (${game.id})`);

        // 遷移通用連結
        for (const link of game.links) {
          const guide: any = {
            gameId: game.id,
            title: link.title,
            url: link.url,
            category: '通用資源',
            priority: 3,
            tags: [],
            completed: false,
            order: Date.now() + guidesToMigrate.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          // 只有在有描述時才加入 subtitle
          if (link.description) {
            guide.subtitle = link.description;
          }
          
          guidesToMigrate.push(guide);
          addLog(`  ✓ 通用連結：${link.title}`);
        }

        // 遷移版本專屬內容
        if (game.versions) {
          for (const version of game.versions) {
            addLog(`  📌 版本 v${version.version}`);

            // 遷移角色資料
            for (const character of version.characters) {
              if (character.resonanceCode) {
                guidesToMigrate.push({
                  gameId: game.id,
                  version: version.version,
                  title: `${character.name} 共鳴譜`,
                  subtitle: `v${version.version} 版本角色配置`,
                  url: '',
                  resonanceCode: character.resonanceCode,
                  category: '角色養成',
                  priority: 4,
                  tags: ['角色配置'],
                  completed: false,
                  order: Date.now() + guidesToMigrate.length,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as any);
                addLog(`    ⭐ 角色：${character.name}`);
              }
            }

            // 遷移版本連結
            if (version.links) {
              for (const link of version.links) {
                const guide: any = {
                  gameId: game.id,
                  version: version.version,
                  title: link.title,
                  url: link.url,
                  category: '角色攻略',
                  priority: 3,
                  tags: [],
                  completed: false,
                  order: Date.now() + guidesToMigrate.length,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                
                // 只有在有描述時才加入 subtitle
                if (link.description) {
                  guide.subtitle = link.description;
                }
                
                guidesToMigrate.push(guide);
                addLog(`    🔗 連結：${link.title}`);
              }
            }
          }
        }
      }

      addLog(`\n📊 解析完成，共 ${guidesToMigrate.length} 筆資料`);
      setStats((prev) => ({ ...prev, total: guidesToMigrate.length }));

      // 批次匯入
      addLog('\n🔄 開始批次匯入到 Firestore...');
      await batchImportGameGuides(guidesToMigrate);

      setStats((prev) => ({ ...prev, success: guidesToMigrate.length }));
      addLog(`\n✅ 遷移完成！成功匯入 ${guidesToMigrate.length} 筆資料`);
      setStatus('success');
    } catch (error) {
      addLog(`\n❌ 錯誤：${error instanceof Error ? error.message : '未知錯誤'}`);
      setStats((prev) => ({ ...prev, failed: prev.total - prev.success }));
      setStatus('error');
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.loginPrompt}>
          <h2>🔒 請先登入</h2>
          <p>資料遷移需要登入權限</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🔄 遊戲攻略資料遷移工具</h1>
        <p>將 games.ts 的舊資料匯入到 Firestore 資料庫</p>
      </div>

      <div className={styles.warning}>
        <strong>⚠️ 注意事項</strong>
        <ul>
          <li>此工具僅用於初次資料匯入</li>
          <li>執行前請確認 Firestore Security Rules 已正確設定</li>
          <li>重複執行會產生重複資料，請謹慎使用</li>
          <li>建議在測試環境先執行確認無誤</li>
        </ul>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>總計</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--color-accent)' }}>
            {stats.success}
          </div>
          <div className={styles.statLabel}>成功</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: '#EF4444' }}>
            {stats.failed}
          </div>
          <div className={styles.statLabel}>失敗</div>
        </div>
      </div>

      <button
        className={styles.btnMigrate}
        onClick={startMigration}
        disabled={status === 'running'}
      >
        {status === 'running' ? '遷移中...' : '🚀 開始遷移'}
      </button>

      {log.length > 0 && (
        <div className={styles.logContainer}>
          <h3>執行記錄</h3>
          <pre className={styles.logContent}>
            {log.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </pre>
        </div>
      )}

      {status === 'success' && (
        <div className={styles.successMessage}>
          <h3>✅ 遷移完成！</h3>
          <p>請前往「遊戲攻略」頁面查看匯入結果。</p>
          <a href="/games" className={styles.btnViewGuides}>
            前往查看 →
          </a>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.errorMessage}>
          <h3>❌ 遷移失敗</h3>
          <p>請檢查執行記錄中的錯誤訊息，或聯絡開發者。</p>
        </div>
      )}
    </div>
  );
}
