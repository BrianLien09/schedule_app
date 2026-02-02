/**
 * 攻略編輯表單元件
 */

import { useState, useEffect } from 'react';
import type { GameGuide } from '@/data/gameGuides';
import { GUIDE_CATEGORIES, COMMON_TAGS, createDefaultGuide, validateGuide } from '@/data/gameGuides';
import { StarRating } from './GuideComponents';
import { games } from '@/data/games';
import styles from './GuideEditForm.module.css';

interface GuideEditFormProps {
  guide?: GameGuide; // 如果傳入則為編輯模式，否則為新增模式
  gameId: string;
  version?: string;
  onSave: (guide: Omit<GameGuide, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export function GuideEditForm({ guide, gameId, version, onSave, onCancel }: GuideEditFormProps) {
  const [formData, setFormData] = useState<Omit<GameGuide, 'id'>>(
    guide || createDefaultGuide(gameId, version)
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 取得當前遊戲的可用版本
  const currentGame = games.find((g) => g.id === formData.gameId);
  const availableVersions = currentGame?.versions?.map((v) => v.version) || [];

  // 同步 gameId 和 version（當外部篩選器改變時）
  useEffect(() => {
    if (!guide) {
      setFormData((prev) => ({ ...prev, gameId, version }));
    }
  }, [gameId, version, guide]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證資料
    const validationErrors = validateGuide(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // 清理空字串（轉換為不包含該欄位）
    const cleanedData: any = { ...formData };
    
    // 移除空字串的選填欄位
    if (!cleanedData.subtitle?.trim()) {
      delete cleanedData.subtitle;
    }
    if (!cleanedData.resonanceCode?.trim()) {
      delete cleanedData.resonanceCode;
    }
    if (!cleanedData.version?.trim()) {
      delete cleanedData.version;
    }

    setSaving(true);
    try {
      await onSave(cleanedData);
      setErrors([]);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : '儲存失敗']);
    } finally {
      setSaving(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const handleAddCustomTag = () => {
    const customTag = prompt('輸入自訂標籤：');
    if (customTag && customTag.trim() && !formData.tags.includes(customTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, customTag.trim()],
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  return (
    <form className={styles.editForm} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <h3>{guide ? '編輯攻略' : '新增攻略'}</h3>
      </div>

      {/* 錯誤訊息 */}
      {errors.length > 0 && (
        <div className={styles.errorBox}>
          {errors.map((err, idx) => (
            <div key={idx}>• {err}</div>
          ))}
        </div>
      )}

      {/* 攻略主題 */}
      <div className={styles.formGroup}>
        <label>攻略主題 *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="例如：艾莉絲角色攻略"
          required
        />
      </div>

      {/* 副標題 */}
      <div className={styles.formGroup}>
        <label>副標題</label>
        <input
          type="text"
          value={formData.subtitle || ''}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          placeholder="選填，例如：輸出流配隊詳解"
        />
      </div>

      {/* 攻略連結 */}
      <div className={styles.formGroup}>
        <label>攻略連結</label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://example.com/guide"
        />
      </div>

      {/* 共鳴譜代碼 */}
      <div className={styles.formGroup}>
        <label>共鳴譜分享碼</label>
        <textarea
          value={formData.resonanceCode || ''}
          onChange={(e) => setFormData({ ...formData, resonanceCode: e.target.value })}
          placeholder="貼上 Base64 編碼的共鳴譜代碼（選填）"
          rows={3}
        />
        <small className={styles.hint}>用於遊戲內一鍵匯入配置</small>
      </div>

      {/* 分類選擇 */}
      <div className={styles.formGroup}>
        <label>攻略分類 *</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
          required
        >
          {GUIDE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 版本選擇 */}
      {availableVersions.length > 0 && (
        <div className={styles.formGroup}>
          <label>適用版本</label>
          <select
            value={formData.version || ''}
            onChange={(e) => setFormData({ ...formData, version: e.target.value || undefined })}
          >
            <option value="">不指定版本</option>
            {availableVersions.map((ver) => (
              <option key={ver} value={ver}>
                v{ver}
              </option>
            ))}
          </select>
          <small className={styles.hint}>選填，指定攻略適用的遊戲版本</small>
        </div>
      )}

      {/* 重要性星級 */}
      <div className={styles.formGroup}>
        <label>重要性</label>
        <StarRating
          rating={formData.priority}
          interactive
          onChange={(rating) => setFormData({ ...formData, priority: rating })}
        />
        <small className={styles.hint}>點擊星星設定 1-5 星評級</small>
      </div>

      {/* 標籤選擇 */}
      <div className={styles.formGroup}>
        <label>標籤</label>
        <div className={styles.tagSelector}>
          {COMMON_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`${styles.tagButton} ${formData.tags.includes(tag) ? styles.active : ''}`}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
          <button type="button" className={styles.tagButtonAdd} onClick={handleAddCustomTag}>
            + 自訂標籤
          </button>
        </div>

        {/* 已選標籤顯示 */}
        {formData.tags.length > 0 && (
          <div className={styles.selectedTags}>
            {formData.tags.map((tag) => (
              <span key={tag} className={styles.selectedTag}>
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className={styles.formActions}>
        <button type="submit" className={styles.btnSave} disabled={saving}>
          {saving ? '儲存中...' : '💾 儲存'}
        </button>
        <button type="button" className={styles.btnCancel} onClick={onCancel} disabled={saving}>
          取消
        </button>
      </div>
    </form>
  );
}
