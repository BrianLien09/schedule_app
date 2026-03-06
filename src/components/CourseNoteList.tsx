/**
 * 課程筆記列表元件
 * 
 * 顯示課程的所有筆記，支援篩選、排序、完成標記
 */

'use client';

import { useState, useMemo } from 'react';
import type { CourseNote, NoteType } from '@/data/courseNotes';
import { NOTE_TYPE_LABELS, NOTE_TYPE_COLORS, PRIORITY_COLORS } from '@/data/courseNotes';
import { useConfirm } from '@/context/ConfirmContext';
import styles from './CourseNoteList.module.css';

interface CourseNoteListProps {
  notes: CourseNote[];
  onEdit: (note: CourseNote) => void;
  onDelete: (noteId: string) => void;
  onToggleComplete: (noteId: string, completed: boolean) => void;
}

export default function CourseNoteList({
  notes,
  onEdit,
  onDelete,
  onToggleComplete,
}: CourseNoteListProps) {
  const { confirm } = useConfirm();
  const [filterType, setFilterType] = useState<NoteType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 篩選筆記
  const filteredNotes = useMemo(() => {
    if (filterType === 'all') return notes;
    return notes.filter((note) => note.type === filterType);
  }, [notes, filterType]);

  // 格式化日期顯示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '已過期';
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays <= 7) return `${diffDays} 天後`;

    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
    });
  };

  // 渲染 Markdown（簡易版）
  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        // 標題
        if (line.startsWith('## ')) {
          return <h3 key={i} className={styles.mdHeading}>{line.substring(3)}</h3>;
        }
        // 項目符號
        if (line.startsWith('- ')) {
          return <li key={i} className={styles.mdListItem}>{line.substring(2)}</li>;
        }
        // 粗體和斜體
        let formatted = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code>$1</code>');

        return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
      });
  };

  if (notes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📝</div>
        <p>還沒有筆記</p>
        <p className={styles.emptyHint}>點擊「新增筆記」開始記錄吧！</p>
      </div>
    );
  }

  return (
    <div className={styles.noteListContainer}>
      {/* 篩選器 */}
      <div className={styles.filterBar}>
        <button
          className={`${styles.filterButton} ${filterType === 'all' ? styles.active : ''}`}
          onClick={() => setFilterType('all')}
        >
          全部 ({notes.length})
        </button>
        {(['note', 'homework', 'exam'] as NoteType[]).map((type) => {
          const count = notes.filter((n) => n.type === type).length;
          return (
            <button
              key={type}
              className={`${styles.filterButton} ${filterType === type ? styles.active : ''}`}
              onClick={() => setFilterType(type)}
            >
              {NOTE_TYPE_LABELS[type]} ({count})
            </button>
          );
        })}
      </div>

      {/* 筆記列表 */}
      <div className={styles.noteList}>
        {filteredNotes.map((note) => {
          const isExpanded = expandedId === note.id;
          const isOverdue = note.dueDate && new Date(note.dueDate) < new Date() && !note.completed;

          return (
            <div
              key={note.id}
              className={`${styles.noteCard} ${note.completed ? styles.completed : ''} ${
                isOverdue ? styles.overdue : ''
              }`}
            >
              {/* 筆記標題列 */}
              <div className={styles.noteHeader}>
                <div className={styles.noteHeaderLeft}>
                  {/* 完成勾選框 */}
                  <input
                    type="checkbox"
                    checked={note.completed}
                    onChange={(e) => onToggleComplete(note.id, e.target.checked)}
                    className={styles.checkbox}
                  />

                  {/* 筆記類型標籤 */}
                  <span
                    className={styles.typeLabel}
                    style={{ backgroundColor: NOTE_TYPE_COLORS[note.type] }}
                  >
                    {NOTE_TYPE_LABELS[note.type]}
                  </span>

                  {/* 筆記標題 */}
                  <h4
                    className={styles.noteTitle}
                    onClick={() => setExpandedId(isExpanded ? null : note.id)}
                  >
                    {note.title}
                  </h4>
                </div>

                {/* 操作按鈕 */}
                <div className={styles.noteActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => onEdit(note)}
                    title="編輯"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={async () => {
                      const confirmed = await confirm({
                        title: '刪除筆記',
                        message: '確定要刪除這條筆記嗎？',
                        confirmText: '刪除',
                        danger: true,
                      });
                      if (confirmed) {
                        onDelete(note.id);
                      }
                    }}
                    title="刪除"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* 筆記後設資料 */}
              <div className={styles.noteMeta}>
                {note.dueDate && (
                  <span className={`${styles.dueDate} ${isOverdue ? styles.urgent : ''}`}>
                    📅 {formatDate(note.dueDate)}
                  </span>
                )}
                {note.priority && (
                  <span
                    className={styles.priority}
                    style={{ color: PRIORITY_COLORS[note.priority] }}
                  >
                    優先級: {note.priority === 'low' ? '低' : note.priority === 'medium' ? '中' : '高'}
                  </span>
                )}
                {note.tags && note.tags.length > 0 && (
                  <div className={styles.tags}>
                    {note.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 筆記內容（展開時顯示） */}
              {isExpanded && note.content && (
                <div className={styles.noteContent}>
                  {renderMarkdown(note.content)}
                </div>
              )}

              {/* 展開/收合按鈕 */}
              {note.content && (
                <button
                  className={styles.expandButton}
                  onClick={() => setExpandedId(isExpanded ? null : note.id)}
                >
                  {isExpanded ? '收合 ▲' : '展開 ▼'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
