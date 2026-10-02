'use client';

import { useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDataStatus, getServerDataStatus, retryFamilySync, subscribeDataStatus } from '@/services/dataStatusStore';
import styles from './DataSyncStatus.module.css';

function subscribeNetwork(listener: () => void): () => void {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}

export default function DataSyncStatus() {
  const { user } = useAuth();
  const status = useSyncExternalStore(subscribeDataStatus, getDataStatus, getServerDataStatus);
  const online = useSyncExternalStore(subscribeNetwork, () => navigator.onLine, () => true);

  const hasSaveActivity = status.saving > 0 || status.pending;
  const hasFailure = status.saveFailures > 0 || status.readFailures > 0 || status.familyFailures > 0;
  if (!user || (!hasSaveActivity && status.syncing === 0 && !hasFailure)) return null;

  let message: string | null = null;
  if (status.saving > 0 || status.pending) message = online ? '保存中 · 等待雲端確認' : '等待連線後保存';
  if (status.saveFailures > 0) message = '保存失敗 · 請在原表單重試';
  if (status.readFailures > 0) message = '部分資料讀取失敗';
  const familyMessage = status.syncing > 0
    ? (online ? '家庭月曆同步中' : '家庭月曆等待連線')
    : status.familyFailures > 0
      ? '家庭月曆同步失敗'
      : null;

  return (
    <div className={styles.bar}>
      <div className={styles.messages} role="status" aria-live="polite" aria-atomic="true">
        {message && <span>{message}</span>}
        {familyMessage && <span>{familyMessage}</span>}
      </div>
      <div className={styles.actions}>
        {status.readFailures > 0 && <button type="button" onClick={() => window.location.reload()}>重新讀取</button>}
        {status.familyFailures > 0 && <button type="button" disabled={!online || status.syncing > 0} onClick={() => { void retryFamilySync(); }}>重試家庭同步</button>}
      </div>
    </div>
  );
}
