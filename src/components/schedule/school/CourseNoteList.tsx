/**
 * 課程筆記列表元件
 * 
 * 顯示課程的所有筆記，支援篩選、排序、完成標記
 */

'use client';

import { useState, useMemo, type ReactNode } from 'react';
import type { CourseNote, NoteType } from '@/data/courseNotes';
import { NOTE_TYPE_LABELS, NOTE_TYPE_COLORS, PRIORITY_COLORS } from '@/data/courseNotes';
import { useConfirm } from '@/context/ConfirmContext';
import { parseMarkdown, type MarkdownInlineNode } from './markdownRenderer';
import styles from './CourseNoteList.module.css';

interface CourseNoteListProps {
  notes: CourseNote[];
  onEdit: (note: CourseNote) => void;
  onDelete: (noteId: string) => void;
  onToggleComplete: (noteId: string, completed: boolean) => void;
}

function renderInlineMarkdown(nodes: MarkdownInlineNode[]): ReactNode {
  return nodes.map((node, nodeIndex) => {
    if (node.type === 'strong') return <strong key={nodeIndex}>{node.value}</strong>;
    if (node.type === 'emphasis') return <em key={nodeIndex}>{node.value}</em>;
    if (node.type === 'code') return <code key={nodeIndex}>{node.value}</code>;
    return node.value;
  });
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

  // 只將明確允許的 Markdown 節點轉成 React 元素，避免原始 HTML 被解譯。
  const renderMarkdown = (text: string) =>
    parseMarkdown(text).map((block, blockIndex) => {
      if (block.type === 'heading') {
        return (
          <h3 key={`heading-${blockIndex}`} className={styles.mdHeading}>
            {renderInlineMarkdown(block.content)}
          </h3>
        );
      }

      if (block.type === 'list') {
        return (
          <ul key={`list-${blockIndex}`} className={styles.mdList}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className={styles.mdListItem}>
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
      }

      return (
        <p key={`paragraph-${blockIndex}`}>
          {renderInlineMarkdown(block.content)}
        </p>
      );
    });

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
