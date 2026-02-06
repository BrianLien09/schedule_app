/**
 * 課程筆記管理 Hook
 * 
 * 提供筆記的 CRUD 操作與即時同步功能
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { CourseNote, NoteType } from '@/data/courseNotes';
import {
  subscribeToCourseNotes,
  subscribeToCourseNotesByCourse,
  addCourseNote,
  updateCourseNote,
  deleteCourseNote,
  toggleCourseNoteCompletion,
  getIncompleteTasks,
} from '@/services/firestoreService';

interface UseCourseNotesOptions {
  courseId?: string;  // 如果提供，只訂閱特定課程的筆記
}

export function useCourseNotes(options: UseCourseNotesOptions = {}) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 訂閱筆記資料（即時同步）
  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = options.courseId
        ? subscribeToCourseNotesByCourse(options.courseId, (data) => {
            setNotes(data);
            setLoading(false);
          })
        : subscribeToCourseNotes((data) => {
            setNotes(data);
            setLoading(false);
          });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入筆記失敗');
      setLoading(false);
    }
  }, [user, options.courseId]);

  /**
   * 新增筆記
   */
  const addNote = useCallback(
    async (noteData: {
      courseId: string;
      courseName: string;
      type: NoteType;
      title: string;
      content: string;
      dueDate?: string;
      priority?: 'low' | 'medium' | 'high';
      tags?: string[];
    }) => {
      if (!user) {
        throw new Error('請先登入');
      }

      try {
        const newNote: Omit<CourseNote, 'id'> = {
          ...noteData,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const noteId = await addCourseNote(newNote);
        return noteId;
      } catch (err) {
        const message = err instanceof Error ? err.message : '新增筆記失敗';
        setError(message);
        throw new Error(message);
      }
    },
    [user]
  );

  /**
   * 更新筆記
   */
  const updateNote = useCallback(
    async (noteId: string, updates: Partial<CourseNote>) => {
      if (!user) {
        throw new Error('請先登入');
      }

      try {
        await updateCourseNote(noteId, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : '更新筆記失敗';
        setError(message);
        throw new Error(message);
      }
    },
    [user]
  );

  /**
   * 刪除筆記
   */
  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!user) {
        throw new Error('請先登入');
      }

      try {
        await deleteCourseNote(noteId);
      } catch (err) {
        const message = err instanceof Error ? err.message : '刪除筆記失敗';
        setError(message);
        throw new Error(message);
      }
    },
    [user]
  );

  /**
   * 切換筆記完成狀態
   */
  const toggleCompletion = useCallback(
    async (noteId: string, completed: boolean) => {
      if (!user) {
        throw new Error('請先登入');
      }

      try {
        await toggleCourseNoteCompletion(noteId, completed);
      } catch (err) {
        const message = err instanceof Error ? err.message : '更新狀態失敗';
        setError(message);
        throw new Error(message);
      }
    },
    [user]
  );

  /**
   * 取得未完成的作業/考試
   */
  const fetchIncompleteTasks = useCallback(async () => {
    if (!user) {
      return [];
    }

    try {
      const tasks = await getIncompleteTasks();
      return tasks;
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入待辦事項失敗';
      setError(message);
      return [];
    }
  }, [user]);

  /**
   * 依類型篩選筆記
   */
  const getNotesByType = useCallback(
    (type: NoteType) => {
      return notes.filter((note) => note.type === type);
    },
    [notes]
  );

  /**
   * 取得即將到期的作業/考試（7 天內）
   */
  const getUpcomingTasks = useCallback(() => {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return notes
      .filter((note) => {
        if (note.completed || !note.dueDate) return false;
        if (note.type !== 'homework' && note.type !== 'exam') return false;

        const dueDate = new Date(note.dueDate);
        return dueDate >= now && dueDate <= sevenDaysLater;
      })
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [notes]);

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    toggleCompletion,
    fetchIncompleteTasks,
    getNotesByType,
    getUpcomingTasks,
  };
}
