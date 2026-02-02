/**
 * 遊戲攻略資料型別定義
 * 
 * 這個檔案定義了遊戲攻略系統的資料結構，
 * 支援動態新增/編輯攻略內容，並提供視覺化資訊層次。
 */

// 攻略分類類型
export type GuideCategory = '角色攻略' | '活動攻略' | '通用資源' | '角色養成' | '版本總覽';

// 遊戲攻略主要資料結構
export interface GameGuide {
  id: string;
  gameId: string;                  // 所屬遊戲 ID（對應 games.ts 的 Game.id）
  version?: string;                 // 所屬版本（如 "3.1"）
  title: string;                    // 攻略主題
  subtitle?: string;                // 副標題/說明
  url: string;                      // 攻略連結
  resonanceCode?: string;           // 共鳴譜分享碼（Base64 編碼）
  category: GuideCategory;          // 分類
  priority: number;                 // 重要性（1-5 星）
  tags: string[];                   // 自訂標籤
  completed: boolean;               // 是否已完成（共用進度）
  order: number;                    // 排序順序
  createdAt: string;                // 建立時間（ISO 8601）
  updatedAt: string;                // 更新時間（ISO 8601）
}

// 攻略分類選項（用於下拉選單）
export const GUIDE_CATEGORIES: GuideCategory[] = [
  '角色攻略',
  '活動攻略',
  '通用資源',
  '角色養成',
  '版本總覽'
];

// 常用標籤建議（用於快速選擇）
export const COMMON_TAGS = [
  '新手必看',
  '速刷指南',
  '配隊推薦',
  '機制解析',
  '資源規劃',
  '限時活動',
  '高難度',
  '養成路線'
];

// 標籤顏色配置（用於視覺化）
export const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  '新手必看': {
    bg: 'rgba(34, 197, 94, 0.15)',    // Green
    text: '#22C55E'
  },
  '速刷指南': {
    bg: 'rgba(245, 158, 11, 0.15)',   // Amber
    text: '#F59E0B'
  },
  '配隊推薦': {
    bg: 'rgba(59, 130, 246, 0.15)',   // Blue
    text: '#3B82F6'
  },
  '機制解析': {
    bg: 'rgba(139, 92, 246, 0.15)',   // Violet
    text: '#8B5CF6'
  },
  '資源規劃': {
    bg: 'rgba(236, 72, 153, 0.15)',   // Pink
    text: '#EC4899'
  },
  '限時活動': {
    bg: 'rgba(239, 68, 68, 0.15)',    // Red
    text: '#EF4444'
  },
  '高難度': {
    bg: 'rgba(251, 146, 60, 0.15)',   // Orange
    text: '#FB923C'
  },
  '養成路線': {
    bg: 'rgba(6, 182, 212, 0.15)',    // Cyan
    text: '#06B6D4'
  }
};

// 取得標籤顏色（如果不在預設清單中，使用預設灰色）
export const getTagColor = (tag: string): { bg: string; text: string } => {
  return TAG_COLORS[tag] || {
    bg: 'rgba(148, 163, 184, 0.15)',
    text: '#94A3B8'
  };
};

// 分類對應的顏色配置（用於視覺化）
export const CATEGORY_COLORS: Record<GuideCategory, { bg: string; text: string }> = {
  '角色攻略': {
    bg: 'rgba(8, 145, 178, 0.15)',    // Cyan
    text: 'var(--color-primary)'
  },
  '活動攻略': {
    bg: 'rgba(245, 158, 11, 0.15)',   // Amber
    text: 'var(--color-highlight)'
  },
  '通用資源': {
    bg: 'rgba(5, 150, 105, 0.15)',    // Emerald
    text: 'var(--color-accent)'
  },
  '角色養成': {
    bg: 'rgba(139, 92, 246, 0.15)',   // Violet
    text: '#8B5CF6'
  },
  '版本總覽': {
    bg: 'rgba(236, 72, 153, 0.15)',   // Pink
    text: '#EC4899'
  }
};

// 建立新攻略時的預設值
export const createDefaultGuide = (gameId: string, version?: string): Omit<GameGuide, 'id'> => {
  const now = new Date().toISOString();
  const guide: any = {
    gameId,
    title: '',
    url: '',
    category: '角色攻略',
    priority: 3,
    tags: [],
    completed: false,
    order: Date.now(), // 使用時間戳作為初始排序值
    createdAt: now,
    updatedAt: now
  };
  
  // 只有在有值時才加入選填欄位（避免 undefined）
  if (version) {
    guide.version = version;
  }
  
  return guide as Omit<GameGuide, 'id'>;
};

// 驗證攻略資料是否完整
export const validateGuide = (guide: Partial<GameGuide>): string[] => {
  const errors: string[] = [];
  
  if (!guide.title?.trim()) {
    errors.push('攻略主題不可為空');
  }
  
  if (!guide.url?.trim() && !guide.resonanceCode?.trim()) {
    errors.push('至少需要填寫攻略連結或共鳴譜代碼');
  }
  
  if (guide.url && !isValidUrl(guide.url)) {
    errors.push('攻略連結格式不正確');
  }
  
  if (guide.priority && (guide.priority < 1 || guide.priority > 5)) {
    errors.push('重要性必須在 1-5 之間');
  }
  
  return errors;
};

// URL 格式驗證
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
