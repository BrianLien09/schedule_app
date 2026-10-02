'use client';

import { useState } from 'react';
import type { Todo, TodoInput } from '@/data/todos';
import type { Course, WorkShift } from '@/data/schedule';
import Modal from '@/components/shared/Modal';
import { localDateKey } from '@/utils/agenda';
import { validateTodo } from '@/utils/todos';
import styles from './TodoEditor.module.css';

interface TodoEditorProps {
  todo?: Todo; courses: Course[]; shifts: WorkShift[]; now: Date; canSync: boolean;
  onSave: (input: TodoInput, todo?: Todo) => Promise<void>;
  onDelete: (todo: Todo) => Promise<void>;
  onClose: () => void;
}

export default function TodoEditor({ todo, courses, shifts, now, canSync, onSave, onDelete, onClose }: TodoEditorProps) {
  const [title, setTitle] = useState(todo?.title ?? '');
  const [startDate, setStartDate] = useState(todo?.startDate ?? '');
  const [endDate, setEndDate] = useState(todo?.endDate ?? '');
  const [association, setAssociation] = useState<Todo['association']>(todo?.association ?? 'none');
  const [associationId, setAssociationId] = useState(todo?.associationId ?? '');
  const [syncToFamily, setSyncToFamily] = useState(todo?.syncToFamily ?? false);
  const [busy, setBusy] = useState(false);
  const [draftId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState('');
  const month = localDateKey(now).slice(0, 7);
  const options = association === 'course' ? courses.map((course) => ({ id: course.id, label: course.name })) : shifts.filter((shift) => shift.date.startsWith(month)).map((shift) => ({ id: shift.id, label: `${shift.date} ${shift.startTime}–${shift.endTime} ${shift.shiftCategory || shift.note || '打工'}` }));
  if (todo?.association === association && associationId === todo.associationId && associationId && !options.some((option) => option.id === associationId)) options.push({ id: associationId, label: todo.associationLabel });
  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    const input: TodoInput = { title, startDate, endDate, association, associationId: association === 'none' ? '' : associationId, associationLabel: association === 'none' ? '' : options.find((option) => option.id === associationId)?.label ?? '', syncToFamily };
    const failure = validateTodo(input);
    if (failure) { setError(failure); return; }
    setBusy(true); setError('');
    const draft: Todo = todo ?? { ...input, id: draftId, type: 'todo', completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    try { await onSave(input, draft); onClose(); } catch (failure) { setError(failure instanceof Error ? failure.message : '保存失敗，請再試一次'); } finally { setBusy(false); }
  };
  const remove = async (): Promise<void> => {
    if (!todo || busy) return;
    setBusy(true); setError('');
    try { await onDelete(todo); onClose(); } catch (failure) { setError(failure instanceof Error ? failure.message : '刪除失敗'); } finally { setBusy(false); }
  };
  return <Modal isOpen onClose={() => { if (!busy) onClose(); }} title={todo ? '編輯待辦' : '新增待辦'} maxWidth="560px">
    <form className={styles.form} onSubmit={(event) => { void submit(event); }}>
      <fieldset disabled={busy} className={styles.fields} onChange={() => setError('')}>
        <label>標題<input required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="這次需要完成什麼？" /></label>
        <div className={styles.dates}><label>開始日期（選填）<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>結束日期（選填）<input type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div>
        <label>隸屬類型<select value={association} onChange={(event) => { setAssociation(event.target.value as Todo['association']); setAssociationId(''); }}><option value="none">無</option><option value="course">課程</option><option value="work">打工</option></select></label>
        {association !== 'none' && <label>{association === 'course' ? '選擇課程' : '選擇當月打工'}<select required value={associationId} onChange={(event) => setAssociationId(event.target.value)}><option value="">請選擇</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>{!options.length && <span className={styles.hint}>{association === 'course' ? '目前沒有課程可選。' : '本月沒有打工班次可選。'}</span>}</label>}
        <label className={styles.sync}><input type="checkbox" checked={syncToFamily} disabled={!canSync} onChange={(event) => setSyncToFamily(event.target.checked)} />同步至家庭月曆</label>
        <p className={styles.hint}>{canSync ? '有日期才可同步；起訖期間逐日顯示，標題不加前綴。' : '此帳號尚未開放家庭同步。'}</p>
      </fieldset>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.actions}>{todo && <button type="button" disabled={busy} onClick={() => { void remove(); }}>刪除待辦</button>}<button type="button" disabled={busy} onClick={onClose}>取消</button><button className={styles.save} type="submit" disabled={busy}>{busy ? '保存中…' : '保存待辦'}</button></div>
    </form>
  </Modal>;
}
