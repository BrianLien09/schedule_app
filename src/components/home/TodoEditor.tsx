'use client';

import { useState, type ReactNode } from 'react';
import type { Todo, TodoInput } from '@/data/todos';
import type { Course } from '@/data/schedule';
import Modal, { ModalContent } from '@/components/shared/Modal';
import { EditorField, EditorSegmented, EditorToggle } from '@/components/shared/EditorForm';
import { BookIcon } from '@/components/shared/Icons';
import DateTimePicker, { type DateTimePart } from '@/components/shared/pickers/DateTimePicker';
import { OptionCardGroup, type OptionCardItem } from '@/components/shared/pickers/OptionPicker';
import { localDateKey } from '@/utils/agenda';
import { durationLabel, minutesToTime, parseDateKey, timeToMinutes } from '@/utils/pickerDateTime';
import { getAccentColorByName, validateTodo } from '@/utils/todos';
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
  /** 為 false 時不播彈出動畫（由其他表單切換過來時使用） */
  animateIn?: boolean;
  onSave: (input: TodoInput, todo?: Todo) => Promise<void>;
  /** 回傳 false 代表使用者取消刪除 */
  onDelete: (todo: Todo) => Promise<boolean>;
  onClose: () => void;
}

// Course.day 為 1～7（週一～週日），與 Date.getDay() 不同，因此另建對照表
const COURSE_DAY_LABELS: Record<number, string> = { 1: '週一', 2: '週二', 3: '週三', 4: '週四', 5: '週五', 6: '週六', 7: '週日' };

type Endpoint = 'start' | 'end';
type ActivePicker = { endpoint: Endpoint; part: DateTimePart } | null;

const ASSOCIATION_OPTIONS: { value: Todo['association']; label: string }[] = [
  { value: 'none', label: '其他' },
  { value: 'course', label: '課程' },
];

export default function TodoEditor({ todo, courses, now, canSync, initialDate, typeSwitcher, animateIn, onSave, onDelete, onClose }: TodoEditorProps) {
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
  // 四個選擇器（起訖日期與時間）同時只展開一個，避免整張卡片被撐得很長
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [draftId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState('');

  const options = courses.map((course) => ({ id: course.id, label: course.name }));
  // 原本關聯的課程若已被刪除，仍保留選項，避免編輯時關聯被無聲清掉
  if (todo?.association === 'course' && associationId === todo.associationId && associationId && !options.some((option) => option.id === associationId)) {
    options.push({ id: associationId, label: todo.associationLabel });
  }

  // 選擇課程後自動帶入該課程的上課與下課時間；日期欄位若是空的，時間無法單獨存在，因此一併補上今天
  const selectCourse = (courseId: string): void => {
    setError('');
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
      if (await onDelete(todo)) closeModal();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '刪除失敗');
    } finally {
      setBusy(false);
    }
  };

  const pickerPart = (endpoint: Endpoint): DateTimePart | null =>
    activePicker?.endpoint === endpoint ? activePicker.part : null;
  const setPickerPart = (endpoint: Endpoint, part: DateTimePart | null): void =>
    setActivePicker(part ? { endpoint, part } : null);

  // 開始日期往後挪到結束日之後時，結束日跟著移動，而不是等送出才跳錯誤要使用者回頭改
  const changeStartDate = (value: string): void => {
    setError('');
    setStartDate(value);
    if (!value) setStartTime('');
    if (value && endDate && endDate < value) setEndDate(value);
  };
  const changeEndDate = (value: string): void => {
    setError('');
    setEndDate(value);
    if (!value) setEndTime('');
  };
  // 時間不能脫離日期單獨存在，先選時間時自動補上今天
  const changeStartTime = (value: string): void => {
    setError('');
    setStartTime(value);
    if (value && !startDate) setStartDate(localDateKey(new Date()));
  };
  const changeEndTime = (value: string): void => {
    setError('');
    setEndTime(value);
    if (value && !endDate) setEndDate(startDate || localDateKey(new Date()));
  };

  const rangeNote = (() => {
    if (!startDate || !endDate) return null;
    if (startDate === endDate) return startTime && endTime ? durationLabel(startTime, endTime, false) : '同一天';
    const from = parseDateKey(startDate);
    const to = parseDateKey(endDate);
    if (!from || !to) return null;
    return `橫跨 ${Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1} 天`;
  })();

  const courseOptions: OptionCardItem<string>[] = [
    ...courses.map((course) => ({
      value: course.id,
      title: course.name,
      meta: `${COURSE_DAY_LABELS[course.day] ?? ''} ${course.startTime}–${course.endTime}`.trim(),
      accent: getAccentColorByName(course.name),
      icon: <BookIcon size={15} />,
    })),
    // 原本關聯的課程若已被刪除，仍保留選項，避免編輯時關聯被無聲清掉
    ...options
      .filter((option) => !courses.some((course) => course.id === option.id))
      .map((option) => ({ value: option.id, title: option.label, meta: '已移除的課程', accent: getAccentColorByName(option.label), icon: <BookIcon size={15} /> })),
  ];

  return (
    <Modal isOpen onClose={() => { if (!busy) onClose(); }} title={todo ? '編輯代辦行程' : '新增代辦行程'} headerExtra={typeSwitcher} animateIn={animateIn} maxWidth="560px">
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
              required
              hint={courseOptions.length ? '選擇課程會自動帶入上課與下課時間，顏色與月曆上的代辦一致' : '目前沒有課程可選，請先到學校課表新增。'}
            >
              <OptionCardGroup
                ariaLabel="選擇課程"
                value={associationId}
                disabled={busy}
                onChange={selectCourse}
                options={courseOptions}
              />
            </EditorField>
          )}

          <section className={styles.sectionCard} aria-label="代辦時間">
            <div className={styles.sectionHeader}>
              <span>時間（皆可不填）</span>
              {rangeNote && <span className={styles.sectionNote}>{rangeNote}</span>}
            </div>
            <DateTimePicker
              label="開始"
              date={startDate}
              time={startTime}
              onDateChange={changeStartDate}
              onTimeChange={changeStartTime}
              activePart={pickerPart('start')}
              onActivePartChange={(part) => setPickerPart('start', part)}
              defaultTime={defaults.startTime ?? '09:00'}
              rangeEdge={endDate}
              disabled={busy}
            />
            <DateTimePicker
              label="結束"
              date={endDate}
              time={endTime}
              onDateChange={changeEndDate}
              onTimeChange={changeEndTime}
              activePart={pickerPart('end')}
              onActivePartChange={(part) => setPickerPart('end', part)}
              defaultTime={startTime ? minutesToTime((timeToMinutes(startTime) ?? 0) + 60) : defaults.endTime ?? '10:00'}
              minDate={startDate || undefined}
              rangeEdge={startDate}
              disabled={busy}
            />
          </section>

          <EditorToggle
            checked={syncToFamily}
            disabled={!canSync || busy}
            onChange={setSyncToFamily}
            label={canSync ? '同步至家庭月曆' : '尚未開放同步'}
            hint={canSync ? '同步起訖日期與時間；同一天只顯示一筆' : '此帳號尚未開放家庭同步'}
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
