'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAllowanceData } from '@/hooks/useAllowanceData';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import {
  AllowanceRecord,
  generateAllowanceId,
  calculateKongBalance,
  generateCopyText,
  formatDateForCopy,
} from '@/data/allowance';
import { StatCard } from '@/components/VisualComponents';
import { LoadingSpinner } from '@/components/Loading';
import styles from './AllowanceManager.module.css';

// ========== 子元件：來源類型標籤 ==========
// bgColor 為亮色模式下的半透明填充，讓 badge 在淺色背景上有層次感
const sourceTypeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  '生活費匯款': { icon: '🎓', color: 'var(--color-primary)',   bgColor: 'rgba(45, 212, 191, 0.15)' },
  '打工收入':   { icon: '💼', color: 'var(--color-accent)',    bgColor: 'rgba(52, 211, 153, 0.15)' },
  '獎學金':     { icon: '🏆', color: 'var(--color-highlight)', bgColor: 'rgba(251, 191, 36, 0.15)' },
  '退費':       { icon: '💸', color: 'var(--muted)',           bgColor: 'rgba(148, 163, 184, 0.12)' },
  '其他':       { icon: '📦', color: 'var(--muted-dark)',      bgColor: 'rgba(203, 213, 225, 0.12)' },
};

interface SourceTypeBadgeProps {
  type: string;
}

const SourceTypeBadge = ({ type }: SourceTypeBadgeProps) => {
  const config = sourceTypeConfig[type] || sourceTypeConfig['其他'];
  
  return (
    <div 
      className={styles.sourceBadge}
      style={{ borderColor: config.color, color: config.color, backgroundColor: config.bgColor }}
    >
      <span>{config.icon}</span>
      <span>{type}</span>
    </div>
  );
};

