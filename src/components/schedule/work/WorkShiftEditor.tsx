'use client';
import { useState, useEffect, type ReactNode } from 'react';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { generateWorkShiftId, type Course, type WorkShift } from '../../../data/schedule';
import { getWorkRoleHourlyRate, getWorkRoleLabel, type RoleType } from '@/data/workRoles';
import { getShiftTemplateWorkHours } from '@/data/shiftTemplates';
import Modal, { ModalContent } from '../../shared/Modal';
import { EditorField, EditorRow } from '../../shared/EditorForm';
import { BriefcaseIcon, PlusIcon } from '../../shared/Icons';
import DatePicker from '../../shared/pickers/DatePicker';
import TimeRangePicker, { type DurationPreset, type TimeField } from '../../shared/pickers/TimeRangePicker';
import { OptionAddCard, OptionCardGroup, PillGroup } from '../../shared/pickers/OptionPicker';
import styles from '../../shared/EditorForm.module.css';

import { useShiftTemplates } from '@/hooks/useShiftTemplates';
import { useWorkRoles } from '@/hooks/useWorkRoles';
import { findWorkShiftConflicts, formatConflictMessage } from '@/utils/scheduleConflicts';
import { getAccentColorByName } from '@/utils/todos';

// 打工常見的班長：半天、整天；比一般行程的 30 分～2 小時更實用
const SHIFT_DURATIONS: DurationPreset[] = [
  { label: '2 小時', minutes: 120 },
  { label: '3 小時', minutes: 180 },
  { label: '4 小時', minutes: 240 },
  { label: '8 小時', minutes: 480 },
];

// 「自訂班別」選項的內部值；集中成常數，避免與使用者取的班別名稱撞名時難以追查
const CUSTOM_CATEGORY = '__custom__';

type ActivePicker = 'date' | TimeField | null;

interface WorkShiftEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: WorkShift) => void | Promise<boolean | void>;
  onDelete?: (shiftId: string) => void;
  shift?: WorkShift | null;
  mode: 'add' | 'edit';
  existingCourses?: Course[];
  existingShifts?: WorkShift[];
  /** 月曆新增彈窗標題列的類型切換（僅新增模式使用）。 */
  typeSwitcher?: ReactNode;
  /** 為 false 時不播彈出動畫（由其他表單切換過來時使用） */
  animateIn?: boolean;
}

/**
 * 計算兩時間點之間的工時 (小時)
 */
function calculateHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const totalMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
  return totalMinutes > 0 ? Number((totalMinutes / 60).toFixed(2)) : 0;
}

/**
 * Work Shift Editor Dialog Component
 * 新增或編輯打工班表的對話框，包含薪資格式同步與刪除功能
 */
