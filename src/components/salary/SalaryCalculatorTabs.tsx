'use client';

import styles from './SalaryCalculatorTabs.module.css';

export type SalaryCalculatorTab = 'records' | 'analytics' | 'templates' | 'roles';

interface SalaryCalculatorTabsProps {
  activeTab: SalaryCalculatorTab;
  onChange: (tab: SalaryCalculatorTab) => void;
}

// 手機寬度放不下長標籤，另給短標籤；桌面仍顯示完整說明
const tabs: Array<{ value: SalaryCalculatorTab; label: string; short: string }> = [
  { value: 'records', label: '薪資明細與記帳', short: '明細記帳' },
  { value: 'analytics', label: '統計與趨勢分析', short: '統計趨勢' },
  { value: 'templates', label: '班別範本管理', short: '班別範本' },
  { value: 'roles', label: '職稱／職位與時薪', short: '職稱時薪' },
];

/** 薪資功能頁籤：膠囊分段樣式，選中的頁籤以實心鐵鏽紅標示，比底線式頁籤更好在手機上點擊。 */
export default function SalaryCalculatorTabs({ activeTab, onChange }: SalaryCalculatorTabsProps) {
  return (
    <div className={`no-print page-section-enter page-section-enter-delay-1 ${styles.tabs}`} role="tablist" aria-label="薪資功能">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => onChange(tab.value)}
          >
            <span className={styles.full}>{tab.label}</span>
            <span className={styles.short}>{tab.short}</span>
          </button>
        );
      })}
    </div>
  );
}
