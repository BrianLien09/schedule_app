'use client';
import { useState } from 'react';
import CourseManager from '../../components/CourseManager';
import WorkShiftManager from '../../components/WorkShiftManager';
import { useAuth } from '../../context/AuthContext';
import LoginPrompt from '../../components/LoginPrompt';
import { LoadingSpinner } from '../../components/Loading';
import styles from './page.module.css';

export default function ManagePage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'work'>('courses');

  // 檢查登入狀態
  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPrompt />;
  }

  return (
    <div className={styles.pageContainer}>
      <div className="glass card">
        <div className={styles.header}>
          <h1>資料管理</h1>
          <p className={styles.subtitle}>新增、編輯或刪除課程和打工班表</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'courses' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            📚 課程管理
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'work' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('work')}
          >
            💼 打工班表
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'courses' && <CourseManager />}
          {activeTab === 'work' && <WorkShiftManager />}
        </div>
      </div>
    </div>
  );
}