export default function WorkShiftEditor({
  isOpen,
  onClose,
  onSave,
  onDelete,
  shift,
  mode,
  existingCourses = [],
  existingShifts = [],
  typeSwitcher,
  animateIn,
}: WorkShiftEditorProps) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { templates } = useShiftTemplates();
  const { roles } = useWorkRoles();
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 同一時間只展開一個選擇器面板，避免日期與時間面板同時撐開整張卡片
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [formData, setFormData] = useState<Partial<WorkShift>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '18:00',
    role: 'assistant',
    hourlyRate: 200,
    workHours: 9,
    shiftCategory: '',
    note: '',
  });

  useEffect(() => {
    if (shift && mode === 'edit') {
      const calculatedH = calculateHours(shift.startTime, shift.endTime);
      const cat = shift.shiftCategory || shift.note || '';
      const matchedTemplate = templates.find((template) => template.name === cat);
      setFormData({
        ...shift,
        role: shift.role || roles[0]?.id || 'assistant',
        roleName: shift.roleName || getWorkRoleLabel(shift.role || roles[0]?.id || 'assistant', roles),
        hourlyRate: shift.hourlyRate ?? getWorkRoleHourlyRate(shift.role || roles[0]?.id || 'assistant', roles),
        workHours: matchedTemplate
          ? getShiftTemplateWorkHours(matchedTemplate, calculatedH)
          : shift.workHours ?? calculatedH,
        shiftCategory: cat,
        note: shift.note || shift.shiftCategory || '',
      });
      // 檢查目前的類別是否在既有範本中
      const matchTemplate = templates.some((t) => t.name === cat);
      setIsCustomCategory(!matchTemplate && Boolean(cat));
    } else if (mode === 'add') {
      const startDate = shift?.date ?? new Date().toISOString().split('T')[0];
      const startT = shift?.startTime ?? '09:00';
      const endT = shift?.endTime ?? '18:00';
      const cat = shift?.shiftCategory || shift?.note || '';
      const role = shift?.role || roles[0]?.id || 'assistant';
      const matchedTemplate = templates.find((template) => template.name === cat);
      setFormData({
        date: startDate,
        startTime: startT,
        endTime: endT,
        role,
        roleName: shift?.roleName || getWorkRoleLabel(role, roles),
        hourlyRate: shift?.hourlyRate ?? getWorkRoleHourlyRate(role, roles),
        workHours: matchedTemplate
          ? getShiftTemplateWorkHours(matchedTemplate, calculateHours(startT, endT))
          : shift?.workHours ?? calculateHours(startT, endT),
        shiftCategory: cat,
        note: shift?.note || '',
      });
      setIsCustomCategory(false);
    }
  }, [shift, mode, roles, templates]);

  /**
   * 當使用者選擇下拉選單範本時，自動將該範本的欄位（時間、職稱／職位、工時、時薪）帶入表單
   */
  const handleSelectTemplate = (selectedName: string) => {
    if (selectedName === CUSTOM_CATEGORY) {
      setIsCustomCategory(true);
      setFormData((prev) => ({
        ...prev,
        shiftCategory: '',
        note: '',
        workHours: calculateHours(prev.startTime || '09:00', prev.endTime || '18:00'),
      }));
      return;
    }

    setIsCustomCategory(false);
    const selectedTpl = templates.find((t) => t.name === selectedName);
    if (selectedTpl) {
      const startT = selectedTpl.startTime || formData.startTime || '09:00';
      const endT = selectedTpl.endTime || formData.endTime || '18:00';
      const calculatedH = calculateHours(startT, endT);
      const role = selectedTpl.role || formData.role || roles[0]?.id || 'assistant';
      const hourlyRate = selectedTpl.hourlyRate ?? getWorkRoleHourlyRate(role, roles);

      setFormData((prev) => ({
        ...prev,
        shiftCategory: selectedTpl.name,
        note: selectedTpl.name,
        startTime: startT,
        endTime: endT,
        role,
        roleName: getWorkRoleLabel(role, roles),
        hourlyRate,
        workHours: getShiftTemplateWorkHours(selectedTpl, calculatedH),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        shiftCategory: selectedName,
        note: selectedName,
        workHours: calculateHours(prev.startTime || '09:00', prev.endTime || '18:00'),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent, closeModal: () => void = onClose) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.warning('請填寫所有必填欄位');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.warning('結束時間必須晚於開始時間');
      return;
    }

    const role = formData.role || roles[0]?.id || 'assistant';
    const hourlyRate = formData.hourlyRate ?? getWorkRoleHourlyRate(role, roles);
    const autoHours = calculateHours(formData.startTime, formData.endTime);
    const category = formData.shiftCategory?.trim() || formData.note?.trim() || '';
    const matchedTemplate = !isCustomCategory
      ? templates.find((template) => template.name === category)
      : undefined;
    const workHours = matchedTemplate
      ? getShiftTemplateWorkHours(matchedTemplate, autoHours)
      : formData.workHours !== undefined
        ? formData.workHours
        : autoHours;

    const newShift: WorkShift = {
      id: shift?.id || generateWorkShiftId(),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      role,
      roleName: formData.roleName || getWorkRoleLabel(role, roles),
      hourlyRate,
      workHours,
      shiftCategory: category,
      note: category || formData.note,
      salaryRecordId: shift?.salaryRecordId,
      legacyWorkShiftId: shift?.legacyWorkShiftId,
    };

    const conflicts = findWorkShiftConflicts(
      newShift,
      existingCourses,
      existingShifts,
      shift?.id
    );
    if (conflicts.length > 0) {
      const confirmed = await confirm({
        title: '發現行程衝突',
        message: formatConflictMessage(conflicts),
        confirmText: '仍要儲存',
      });
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      const saved = await onSave(newShift);
      if (saved !== false) closeModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (newRole: RoleType) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      roleName: getWorkRoleLabel(newRole, roles),
      hourlyRate: getWorkRoleHourlyRate(newRole, roles),
    }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      const hours = calculateHours(next.startTime || '09:00', next.endTime || '18:00');
      const matchedTemplate = !isCustomCategory
        ? templates.find((template) => template.name === next.shiftCategory)
        : undefined;
      return {
        ...next,
        workHours: matchedTemplate
          ? getShiftTemplateWorkHours(matchedTemplate, hours)
          : hours,
      };
    });
  };

  const handleDelete = (closeModal: () => void = onClose) => {
    if (shift?.id && onDelete) {
      onDelete(shift.id);
      closeModal();
    }
  };

  const selectedTemplate = !isCustomCategory
    ? templates.find((template) => template.name === formData.shiftCategory)
    : undefined;

  const estimatedPay = Math.round((formData.workHours ?? 0) * (formData.hourlyRate ?? 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? '新增打工班表' : '編輯打工班表'}
      headerExtra={typeSwitcher}
      animateIn={animateIn}
      maxWidth="560px"
    >
      <ModalContent render={(requestClose) => <form onSubmit={(e) => handleSubmit(e, requestClose)} className={styles.form}>
        {/* 班別放最前面：選擇範本會自動帶入時間、職稱與時薪，後面欄位只需微調 */}
        <EditorField
          label="班別"
          hint={isCustomCategory ? '自訂班別不套用範本，工時依起訖時間計算' : templates.length ? '選擇班別範本會自動帶入時間、職稱與時薪' : '尚未建立班別範本，可到薪資計算的「班別範本管理」新增'}
        >
          {isCustomCategory ? (
            <div className={styles.inlineRow}>
              <input
                id="shiftCategory"
                className={styles.control}
                type="text"
                autoFocus
                value={formData.shiftCategory || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shiftCategory: e.target.value,
                    note: e.target.value,
                  }))
                }
                placeholder="輸入自訂班別名稱"
                aria-label="自訂班別名稱"
              />
              {templates.length > 0 && (
                <button type="button" className={styles.inlineButton} onClick={() => handleSelectTemplate('')}>
                  改選範本
                </button>
              )}
            </div>
          ) : (
            <OptionCardGroup
              ariaLabel="班別範本"
              value={formData.shiftCategory || ''}
              onChange={handleSelectTemplate}
              options={templates.map((tpl) => ({
                value: tpl.name,
                title: tpl.name,
                meta: `${tpl.startTime}–${tpl.endTime} · $${tpl.hourlyRate}/h`,
                accent: getAccentColorByName(tpl.name),
                icon: <BriefcaseIcon size={16} />,
              }))}
              trailing={<OptionAddCard label="自訂班別" icon={<PlusIcon size={16} />} onClick={() => handleSelectTemplate(CUSTOM_CATEGORY)} />}
            />
          )}
        </EditorField>

        <EditorField label="日期" required>
          <DatePicker
            label="上班日期"
            value={formData.date || ''}
            onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
            isOpen={activePicker === 'date'}
            onOpenChange={(open) => setActivePicker(open ? 'date' : null)}
          />
        </EditorField>

        <EditorField label="上班時間" required>
          <TimeRangePicker
            ariaLabel="上班時間"
            startTime={formData.startTime || ''}
            endTime={formData.endTime || ''}
            onStartChange={(value) => handleTimeChange('startTime', value)}
            onEndChange={(value) => handleTimeChange('endTime', value)}
            activeField={activePicker === 'date' ? null : activePicker}
            onActiveFieldChange={setActivePicker}
            startLabel="上班"
            endLabel="下班"
            durations={SHIFT_DURATIONS}
          />
        </EditorField>

        <EditorField label="職稱／職位" required>
          <PillGroup
            ariaLabel="職稱／職位"
            value={formData.role || roles[0]?.id || 'assistant'}
            onChange={handleRoleChange}
            options={[
              // 原本的職稱若已被刪除仍保留選項，避免編輯舊班表時被無聲換成別的職稱
              ...(formData.role && !roles.some((role) => role.id === formData.role)
                ? [{ value: formData.role, label: `${getWorkRoleLabel(formData.role, roles, formData.roleName)}（已移除）` }]
                : []),
              ...roles.map((role) => ({ value: role.id, label: role.name, meta: `$${role.hourlyRate}` })),
            ]}
          />
        </EditorField>

        <EditorRow>
          <EditorField label="時薪 (NT$)" htmlFor="hourlyRate">
            <input
              id="hourlyRate"
              className={styles.control}
              type="number"
              inputMode="numeric"
              min="0"
              step="10"
              value={formData.hourlyRate ?? 200}
              onChange={(e) => setFormData((prev) => ({ ...prev, hourlyRate: Number(e.target.value) }))}
            />
          </EditorField>
          <EditorField label={selectedTemplate ? '計薪工時（依範本）' : '計薪工時（小時）'} htmlFor="workHours">
            <input
              id="workHours"
              className={styles.control}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={formData.workHours ?? 0}
              readOnly={Boolean(selectedTemplate)}
              onChange={(e) => setFormData((prev) => ({ ...prev, workHours: Number(e.target.value) }))}
            />
          </EditorField>
        </EditorRow>

        {/* 送出前先看到這班能賺多少，時薪或工時填錯時能立刻察覺 */}
        <div className={styles.summary} aria-live="polite">
          <span>{formData.workHours ?? 0} 小時 × ${formData.hourlyRate ?? 0}</span>
          <strong>預估 NT$ {estimatedPay.toLocaleString()}</strong>
        </div>

        <div className={styles.actions}>
          {mode === 'edit' && onDelete && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => handleDelete(requestClose)}
              disabled={isSubmitting}
            >
              🗑️ 刪除
            </button>
          )}
          <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={requestClose} disabled={isSubmitting}>
            取消
          </button>
          <button type="submit" className={`${styles.btn} ${styles.btnSave}`} disabled={isSubmitting}>
            {isSubmitting ? '儲存中...' : mode === 'add' ? '新增' : '儲存'}
          </button>
        </div>
      </form>} />
    </Modal>
  );
}
