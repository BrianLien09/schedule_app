'use client';

export type SalaryCalculatorTab = 'records' | 'analytics' | 'templates' | 'roles';

interface SalaryCalculatorTabsProps {
  activeTab: SalaryCalculatorTab;
  onChange: (tab: SalaryCalculatorTab) => void;
}

const tabs: Array<{ value: SalaryCalculatorTab; label: string }> = [
  { value: 'records', label: '薪資明細與記帳' },
  { value: 'analytics', label: '統計與趨勢分析' },
  { value: 'templates', label: '班別範本管理' },
  { value: 'roles', label: '職稱／職位與時薪' },
];

/** 薪資功能頁籤導覽，讓主協調元件不再承擔重複的按鈕樣式。 */
export default function SalaryCalculatorTabs({ activeTab, onChange }: SalaryCalculatorTabsProps) {
  return (
    <div
      className="no-print page-section-enter page-section-enter-delay-1"
      style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: 'var(--spacing-lg)',
        borderBottom: '2px solid rgba(220, 208, 194, 0.5)',
        paddingBottom: '0.25rem',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: isActive ? 'var(--color-primary)' : 'transparent',
              color: isActive ? '#f0ece1' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease, color 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
