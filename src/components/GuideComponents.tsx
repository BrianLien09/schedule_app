/**
 * 攻略卡片視覺化元件
 */

import { memo } from 'react';
import type { GameGuide, GuideCategory } from '@/data/gameGuides';
import { CATEGORY_COLORS, getTagColor } from '@/data/gameGuides';
import styles from './GuideComponents.module.css';

// ============================================================
// 分類標籤元件
// ============================================================

interface CategoryBadgeProps {
  category: GuideCategory;
}

const CategoryBadgeComponent = ({ category }: CategoryBadgeProps) => {
  const colors = CATEGORY_COLORS[category];

  return (
    <span
      className={styles.categoryBadge}
      style={{
        background: colors.bg,
        color: colors.text,
      }}
    >
      {category}
    </span>
  );
};

export const CategoryBadge = memo(CategoryBadgeComponent);
CategoryBadge.displayName = 'CategoryBadge';

// ============================================================
// 星級評分元件
// ============================================================

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const StarRatingComponent = ({ rating, interactive = false, onChange }: StarRatingProps) => {
  const handleClick = (star: number) => {
    if (interactive && onChange) {
      onChange(star);
    }
  };

  return (
    <div className={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? styles.starFilled : styles.starEmpty}
          onClick={() => handleClick(star)}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
          title={interactive ? `設定為 ${star} 星` : `${rating} 星評級`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export const StarRating = memo(StarRatingComponent);
StarRating.displayName = 'StarRating';

// ============================================================
// 進度條元件
// ============================================================

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
}

export function ProgressBar({ progress, showLabel = true }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={styles.progressBar}>
      <div className={styles.progressFill} style={{ width: `${clampedProgress}%` }} />
      {showLabel && <span className={styles.progressText}>{Math.round(clampedProgress)}% 完成</span>}
    </div>
  );
}

// ============================================================
// 標籤組元件
// ============================================================

interface TagListProps {
  tags: string[];
}

const TagListComponent = ({ tags }: TagListProps) => {
  if (tags.length === 0) return null;

  return (
    <div className={styles.tagList}>
      {tags.map((tag, idx) => {
        const colors = getTagColor(tag);
        return (
          <span
            key={idx}
            className={styles.tag}
            style={{
              background: colors.bg,
              color: colors.text,
              borderColor: colors.border,
            }}
          >
            {tag}
          </span>
        );
      })}
    </div>
  );
};

export const TagList = memo(TagListComponent);
TagList.displayName = 'TagList';

// ============================================================
// 完成標記元件
// ============================================================

interface CompletedOverlayProps {
  completed: boolean;
}

const CompletedOverlayComponent = ({ completed }: CompletedOverlayProps) => {
  if (!completed) return null;

  return (
    <div className={styles.completedOverlay}>
      <div className={styles.completedBadge}>✓ 已完成</div>
    </div>
  );
};

export const CompletedOverlay = memo(CompletedOverlayComponent);
CompletedOverlay.displayName = 'CompletedOverlay';

// ============================================================
// 攻略卡片完整元件
// ============================================================

interface GuideCardProps {
  guide: GameGuide;
  editMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const GuideCardComponent = ({
  guide,
  editMode = false,
  onEdit,
  onDelete,
}: GuideCardProps) => {
  const handleCopyResonanceCode = () => {
    if (guide.resonanceCode) {
      navigator.clipboard.writeText(guide.resonanceCode);
      alert(`已複製共鳴譜代碼：\n${guide.resonanceCode}`);
    }
  };

  return (
    <div className={styles.guideCard}>

      {/* 卡片頭部：分類標籤 + 星級 */}
      <div className={styles.cardHeader}>
        <CategoryBadge category={guide.category} />
        <StarRating rating={guide.priority} />
      </div>

      {/* 卡片內容 */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{guide.title}</h3>
        {guide.subtitle && <p className={styles.cardSubtitle}>{guide.subtitle}</p>}

        {/* 標籤列表 */}
        {guide.tags.length > 0 && <TagList tags={guide.tags} />}
      </div>

      {/* 卡片底部：操作按鈕 */}
      <div className={styles.cardFooter}>
        {/* 一般模式：查看連結 + 複製共鳴譜 */}
        {!editMode && (
          <>
            {guide.url && (
              <a
                href={guide.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnPrimary}
              >
                查看攻略 →
              </a>
            )}
            {guide.resonanceCode && (
              <button className={styles.btnSecondary} onClick={handleCopyResonanceCode}>
                📋 複製共鳴譜
              </button>
            )}
          </>
        )}

        {/* 編輯模式：編輯 + 刪除按鈕 */}
        {editMode && (
          <>
            <button className={styles.btnEdit} onClick={onEdit}>
              ✎ 編輯
            </button>
            <button className={styles.btnDelete} onClick={onDelete}>
              🗑️ 刪除
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const GuideCard = memo(GuideCardComponent);
GuideCard.displayName = 'GuideCard';
