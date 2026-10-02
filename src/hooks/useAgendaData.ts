'use client';

import { useEffect, useMemo, useState } from 'react';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useTodos } from '@/hooks/useTodos';
import { useCourseNotes } from '@/hooks/useCourseNotes';

/** 首頁與週視圖共用目前學期與筆記範圍，避免同一待辦在不同頁面有不同歸屬。 */
export function useAgendaData() {
  const schedule = useScheduleData();
  const courseNotes = useCourseNotes();
  const todoData = useTodos();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = (): void => { setNow(new Date()); };
    const timer = window.setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  const notes = useMemo(() => {
    if (courseNotes.loadError) return [];
    const courseIds = new Set(schedule.courses.map((course) => course.id));
    return courseNotes.notes.filter((note) => courseIds.has(note.courseId));
  }, [schedule.courses, courseNotes.notes, courseNotes.loadError]);
  return { ...schedule, notes: [...notes, ...todoData.todos], notesLoading: courseNotes.loading || todoData.loading, notesError: courseNotes.loadError || todoData.error, todoData,
    toggleCompletion: courseNotes.toggleCompletion, updateNote: courseNotes.updateNote, now };
}
