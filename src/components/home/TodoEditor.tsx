'use client';

import { useState, type ReactNode } from 'react';
import type { Todo, TodoInput } from '@/data/todos';
import type { Course } from '@/data/schedule';
import Modal, { ModalContent } from '@/components/shared/Modal';
import { EditorField, EditorRow, EditorSegmented, EditorToggle } from '@/components/shared/EditorForm';
import { localDateKey } from '@/utils/agenda';
import { validateTodo } from '@/utils/todos';
import { defaultTodoDateTimes } from '@/utils/todoDefaults';
import styles from '@/components/shared/EditorForm.module.css';

interface TodoEditorProps {
  todo?: Todo;
  courses: Course[];
  now: Date;
  canSync: boolean;
  /** 從月曆點擊日期新增時，預填的起訖日期。 */
  initialDate?: string;
  /** 月曆新增彈窗標題列的類型切換。 */
  typeSwitcher?: ReactNode;
  onSave: (input: TodoInput, todo?: Todo) => Promise<void>;
  onDelete: (todo: Todo) => Promise<void>;
  onClose: () => void;
}

const ASSOCIATION_OPTIONS: { value: Todo['association']; label: string }[] = [
  { value: 'none', label: '其他' },
  { value: 'course', label: '課程' },
];

export default function TodoEditor({ todo, courses, now, canSync, initialDate, typeSwitcher, onSave, onDelete, onClose }: TodoEditorProps) {
  const [title, setTitle] = useState(todo?.title ?? '');
  const [defaults] = useState(() => defaultTodoDateTimes(now));
  const [startDate, setStartDate] = useState(todo?.startDate ?? initialDate ?? defaults.startDate);
  const [endDate, setEndDate] = useState(todo?.endDate ?? initialDate ?? defaults.endDate);
  const [startTime, setStartTime] = useState(todo ? todo.startTime ?? '' : defaults.startTime ?? '');
  // 預設結束時間可能跨過午夜；預填單一日期時若跨日，結束時間會早於開始時間，因此留空讓使用者自行決定。
  const [endTime, setEndTime] = useState(todo ? todo.endTime ?? '' : initialDate && defaults.endDate !== defaults.startDate ? '' : defaults.endTime ?? '');
  // 舊資料可能仍帶有已移除的「打工」類型，一律視為「其他」，儲存時會一併清掉關聯。
  const [association, setAssociation] = useState<Todo['association']>(todo?.association === 'course' ? 'course' : 'none');
  const [associationId, setAssociationId] = useState(todo?.association === 'course' ? todo.associationId : '');
  const [syncToFamily, setSyncToFamily] = useState(todo?.syncToFamily ?? false);
  const [busy, setBusy] = useState(false);
  const [draftId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState('');

  const options = courses.map((course) => ({ id: course.id, label: course.name }));
  // 原本關聯的課程若已被刪除，仍保留選項，避免編輯時關聯被無聲清掉
  if (todo?.association === 'course' && associationId === todo.associationId && associationId && !options.some((option) => option.id === associationId)) {
    options.push({ id: associationId, label: todo.associationLabel });
  }

  // 選擇課程後自動帶入該課程的上課與下課時間；日期欄位若是空的，時間無法單獨存在，因此一併補上今天
  const selectCourse = (courseId: string): void => {
    setAssociationId(courseId);
    const course = courses.find((item) => item.id === courseId);
    if (!course) return;
    setStartTime(course.startTime);
    setEndTime(course.endTime);
    if (!startDate) setStartDate(localDateKey(now));
    if (!endDate) setEndDate(localDateKey(now));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>, closeModal: () => void): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    const input: TodoInput = {
      title,
      startDate,
      endDate,
      startTime,
      endTime,
      association,
      associationId: association === 'none' ? '' : associationId,
      associationLabel: association === 'none' ? '' : options.find((option) => option.id === associationId)?.label ?? '',
      syncToFamily,
    };
    const failure = validateTodo(input);
    if (failure) { setError(failure); return; }
    setBusy(true);
    setError('');
    const draft: Todo = todo ?? { ...input, id: draftId, type: 'todo', completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    try {
      await onSave(input, draft);
      closeModal();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '保存失敗，請再試一次');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (closeModal: () => void): Promise<void> => {
    if (!todo || busy) return;
    setBusy(true);
    setError('');
    try {
      await onDelete(todo);
      closeModal();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '刪除失敗');
    } finally {
      setBusy(false);
    }
  };

  const dateTimeFields = (['start', 'end'] as const).map((endpoint) => {
    const isStart = endpoint === 'start';
    const date = isStart ? startDate : endDate;
    const time = isStart ? startTime : endTime;
    const setDate = isStart ? setStartDate : setEndDate;
    const setTime = isStart ? setStartTime : setEndTime;
    const label = isStart ? '開始' : '結束';
    return (
      <EditorRow key={endpoint}>
        <EditorField label={`${label}日期`} htmlFor={`todo-${endpoint}-date`}>
          <input
            id={`todo-${endpoint}-date`}
            className={styles.control}
            type="date"
            min={isStart ? undefined : startDate || undefined}
            value={date}
            onChange={(event) => { setDate(event.target.value); if (!event.target.value) setTime(''); }}
          />
        </EditorField>
        <EditorField label={`${label}時間`} htmlFor={`todo-${endpoint}-time`}>
          <input
            id={`todo-${endpoint}-time`}
            className={styles.control}
            type="time"
            step={60}
            min={!isStart && startDate === endDate ? startTime || undefined : undefined}
            value={time}
            onChange={(event) => { setTime(event.target.value); if (event.target.value && !date) setDate(localDateKey(new Date())); }}
          />
        </EditorField>
      </EditorRow>
    );
  });

  return (
    <Modal isOpen onClose={() => { if (!busy) onClose(); }} title={todo ? '編輯代辦行程' : '新增代辦行程'} headerExtra={typeSwitcher} maxWidth="560px">
      <ModalContent render={(requestClose) => (
        <form className={styles.form} onSubmit={(event) => { void submit(event, requestClose); }} onChange={() => setError('')}>
          <EditorField label="標題" htmlFor="todo-title" required>
            <input
              id="todo-title"
              className={styles.control}
              required
              maxLength={200}
              value={title}
              disabled={busy}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="這次需要完成什麼？"
            />
          </EditorField>

          <EditorField label="隸屬類型">
            <EditorSegmented
              value={association}
              options={ASSOCIATION_OPTIONS}
              ariaLabel="隸屬類型"
              onChange={(value) => { setAssociation(value); setAssociationId(''); }}
            />
          </EditorField>

          {association === 'course' && (
            <EditorField
              label="選擇課程"
              htmlFor="todo-course"
              required
              hint={options.length ? '選擇課程會自動帶入上課與下課時間' : '目前沒有課程可選，請先到學校課表新增。'}
            >
              <select
                id="todo-course"
                className={`${styles.control} ${styles.select}`}
                required
                value={associationId}
                disabled={busy}
                onChange={(event) => selectCourse(event.target.value)}
              >
                <option value="">請選擇課程</option>
                {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </EditorField>
          )}

          {dateTimeFields}

          <EditorToggle
            checked={syncToFamily}
            disabled={!canSync || busy}
            onChange={setSyncToFamily}
            label="同步至家庭月曆"
            hint={canSync ? '同步起訖日期與時間；同一天只顯示一筆。' : '此帳號尚未開放家庭同步。'}
          />

          {error && <p role="alert" className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            {todo && (
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} disabled={busy} onClick={() => { void remove(requestClose); }}>
                🗑️ 刪除
              </button>
            )}
            <button type="button" className={`${styles.btn} ${styles.btnCancel}`} disabled={busy} onClick={requestClose}>取消</button>
            <button type="submit" className={`${styles.btn} ${styles.btnSave}`} disabled={busy}>{busy ? '保存中…' : todo ? '儲存' : '新增'}</button>
          </div>
        </form>
      )} />
    </Modal>
  );
}
