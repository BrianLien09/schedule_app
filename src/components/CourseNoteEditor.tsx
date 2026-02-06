/**
 * 課程筆記編輯器元件
 * 
 * 提供新增/編輯筆記的表單介面
 */

'use client';

import { useState, useEffect } from 'react';
import type { CourseNote, NoteType } from '@/data/courseNotes';
import { NOTE_TYPE_LABELS } from '@/data/courseNotes';
import styles from './CourseNoteEditor.module.css';

interface CourseNoteEditorProps {
  courseId: string;
  courseName: string;
  note?: CourseNote;  // 編輯模式時傳入
  onSave: (noteData: {
    courseId: string;
    courseName: string;
    type: NoteType;
    title: string;
    content: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

export default function CourseNoteEditor({
  courseId,
  courseName,
  note,
  onSave,
  onCancel,
}: CourseNoteEditorProps) {
  const [type, setType] = useState<NoteType>(note?.type || 'note');
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [dueDate, setDueDate] = useState(note?.dueDate?.split('T')[0] || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    note?.priority || 'medium'
  );
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('請輸入標題');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        courseId,
        courseName,
        type,
        title: title.trim(),
        content: content.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        priority,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
    } catch (error) {
      console.error('儲存筆記失敗:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  // 插入 Markdown 格式
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      content.substring(end);

    setContent(newText);

    // 恢復焦點並調整選取範圍
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  return (
    <div className={styles.editorOverlay} onClick={onCancel}>
      <div
        className={`glass ${styles.editorModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.editorHeader}>
          <h3>{note ? '編輯筆記' : '新增筆記'}</h3>
          <button className={styles.closeButton} onClick={onCancel}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.editorForm}>
          {/* 課程名稱顯示 */}
          <div className={styles.courseInfo}>
            📚 {courseName}
          </div>

          {/* 筆記類型選擇 */}
          <div className={styles.formGroup}>
            <label>類型</label>
            <div className={styles.typeSelector}>
              {(['note', 'homework', 'exam'] as NoteType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.typeButton} ${
                    type === t ? styles.active : ''
                  }`}
                  onClick={() => setType(t)}
                >
                  {NOTE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* 標題 */}
          <div className={styles.formGroup}>
            <label htmlFor="title">
              標題 <span className={styles.required}>*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：期中考重點整理"
              required
            />
          </div>

          {/* 到期日期（作業/考試） */}
          {(type === 'homework' || type === 'exam') && (
            <div className={styles.formGroup}>
              <label htmlFor="dueDate">
                {type === 'homework' ? '繳交日期' : '考試日期'}
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          )}

          {/* 優先級 */}
          <div className={styles.formGroup}>
            <label>優先級</label>
            <div className={styles.prioritySelector}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.priorityButton} ${
                    priority === p ? styles.active : ''
                  } ${styles[p]}`}
                  onClick={() => setPriority(p)}
                >
                  {p === 'low' && '低'}
                  {p === 'medium' && '中'}
                  {p === 'high' && '高'}
                </button>
              ))}
            </div>
          </div>

          {/* Markdown 工具列 */}
          <div className={styles.formGroup}>
            <label>內容</label>
            <div className={styles.markdownToolbar}>
              <button
                type="button"
                title="粗體"
                onClick={() => insertMarkdown('**', '**')}
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                title="斜體"
                onClick={() => insertMarkdown('*', '*')}
              >
                <em>I</em>
              </button>
              <button
                type="button"
                title="標題"
                onClick={() => insertMarkdown('## ', '')}
              >
                H
              </button>
              <button
                type="button"
                title="項目符號"
                onClick={() => insertMarkdown('- ', '')}
              >
                •
              </button>
              <button
                type="button"
                title="程式碼"
                onClick={() => insertMarkdown('`', '`')}
              >
                {'<>'}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`支援 Markdown 格式：
- **粗體** 或 *斜體*
- ## 標題
- \`程式碼\`
- 項目符號（- 開頭）`}
              rows={10}
            />
          </div>

          {/* 標籤 */}
          <div className={styles.formGroup}>
            <label htmlFor="tags">標籤（用逗號分隔）</label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例如：重要, 期中考, 第三章"
            />
          </div>

          {/* 操作按鈕 */}
          <div className={styles.formActions}>
            <button type="button" onClick={onCancel}>
              取消
            </button>
            <button type="submit" disabled={saving}>
              {saving ? '儲存中...' : note ? '更新' : '新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
