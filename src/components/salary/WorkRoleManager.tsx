'use client';

import { useState } from 'react';
import { useConfirm } from '@/context/ConfirmContext';
import { useToast } from '@/context/ToastContext';
import type { WorkRole, WorkRoleInput } from '@/data/workRoles';
import styles from './WorkRoleManager.module.css';

interface WorkRoleManagerProps {
  roles: WorkRole[];
  loading: boolean;
  canEdit: boolean;
  onAddRole: (input: WorkRoleInput) => Promise<void>;
  onUpdateRole: (id: string, updates: Partial<WorkRoleInput>) => Promise<void>;
  onDeleteRole: (id: string) => Promise<void>;
}

interface RoleDraft {
  name: string;
  hourlyRate: string;
}

const EMPTY_DRAFT: RoleDraft = { name: '', hourlyRate: '200' };

/** 職稱／職位與時薪的後端資料管理介面。 */
export default function WorkRoleManager({
  roles,
  loading,
  canEdit,
  onAddRole,
  onUpdateRole,
  onDeleteRole,
}: WorkRoleManagerProps) {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [draft, setDraft] = useState<RoleDraft>(EMPTY_DRAFT);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setEditingRoleId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draft.name.trim();
    const hourlyRate = Number(draft.hourlyRate);

    if (!name) {
      toast.warning('職稱／職位名稱不可為空');
      return;
    }
    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
      toast.warning('請輸入大於 0 的時薪');
      return;
    }
    if (!canEdit) {
      toast.warning('目前沒有編輯職稱／職位的權限');
      return;
    }

    const duplicated = roles.some(
      (role) => role.id !== editingRoleId && role.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicated) {
      toast.warning('職稱／職位名稱不可重複');
      return;
    }

    setIsSaving(true);
    try {
      if (editingRoleId) {
        await onUpdateRole(editingRoleId, { name, hourlyRate });
        toast.success('已更新職稱／職位與時薪');
      } else {
        await onAddRole({ name, hourlyRate });
        toast.success('已新增職稱／職位');
      }
      resetDraft();
    } catch (error: unknown) {
      console.error('儲存職稱／職位失敗', error);
      toast.error('儲存職稱／職位失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (role: WorkRole) => {
    if (!canEdit) {
      toast.warning('目前沒有編輯職稱／職位的權限');
      return;
    }
    setEditingRoleId(role.id);
    setDraft({ name: role.name, hourlyRate: String(role.hourlyRate) });
  };

  const handleDelete = async (role: WorkRole) => {
    if (!canEdit) {
      toast.warning('目前沒有刪除職稱／職位的權限');
      return;
    }

    const confirmed = await confirm({
      title: '刪除職稱／職位',
      message: `確定要刪除「${role.name}」嗎？既有薪資記錄會保留，不會一併刪除。`,
      confirmText: '刪除',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await onDeleteRole(role.id);
      if (editingRoleId === role.id) resetDraft();
      toast.success(`已刪除職稱／職位「${role.name}」`);
    } catch (error: unknown) {
      console.error('刪除職稱／職位失敗', error);
      toast.error('刪除職稱／職位失敗，請稍後再試');
    }
  };

  return (
    <section className={`glass no-print ${styles.container}`} aria-labelledby="work-role-manager-title">
      <div className={styles.header}>
        <div>
          <h3 id="work-role-manager-title" className={styles.title}>職稱／職位與時薪管理</h3>
          <p className={styles.description}>這裡的職稱／職位會同步套用到薪資記錄與打工月曆。</p>
        </div>
        {loading && <span className={styles.loading}>載入中...</span>}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {editingRoleId && (
          <div className={styles.editingHint}>
            正在編輯：{roles.find((role) => role.id === editingRoleId)?.name || '職稱／職位'}
          </div>
        )}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="work-role-name">職稱／職位名稱</label>
          <input
            id="work-role-name"
            className={styles.input}
            type="text"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="例如：行政"
            disabled={!canEdit || isSaving}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="work-role-rate">時薪 (NT$)</label>
          <input
            id="work-role-rate"
            className={styles.input}
            type="number"
            min="1"
            step="1"
            value={draft.hourlyRate}
            onChange={(event) => setDraft((current) => ({ ...current, hourlyRate: event.target.value }))}
            disabled={!canEdit || isSaving}
          />
        </div>
        <div className={styles.buttonGroup}>
          {editingRoleId && (
            <button type="button" className={styles.cancelButton} onClick={resetDraft} disabled={isSaving}>
              取消編輯
            </button>
          )}
          <button type="submit" className={styles.saveButton} disabled={!canEdit || isSaving}>
            {isSaving ? '儲存中...' : editingRoleId ? '更新職稱／職位' : '新增職稱／職位'}
          </button>
        </div>
      </form>

      <div className={styles.roleList}>
        {!loading && roles.length === 0 && (
          <div className={styles.empty}>目前尚未建立職稱／職位，請先新增一個。</div>
        )}
        {roles.map((role) => (
          <div className={styles.roleRow} key={role.id}>
            <span className={styles.roleName}>{role.name}</span>
            <span className={styles.roleRate}>NT$ {role.hourlyRate.toLocaleString()} / 小時</span>
            <div className={styles.roleActions}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => handleStartEdit(role)}
                disabled={!canEdit || isSaving}
              >
                編輯
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => void handleDelete(role)}
                disabled={!canEdit || isSaving}
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
