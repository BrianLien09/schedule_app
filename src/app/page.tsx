'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAgendaData } from '@/hooks/useAgendaData';
import type { CourseNote } from '@/data/courseNotes';
import type { AgendaTask, Todo, TodoInput } from '@/data/todos';
import { hasFamilyWebSyncAccess } from '@/config/permissions';
import { useConfirm } from '@/context/ConfirmContext';
import TodoEditor from '@/components/home/TodoEditor';
import HomeOverview from '@/components/home/HomeOverview';
import CourseNoteEditor from '@/components/schedule/school/CourseNoteEditor';
import LoginPrompt from '@/components/shared/LoginPrompt';
import { LoadingSpinner } from '@/components/shared/Loading';
import WorkShiftEditor from '@/components/schedule/work/WorkShiftEditor';
import type { WorkShift } from '@/data/schedule';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const data = useAgendaData();
  const [busyTaskIds, setBusyTaskIds] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<CourseNote | null>(null);
  const [todoEditor, setTodoEditor] = useState<Todo | 'new' | null>(null);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const openedLink = useRef(false);
  useEffect(() => {
    if (openedLink.current) return;
    const id = new URLSearchParams(window.location.search).get('todo');
    const linkedTodo = data.notes.find((note) => note.type === 'todo' && note.id === id);
    if (linkedTodo?.type === 'todo') {
      openedLink.current = true;
      startTransition(() => setTodoEditor(linkedTodo));
    }
  }, [data.notes]);

  const handleComplete = async (note: AgendaTask): Promise<void> => {
    if (busyTaskIds.has(note.id)) return;
    setBusyTaskIds((ids) => new Set(ids).add(note.id));
    try {
      const synced = note.type === 'todo' ? await data.todoData.complete(note) : (await data.toggleCompletion(note.id, true), true);
      if (synced) toast.success('已完成待辦');
      else toast.warning('待辦已完成，家庭月曆更新失敗，可在同步狀態重試');
    } catch {
      toast.error('更新失敗，待辦仍保留，請再試一次');
    } finally {
      setBusyTaskIds((ids) => { const next = new Set(ids); next.delete(note.id); return next; });
    }
  };

  const handleSaveTodo = async (input: TodoInput, todo?: Todo): Promise<void> => {
    const synced = await data.todoData.save(input, todo);
    if (synced) toast.success('已保存待辦');
    else toast.warning('待辦已保存，家庭同步失敗，可在同步狀態重試');
  };
  const handleDeleteTodo = async (todo: Todo): Promise<void> => {
    if (!await confirm({ title: '刪除待辦', message: `確定刪除「${todo.title}」？`, confirmText: '刪除', danger: true })) throw new Error('已取消刪除');
    const synced = await data.todoData.remove(todo);
    if (synced) toast.success('已刪除待辦');
    else toast.warning('待辦已刪除，家庭月曆更新失敗，可在同步狀態重試');
  };

  const handleSaveNote = async (updates: Parameters<typeof data.updateNote>[1]): Promise<void> => {
    if (!editingNote) throw new Error('請重新開啟筆記');
    await data.updateNote(editingNote.id, updates);
    toast.success('已保存筆記');
  };

  const handleSaveShift = async (shift: WorkShift): Promise<boolean> => {
    try {
      await data.updateWorkShift(shift.id, shift);
      toast.success('已更新打工班表');
      setEditingShift(null);
      return true;
    } catch {
      toast.error('更新班表失敗，請再試一次');
      return false;
    }
  };
  const handleDeleteShift = async (id: string): Promise<void> => {
    if (!await confirm({ title: '刪除打工班表', message: '確定刪除這個班次及對應的薪資記錄？', confirmText: '刪除', danger: true })) return;
    await data.deleteWorkShift(id);
    toast.success('已刪除打工班表與薪資記錄');
    setEditingShift(null);
  };

  if (authLoading) return <LoadingSpinner />;
  if (!user) return <LoginPrompt />;

  return <>
    <HomeOverview {...data} busyTaskIds={busyTaskIds} onComplete={(note) => { void handleComplete(note); }} onOpenNote={(note) => { if (note.type === 'todo') setTodoEditor(note); else setEditingNote(note); }} onAddTodo={() => setTodoEditor('new')} onEditShift={setEditingShift} />
    {editingShift && <WorkShiftEditor isOpen key={editingShift.id} onClose={() => setEditingShift(null)} onSave={handleSaveShift} onDelete={(id) => { void handleDeleteShift(id).catch(() => toast.error('刪除班表失敗，請再試一次')); }} shift={editingShift} mode="edit" existingCourses={data.courses} existingShifts={data.shifts} />}
    {todoEditor && <TodoEditor key={todoEditor === 'new' ? 'new' : todoEditor.id} todo={todoEditor === 'new' ? undefined : todoEditor}
      courses={data.courses} shifts={data.shifts} now={data.now} canSync={hasFamilyWebSyncAccess(user.email)}
      onSave={handleSaveTodo} onDelete={handleDeleteTodo} onClose={() => setTodoEditor(null)} />}
    {editingNote && <CourseNoteEditor key={editingNote.id} courseId={editingNote.courseId}
      courseName={editingNote.courseName || data.courses.find((course) => course.id === editingNote.courseId)?.name || '課程'}
      note={editingNote} onSave={handleSaveNote} onCancel={() => setEditingNote(null)} />}
  </>;
}