export default function AllowanceManager() {
  // ========== 資料層 ==========
  const {
    records,
    sourceTypes,
    loading,
    canEdit,
    addRecord,
    updateRecord,
    deleteRecord,
  } = useAllowanceData();

  const { toast } = useToast();
  const { confirm } = useConfirm();

  // ========== 新增記錄表單狀態 ==========
  const [currentRecord, setCurrentRecord] = useState<Omit<AllowanceRecord, 'id' | 'timestamp'>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    totalBalance: 0,
    xiaoBalance: 0,
    sourceType: sourceTypes[0] || '生活費匯款',
    note: '',
  });

  // ========== 編輯模態框狀態 ==========
  const [editingRecord, setEditingRecord] = useState<AllowanceRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // ========== 新增模態框狀態 ==========
  const [showAddModal, setShowAddModal] = useState(false);

  // ========== 月份篩選狀態 ==========
  // 預設顯示本月記錄
  const getCurrentMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  };
  
  const [filterMonth, setFilterMonth] = useState<string>(''); // 預設顯示全部月份
  const [customMonth, setCustomMonth] = useState<string>(''); // 自訂月份選擇器

  // ========== 快速篩選選項 ==========
  const quickFilters = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;
    const currentMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastYear = lastMonthDate.getFullYear();
    const lastMonthNum = lastMonthDate.getMonth() + 1;
    const lastMonth = `${lastYear}-${String(lastMonthNum).padStart(2, '0')}`;

    return [
      { label: '全部', value: '' },
      { label: '本月', value: currentMonth },
      { label: '上月', value: lastMonth },
    ];
  }, []);

  // ========== 處理自訂月份選擇 ==========
  const handleCustomMonthChange = (value: string) => {
    setCustomMonth(value);
    if (value) {
      setFilterMonth(value);
    }
  };

  // ========== 處理快速篩選按鈕點擊 ==========
  const handleQuickFilterClick = (value: string) => {
    setFilterMonth(value);
    setCustomMonth(''); // 清除自訂月份選擇器
  };

  // ========== 篩選後的記錄 ==========
  const filteredRecords = useMemo(() => {
    if (!filterMonth) return records;
    return records.filter(record => record.date.startsWith(filterMonth));
  }, [records, filterMonth]);

  // ========== 精簡模式狀態 ==========
  const [isExpanded, setIsExpanded] = useState(false);
  const displayLimit = 3;
  const displayedRecords = isExpanded ? filteredRecords : filteredRecords.slice(0, displayLimit);
  const hasMore = filteredRecords.length > displayLimit;

  // ========== 統計數據（根據篩選月份） ==========
  const stats = useMemo(() => {
    const monthRecords = filteredRecords;
    
    return {
      totalDeposit: monthRecords.reduce((sum, r) => sum + r.amount, 0),
      recordCount: monthRecords.length,
      currentBookBalance: records[0]?.totalBalance || 0,
      currentXiaoBalance: records[0]?.xiaoBalance || 0,
    };
  }, [filteredRecords, records]);

  // ========== 計算上個月數據（用於比較） ==========
  const lastMonthStats = useMemo(() => {
    if (!filterMonth) return null; // 「全部」模式不比較
    
    // 解析當前月份
    const [year, month] = filterMonth.split('-').map(Number);
    
    // 計算上個月
    const lastMonth = month === 1 ? 12 : month - 1;
    const lastYear = month === 1 ? year - 1 : year;
    const lastMonthStr = `${lastYear}-${String(lastMonth).padStart(2, '0')}`;
    
    // 篩選上個月的記錄
    const lastMonthRecords = records.filter(r => r.date.startsWith(lastMonthStr));
    
    return {
      totalDeposit: lastMonthRecords.reduce((sum, r) => sum + r.amount, 0),
      recordCount: lastMonthRecords.length
    };
  }, [records, filterMonth]);

  // ========== 計算與上月比較的變化 ==========
  const monthChange = useMemo(() => {
    if (!lastMonthStats || lastMonthStats.totalDeposit === 0) return null;
    
    const currentTotal = stats.totalDeposit;
    const lastTotal = lastMonthStats.totalDeposit;
    const changePercent = ((currentTotal - lastTotal) / lastTotal) * 100;
    
    return {
      percent: changePercent,
      isIncrease: changePercent > 0,
      arrow: changePercent > 0 ? '↗️' : changePercent < 0 ? '↘️' : '→'
    };
  }, [stats.totalDeposit, lastMonthStats]);

  // ========== 取得最新的小呆餘額 ==========
  const latestXiaoBalance = useMemo(() => {
    if (records.length === 0) return 0;
    return records[0].xiaoBalance; // records 已經按時間戳記排序
  }, [records]);

  // ========== 判斷是否為生活費匯款 ==========
  const isAllowanceType = (sourceType: string) => {
    return sourceType === '生活費匯款';
  };

  // ========== 自動計算小呆餘額（非生活費匯款） ==========
  const autoCalculateXiaoBalance = (amount: number) => {
    return latestXiaoBalance + amount;
  };

  // ========== 根據來源類型決定是否顯示孔呆餘額 ==========
  const shouldShowKongBalance = useMemo(() => {
    return isAllowanceType(currentRecord.sourceType);
  }, [currentRecord.sourceType]);

  // ========== 計算孔呆餘額（僅生活費匯款） ==========
  const kongBalance = useMemo(() => {
    if (!shouldShowKongBalance) return 0;
    return calculateKongBalance(currentRecord.totalBalance, currentRecord.xiaoBalance);
  }, [shouldShowKongBalance, currentRecord.totalBalance, currentRecord.xiaoBalance]);

  // ========== 編輯表單：判斷是否顯示孔呆餘額 ==========
  const editingShouldShowKongBalance = useMemo(() => {
    if (!editingRecord) return false;
    return isAllowanceType(editingRecord.sourceType);
  }, [editingRecord]);

  // ========== 當 records 首次載入後，初始化表單的小呆餘額 ==========
  useEffect(() => {
    // 只在首次有資料且來源類型為生活費匯款時執行
    if (!loading && records.length > 0 && currentRecord.amount === 0) {
      const isAllowance = isAllowanceType(currentRecord.sourceType);
      if (isAllowance && currentRecord.xiaoBalance === 0) {
        setCurrentRecord(prev => ({
          ...prev,
          xiaoBalance: records[0].xiaoBalance,
        }));
      }
    }
  }, [loading, records.length]); // 只監聽 loading 和 records 數量變化

  // ========== 計算孔呆餘額（編輯表單） ==========
  const editingKongBalance = useMemo(() => {
    if (!editingRecord || !editingShouldShowKongBalance) return 0;
    return calculateKongBalance(editingRecord.totalBalance, editingRecord.xiaoBalance);
  }, [editingRecord, editingShouldShowKongBalance]);

  // ========== 處理來源類型改變 ==========
  const handleSourceTypeChange = (sourceType: string) => {
    const isAllowance = isAllowanceType(sourceType);
    
    if (isAllowance) {
      // 生活費匯款：帶入上次的小呆餘額
      setCurrentRecord(prev => ({
        ...prev,
        sourceType,
        xiaoBalance: latestXiaoBalance,
      }));
    } else {
      // 其他來源：小呆餘額 = 上次小呆餘額 + 匯入金額
      const newXiaoBalance = autoCalculateXiaoBalance(currentRecord.amount);
      setCurrentRecord(prev => ({
        ...prev,
        sourceType,
        xiaoBalance: newXiaoBalance,
      }));
    }
  };

  // ========== 處理匯入金額改變（非生活費匯款時自動更新小呆餘額） ==========
  const handleAmountChange = (amount: number) => {
    if (!isAllowanceType(currentRecord.sourceType)) {
      // 非生活費匯款：自動計算小呆餘額
      const newXiaoBalance = autoCalculateXiaoBalance(amount);
      setCurrentRecord(prev => ({
        ...prev,
        amount,
        xiaoBalance: newXiaoBalance,
      }));
    } else {
      // 生活費匯款：只更新金額
      setCurrentRecord(prev => ({
        ...prev,
        amount,
      }));
    }
  };

  // ========== 表單驗證 ==========
  const validateForm = (data: Omit<AllowanceRecord, 'id' | 'timestamp'>): string | null => {
    if (!data.date) return '請選擇匯入日期';
    if (data.amount <= 0) return '匯入金額必須大於 0';
    if (data.totalBalance < 0) return '帳簿餘額不可為負數';
    if (data.xiaoBalance < 0) return '小呆餘額不可為負數';
    if (data.xiaoBalance > data.totalBalance) return '小呆餘額不可大於帳簿餘額';
    if (!data.sourceType) return '請選擇來源類型';
    return null;
  };

  // ========== 新增記錄 ==========
  const handleAdd = async () => {
    const error = validateForm(currentRecord);
    if (error) {
      toast.warning(error);
      return;
    }

    const newRecord: AllowanceRecord = {
      ...currentRecord,
      id: generateAllowanceId(),
      timestamp: Date.now(),
    };

    await addRecord(newRecord);

    // 重置表單（保留最新的小呆餘額作為預設值）
    const nextSourceType = sourceTypes[0] || '生活費匯款';
    const isNextAllowance = isAllowanceType(nextSourceType);
    
    setCurrentRecord({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      totalBalance: 0,
      xiaoBalance: isNextAllowance ? newRecord.xiaoBalance : 0,
      sourceType: nextSourceType,
      note: '',
    });

    // 關閉新增 Modal
    setShowAddModal(false);
    toast.success('記錄已新增');
  };

  // ========== 開啟新增模態框 ==========
  const handleOpenAddModal = () => {
    // 重置表單並帶入最新的小呆餘額
    const defaultSourceType = sourceTypes[0] || '生活費匯款';
    const isAllowance = isAllowanceType(defaultSourceType);
    
    setCurrentRecord({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      totalBalance: 0,
      xiaoBalance: isAllowance && records.length > 0 ? records[0].xiaoBalance : 0,
      sourceType: defaultSourceType,
      note: '',
    });
    
    setShowAddModal(true);
  };

  // ========== 開啟編輯模態框 ==========
  const handleEdit = (record: AllowanceRecord) => {
    setEditingRecord({ ...record });
    setShowEditModal(true);
  };

  // ========== 儲存編輯 ==========
  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    const error = validateForm(editingRecord);
    if (error) {
      toast.warning(error);
      return;
    }

    await updateRecord(editingRecord.id, editingRecord);
    setShowEditModal(false);
    setEditingRecord(null);
    toast.success('記錄已更新');
  };

  // ========== 刪除記錄 ==========
  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: '刪除記錄',
      message: '確定要刪除此記錄嗎？',
      confirmText: '刪除',
      danger: true,
    });
    if (!confirmed) return;

    await deleteRecord(id);
    toast.success('記錄已刪除');
  };

  // ========== 一鍵複製 ==========
  const handleCopy = async (record: AllowanceRecord) => {
    const text = generateCopyText(record);

    try {
      await navigator.clipboard.writeText(text);
      toast.info('已複製到剪貼簿');
    } catch (err) {
      toast.error('複製失敗，請手動選取文字');
    }
  };

  // ========== 載入中 ==========
  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 標題與新增按鈕 */}
      <div className={styles.header}>
        <h1 className={styles.title}>💰 生活費記錄</h1>
        {canEdit && (
          <button
            className={`${styles.btn} ${styles.btnPrimary} ${styles.addButton}`}
            onClick={handleOpenAddModal}
          >
            ➕ 新增記錄
          </button>
        )}
      </div>

      {/* 月份篩選 */}
      <div className={`glass ${styles.filterSection}`}>
        <div className={styles.filterLabel}>篩選月份</div>
        <div className={styles.filterButtons}>
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              className={`${styles.filterBtn} ${filterMonth === filter.value && !customMonth ? styles.active : ''}`}
              onClick={() => handleQuickFilterClick(filter.value)}
            >
              {filter.label}
            </button>
          ))}
          <input
            type="month"
            className={styles.monthPicker}
            value={customMonth}
            onChange={(e) => handleCustomMonthChange(e.target.value)}
            placeholder="選擇月份"
          />
        </div>
      </div>

      {/* 統計卡片區 */}
      {filteredRecords.length > 0 && (
        <div className={styles.statsGrid}>
          <StatCard
            icon={<span style={{ fontSize: '2rem' }}>💰</span>}
            label={filterMonth ? "本月累計" : "累計收入"}
            value={`${stats.totalDeposit.toLocaleString()}`}
            subtext={
              monthChange 
                ? `${monthChange.arrow} ${Math.abs(monthChange.percent).toFixed(1)}% vs 上月` 
                : `共 ${stats.recordCount} 筆`
            }
            color="var(--color-primary)"
          />
          <StatCard
            icon={<span style={{ fontSize: '2rem' }}>💳</span>}
            label="帳簿餘額"
            value={`${stats.currentBookBalance.toLocaleString()}`}
            subtext="當前總額"
            color="var(--color-accent)"
          />
          <StatCard
            icon={<span style={{ fontSize: '2rem' }}>🏦</span>}
            label="小呆餘額"
            value={`${stats.currentXiaoBalance.toLocaleString()}`}
            subtext="可用金額"
            color="var(--color-highlight)"
          />
        </div>
      )}

      {/* 記錄列表 */}
      <div className={styles.recordsList}>
        {filteredRecords.length === 0 ? (
          <div className="glass card">
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📭</div>
              <div className={styles.emptyStateTitle}>尚無記錄</div>
              <div className={styles.emptyStateSubtitle}>
                {filterMonth ? '此月份沒有任何記錄' : '開始新增你的第一筆生活費記錄吧'}
              </div>
            </div>
          </div>
        ) : (
          <>
            {displayedRecords.map((record, index) => {
              const recordKongBalance = calculateKongBalance(record.totalBalance, record.xiaoBalance);
              const recordIsAllowance = isAllowanceType(record.sourceType);
              return (
                <div 
                  key={record.id} 
                  className={`glass ${styles.recordCard}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* 來源類型標籤 */}
                  <SourceTypeBadge type={record.sourceType} />
                  
                  <div className={styles.recordHeader}>
                    <div className={styles.recordDate}>{formatDateForCopy(record.date)}</div>
                    <button
                      className={styles.copyButton}
                      onClick={() => handleCopy(record)}
                      title="複製此記錄"
                    >
                      📋 複製
                  </button>
                </div>

                {/* 匯入金額（突出顯示） */}
                <div className={styles.amountSection}>
                  <div className={styles.amountLabel}>匯入金額</div>
                  <div className={styles.amountValue}>
                    +{record.amount.toLocaleString()} 元
                  </div>
                </div>

                {/* 餘額資訊 */}
                <div className={styles.balanceGrid}>
                  <div className={styles.balanceItem}>
                    <div className={styles.balanceLabel}>帳簿餘額</div>
                    <div className={styles.balanceValue}>
                      {record.totalBalance.toLocaleString()} 元
                    </div>
                  </div>
                  
                  <div className={styles.balanceItem}>
                    <div className={styles.balanceLabel}>小呆餘額</div>
                    <div className={styles.balanceValue}>
                      {record.xiaoBalance.toLocaleString()} 元
                    </div>
                  </div>
                  
                  {recordIsAllowance && (
                    <div className={styles.balanceItem}>
                      <div className={styles.balanceLabel}>孔呆餘額</div>
                      <div className={styles.balanceValue}>
                        {recordKongBalance.toLocaleString()} 元
                      </div>
                    </div>
                  )}
                </div>

                {record.note && (
                  <div className={styles.recordNote}>
                    <strong>備註：</strong> {record.note}
                  </div>
                )}

                {canEdit && (
                  <div className={styles.recordActions}>
                    <button className={styles.btnEdit} onClick={() => handleEdit(record)}>
                      編輯
                    </button>
                    <button className={styles.btnDelete} onClick={() => handleDelete(record.id)}>
                      刪除
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* 查看更多按鈕 */}
          {hasMore && !isExpanded && (
            <button 
              className={`${styles.btn} ${styles.btnSecondary} ${styles.expandButton}`}
              onClick={() => setIsExpanded(true)}
            >
              查看全部 (共 {filteredRecords.length} 筆)
            </button>
          )}
          
          {isExpanded && (
            <button 
              className={`${styles.btn} ${styles.btnSecondary} ${styles.expandButton}`}
              onClick={() => setIsExpanded(false)}
            >
              收起記錄
            </button>
          )}
          </>
        )}
      </div>

      {/* 編輯模態框 */}
      {showEditModal && editingRecord && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={`glass ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>編輯記錄</h2>
              <button className={styles.closeButton} onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>匯入日期 *</label>
                <input
                  type="date"
                  className={styles.input}
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>匯入金額 (元) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={editingRecord.amount}
                  onChange={(e) => setEditingRecord({ ...editingRecord, amount: Number(e.target.value) })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>帳簿餘額 (元) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={editingRecord.totalBalance}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, totalBalance: Number(e.target.value) })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>小呆餘額 (元) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={editingRecord.xiaoBalance}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, xiaoBalance: Number(e.target.value) })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>孔呆餘額 (元)</label>
                <input
                  type="text"
                  className={`${styles.input} ${styles.readOnlyField}`}
                  value={editingKongBalance.toLocaleString()}
                  readOnly
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>來源類型 *</label>
                <select
                  className={styles.select}
                  value={editingRecord.sourceType}
                  onChange={(e) => setEditingRecord({ ...editingRecord, sourceType: e.target.value })}
                >
                  {sourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>備註</label>
              <textarea
                className={styles.textarea}
                value={editingRecord.note || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, note: e.target.value })}
              />
            </div>

            <div className={styles.formActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setShowEditModal(false)}
              >
                取消
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSaveEdit}>
                儲存變更
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增模態框 */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`glass ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>新增記錄</h2>
              <button className={styles.closeButton} onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>匯入日期 *</label>
                <input
                  type="date"
                  className={styles.input}
                  value={currentRecord.date}
                  onChange={(e) => setCurrentRecord({ ...currentRecord, date: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>匯入金額 (元) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={currentRecord.amount || ''}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>帳簿餘額 (元) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={currentRecord.totalBalance || ''}
                  onChange={(e) => setCurrentRecord({ ...currentRecord, totalBalance: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  小呆餘額 (元) * 
                  {!shouldShowKongBalance && <span className={styles.autoCalcHint}>（自動計算）</span>}
                </label>
                <input
                  type="number"
                  className={`${styles.input} ${!shouldShowKongBalance ? styles.readOnlyField : ''}`}
                  value={currentRecord.xiaoBalance || ''}
                  onChange={(e) => setCurrentRecord({ ...currentRecord, xiaoBalance: Number(e.target.value) })}
                  disabled={!shouldShowKongBalance}
                  readOnly={!shouldShowKongBalance}
                  placeholder="0"
                />
              </div>

              {shouldShowKongBalance && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>孔呆餘額 (元)</label>
                  <input
                    type="text"
                    className={`${styles.input} ${styles.readOnlyField}`}
                    value={kongBalance.toLocaleString()}
                    readOnly
                    disabled
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>來源類型 *</label>
                <select
                  className={styles.select}
                  value={currentRecord.sourceType}
                  onChange={(e) => handleSourceTypeChange(e.target.value)}
                >
                  {sourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1', marginTop: 'var(--spacing-md)' }}>
              <label className={styles.label}>備註</label>
              <textarea
                className={styles.textarea}
                value={currentRecord.note || ''}
                onChange={(e) => setCurrentRecord({ ...currentRecord, note: e.target.value })}
                placeholder="選填"
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAdd}>
                確認新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
