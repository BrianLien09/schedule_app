'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useSalaryData, type SalaryRecord } from '@/hooks/useSalaryData';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { type WorkShift } from '@/data/schedule';
import { parseExcelFile, convertToExportFormat, type ImportValidation } from '@/utils/excelParser';

/** 身份類型 */
type RoleType = 'assistant' | 'instructor';

/** 身份時薪對應 */
const ROLE_HOURLY_RATES: Record<RoleType, number> = {
  assistant: 200,    // 助教
  instructor: 500,   // 講師
};

export default function SalaryCalculator() {
  const { shifts } = useScheduleData();
  const { 
    records, 
    loading: salaryLoading,
    addRecord, 
    updateRecord, 
    deleteRecord,
    batchAddRecords,
    batchUpdateRecords,
    batchDeleteRecords 
  } = useSalaryData();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  
  // URL 狀態管理
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [currentRecord, setCurrentRecord] = useState<Omit<SalaryRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    workHours: 8,
    role: 'assistant' as RoleType,
    hourlyRate: 200,
    shiftCategory: '',
  });
  
  // 新增記錄時的工作時數輔助欄位（小時）
  const [workHours, setWorkHours] = useState<string>('8');
  
  // 班別類別選項（可自由新增）
  const [shiftCategories, setShiftCategories] = useState<string[]>([
    '秋季班',
    '冬令營',
    '春季班',
    '夏令營',
    '寒假班',
    '暑假班',
  ]);
  
  // 月份篩選狀態（用於顯示記錄）
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const urlMonth = searchParams.get('month');
    // 驗證 URL 參數格式（YYYY-MM）
    if (urlMonth && /^\d{4}-\d{2}$/.test(urlMonth)) {
      return urlMonth;
    }
    // 預設使用當前月份（本地時間）
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  
  // 匯入月份選擇（獨立於篩選）
  const [importMonth, setImportMonth] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  
  const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
  const [editingWorkHours, setEditingWorkHours] = useState<string>(''); // 編輯時的工作時數
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStats, setShowStats] = useState(true); // 控制統計圖表顯示
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set()); // 批次選擇
  const [showBatchEditModal, setShowBatchEditModal] = useState(false);
  const [batchNewHourlyRate, setBatchNewHourlyRate] = useState<number>(200);
  
  // 批量編輯多欄位的狀態
  const [batchEditData, setBatchEditData] = useState({
    role: '' as '' | RoleType,
    startTime: '',
    endTime: '',
    workHours: '',
    shiftCategory: '',
  });
  const [isPrintMode, setIsPrintMode] = useState(false); // 列印模式
  const pdfContentRef = useRef<HTMLDivElement>(null);
  
  // Excel 匯入相關狀態
  const [showImportModal, setShowImportModal] = useState(false);
  const [importValidation, setImportValidation] = useState<ImportValidation | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showAllImportRecords, setShowAllImportRecords] = useState(false); // 控制是否顯示全部匯入記錄
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 同步 filterMonth 與 URL Search Params
   * 
   * 當 filterMonth 改變時，自動更新 URL，實現狀態持久化
   */
  useEffect(() => {
    const currentMonth = searchParams.get('month');
    
    // 只在 filterMonth 與 URL 不同步時才更新
    if (filterMonth && filterMonth !== currentMonth) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('month', filterMonth);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } else if (!filterMonth && currentMonth) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('month');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [filterMonth, pathname, router, searchParams]);

  /**
   * 更新月份篩選
   * 
   * @param month - YYYY-MM 格式的月份字串，空字串表示「全部」
   */
  const updateFilterMonth = (month: string) => {
    setFilterMonth(month);
  };

  /**
   * 篩選後的記錄（基於 filterMonth）
   * 
   * 使用 useMemo 優化效能，避免不必要的重複計算
   */
  const filteredRecords = useMemo(() => {
    if (!filterMonth) return records; // 「全部」選項
    return records.filter(record => record.date.startsWith(filterMonth));
  }, [records, filterMonth]);

  /**
   * 快速篩選選項
   */
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
      { label: '全部', value: '', description: '顯示所有記錄' },
      { label: '本月', value: currentMonth, description: '僅顯示本月記錄' },
      { label: '上月', value: lastMonth, description: '僅顯示上個月記錄' },
    ];
  }, []);

  /**
   * 根據開始時間和工作時數，自動計算結束時間
   * 
   * 邏輯：結束時間 = 開始時間 + 工作時數
   * 例如：09:00 + 8小時 = 17:00
   */
  const calculateEndTimeFromHours = (startTime: string, workHoursValue: number): string => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const totalMinutes = startMinutes + (workHoursValue * 60);
    
    const endHour = Math.floor(totalMinutes / 60);
    const endMin = totalMinutes % 60;
    
    return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
  };

  /**
   * 根據開始時間和結束時間，計算實際工作時數
   */
  const calculateWorkHoursFromTimes = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalMinutes = endMinutes - startMinutes;
    
    return Math.max(0, totalMinutes / 60);
  };

  /** 計算工作時數 (小時) - 直接使用記錄中的 workHours */
  const calculateHours = (record: Omit<SalaryRecord, 'id'>): number => {
    return record.workHours || 0;
  };

  /** 計算薪資 - 使用 workHours × hourlyRate */
  const calculatePay = (record: Omit<SalaryRecord, 'id'>): number => {
    return Math.round((record.workHours || 0) * record.hourlyRate);
  };

  /** 新增記錄 */
  const handleAddRecord = () => {
    // 從 workHours 字串轉換為數字
    const hours = parseFloat(workHours) || 0;
    
    const newRecord: SalaryRecord = {
      ...currentRecord,
      workHours: hours,
      id: Date.now().toString(),
    };
    addRecord(newRecord);
  };

  /** 刪除記錄 */
  const handleDeleteRecord = (id: string) => {
    deleteRecord(id);
  };

  /** 複製記錄 - 將資料填入新增表單 */
  const handleCopyRecord = (record: SalaryRecord) => {
    setCurrentRecord({
      date: record.date,
      startTime: record.startTime,
      endTime: record.endTime,
      workHours: record.workHours,
      role: record.role,
      hourlyRate: record.hourlyRate,
      shiftCategory: record.shiftCategory || '',
      workShiftId: record.workShiftId,
    });
    
    // 同步工作時數到輸入框
    setWorkHours(record.workHours.toString());
    
    // 先向下捲動一小段距離以觸發導航欄隱藏（如果導航欄顯示中）
    // Navbar 的隱藏邏輯：當 scrollY > lastScrollY 且 scrollY > 50 時隱藏
    const currentScrollY = window.scrollY;
    if (currentScrollY < 100) {
      // 如果當前在頂部附近，先向下捲動一點
      window.scrollTo({ top: 100, behavior: 'auto' });
    } else {
      // 否則向下捲動一小段距離觸發隱藏
      window.scrollBy({ top: 100, behavior: 'auto' });
    }
    
    // 等待導航欄隱藏動畫完成（transition: 0.5s），然後捲動到目標位置
    setTimeout(() => {
      const addRecordForm = document.getElementById('add-record-form');
      if (addRecordForm) {
        addRecordForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 600); // 比動畫時間稍長一點（0.5s + 0.1s 緩衝）
  };

  /**
   * 處理工作時數變更（獨立欄位，不影響時間段）
   */
  const handleWorkHoursChange = (newWorkHours: string) => {
    setWorkHours(newWorkHours);
  };

  /**
   * 處理開始時間變更（獨立欄位，不影響工作時數）
   */
  const handleStartTimeChange = (newStartTime: string) => {
    setCurrentRecord({
      ...currentRecord,
      startTime: newStartTime,
    });
  };

  /**
   * 處理結束時間變更（獨立欄位，不影響工作時數）
   */
  const handleEndTimeChange = (newEndTime: string) => {
    setCurrentRecord({
      ...currentRecord,
      endTime: newEndTime,
    });
  };

  /** 從打工班表匯入記錄（根據選擇的月份） */
  const handleImportFromWorkShifts = () => {
    // 找出尚未匯入的打工班表
    const existingWorkShiftIds = new Set(records.map(r => r.workShiftId).filter(Boolean));
    
    // 篩選指定月份的班表
    const [year, month] = importMonth.split('-').map(Number);
    const monthShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate.getFullYear() === year && 
             shiftDate.getMonth() + 1 === month &&
             !existingWorkShiftIds.has(shift.id);
    });

    if (monthShifts.length === 0) {
      toast.info(`${year} 年 ${month} 月沒有新的打工班表可匯入！`);
      return;
    }

    // 將打工班表轉換為薪資記錄
    const newRecords: SalaryRecord[] = monthShifts.map(shift => {
      // 根據時間段計算工作時數
      const hours = calculateWorkHoursFromTimes(shift.startTime, shift.endTime);
      
      return {
        id: `shift-${shift.id}-${Date.now()}`,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        workHours: hours,
        role: 'assistant' as RoleType, // 預設助教
        hourlyRate: 200, // 預設助教時薪
        shiftCategory: shift.note || '', // 使用班表的 note 作為班別
        workShiftId: shift.id,
      };
    });

    batchAddRecords(newRecords);
    toast.success(`成功匯入 ${newRecords.length} 筆 ${year} 年 ${month} 月的打工記錄！`);
  };

  /** 取得顯示的班別名稱 */
  const getDisplayShiftName = (record: SalaryRecord): string => {
    if (record.shiftCategory) return record.shiftCategory;
    // 向後相容：若有 workShiftId，從班表取得 note
    if (record.workShiftId) {
      const shift = shifts.find(s => s.id === record.workShiftId);
      return shift?.note || '-';
    }
    return '-';
  };

  /** 開啟編輯模式 */
  const handleEditRecord = (record: SalaryRecord) => {
    setEditingRecord({ ...record });
    // 同步工作時數到輸入框
    setEditingWorkHours(record.workHours.toString());
    setShowEditModal(true);
  };

  /**
   * 處理編輯時的工作時數變更（獨立欄位）
   */
  const handleEditWorkHoursChange = (newWorkHours: string) => {
    setEditingWorkHours(newWorkHours);
  };

  /**
   * 處理編輯時的開始時間變更（獨立欄位）
   */
  const handleEditStartTimeChange = (newStartTime: string) => {
    if (!editingRecord) return;
    
    setEditingRecord({
      ...editingRecord,
      startTime: newStartTime,
    });
  };

  /**
   * 處理編輯時的結束時間變更（獨立欄位）
   */
  const handleEditEndTimeChange = (newEndTime: string) => {
    if (!editingRecord) return;
    
    setEditingRecord({
      ...editingRecord,
      endTime: newEndTime,
    });
  };

  /** 儲存編輯 */
  const handleSaveEdit = () => {
    if (!editingRecord) return;
    
    // 從字串轉換工作時數
    const hours = parseFloat(editingWorkHours) || 0;
    
    updateRecord(editingRecord.id, {
      ...editingRecord,
      workHours: hours,
    });
    setShowEditModal(false);
    setEditingRecord(null);
  };

  /** 取消編輯 */
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingRecord(null);
  };

  /** 切換記錄的選擇狀態 */
  const toggleRecordSelection = (id: string) => {
    const newSelection = new Set(selectedRecordIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRecordIds(newSelection);
  };

  /** 全選/取消全選（只針對篩選後的記錄） */
  const toggleSelectAll = () => {
    if (selectedRecordIds.size === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  /** 開啟批次編輯模式 */
  const handleOpenBatchEdit = () => {
    if (selectedRecordIds.size === 0) {
      toast.warning('請先選擇要編輯的記錄！');
      return;
    }
    // 重置批量編輯狀態
    setBatchNewHourlyRate(200);
    setBatchEditData({
      role: '',
      startTime: '',
      endTime: '',
      workHours: '',
      shiftCategory: '',
    });
    setShowBatchEditModal(true);
  };

  /** 執行批次編輯 */
  const handleBatchEditHourlyRate = () => {
    // 收集要更新的欄位
    const updateData: Partial<SalaryRecord> = {};
    
    // 時薪
    if (batchNewHourlyRate > 0) {
      updateData.hourlyRate = batchNewHourlyRate;
    }
    
    // 身份
    if (batchEditData.role) {
      updateData.role = batchEditData.role;
      // 根據身份自動更新時薪（如果使用者沒有手動修改時薪）
      if (batchNewHourlyRate === 200) {
        updateData.hourlyRate = batchEditData.role === 'assistant' ? 200 : 350;
      }
    }
    
    // 開始時間
    if (batchEditData.startTime) {
      updateData.startTime = batchEditData.startTime;
    }
    
    // 結束時間
    if (batchEditData.endTime) {
      updateData.endTime = batchEditData.endTime;
    }
    
    // 工作時數：直接批次更新（完全獨立）
    if (batchEditData.workHours) {
      const hours = parseFloat(batchEditData.workHours);
      if (!isNaN(hours) && hours > 0) {
        updateData.workHours = hours;
      }
    }
    
    // 休息時間已改為智慧推算，不再允許批次編輯
    
    // 班別
    if (batchEditData.shiftCategory) {
      updateData.shiftCategory = batchEditData.shiftCategory;
    }
    
    // 檢查是否至少有一個欄位要更新
    if (Object.keys(updateData).length === 0) {
      toast.warning('請至少填寫一個要修改的欄位！');
      return;
    }

    const updates = Array.from(selectedRecordIds).map(id => ({
      id,
      data: updateData
    }));
    
    batchUpdateRecords(updates);

    setShowBatchEditModal(false);
    setSelectedRecordIds(new Set());
    
    // 產生更新訊息
    const updatedFields = [];
    if (updateData.hourlyRate) updatedFields.push('時薪');
    if (updateData.role) updatedFields.push('身份');
    if (updateData.startTime) updatedFields.push('開始時間');
    if (updateData.endTime) updatedFields.push('結束時間');
    if (updateData.workHours) updatedFields.push('工作時數');
    if (updateData.shiftCategory) updatedFields.push('班別');
    
    toast.success(`已成功更新 ${selectedRecordIds.size} 筆記錄的 ${updatedFields.join('、')}！`);
  };

  /** 取消批次編輯 */
  const handleCancelBatchEdit = () => {
    setShowBatchEditModal(false);
    setBatchNewHourlyRate(200);
    setBatchEditData({
      role: '',
      startTime: '',
      endTime: '',
      workHours: '',
      shiftCategory: '',
    });
  };

  /** 批量刪除 */
  const handleBatchDelete = async () => {
    if (selectedRecordIds.size === 0) {
      toast.warning('請先選擇要刪除的記錄！');
      return;
    }

    const confirmed = await confirm({
      title: '刪除記錄',
      message: `確定要刪除 ${selectedRecordIds.size} 筆記錄嗎？此操作無法復原！`,
      confirmText: '刪除',
      danger: true,
    });
    if (!confirmed) return;

    batchDeleteRecords(Array.from(selectedRecordIds));
    setSelectedRecordIds(new Set());
  };

  /** 開啟列印預覽 */
  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  /** 計算總薪資（基於篩選後的記錄） */
  const totalPay = useMemo(() => {
    return filteredRecords.reduce((sum, record) => {
      return sum + calculatePay(record);
    }, 0);
  }, [filteredRecords]);

  /** 計算總工時（基於篩選後的記錄） */
  const totalHours = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + calculateHours(r), 0);
  }, [filteredRecords]);

  /** 計算平均時薪（基於篩選後的記錄） */
  const avgHourlyRate = useMemo(() => {
    if (totalHours === 0) return 0;
    return Math.round(totalPay / totalHours);
  }, [totalPay, totalHours]);

  /** 計算月度統計資料 */
  interface MonthStats {
    month: string; // YYYY-MM
    totalPay: number;
    totalHours: number;
    recordCount: number;
  }

  /**
   * 計算月度統計資料
   * 
   * 以本月為起點，往前推 5 個月（共 6 個月）的趨勢
   * 即使某些月份沒有記錄也會顯示（數值為 0）
   */
  const getMonthlyStats = (): MonthStats[] => {
    // 先收集所有記錄的統計資料
    const statsMap = new Map<string, MonthStats>();

    records.forEach(record => {
      const month = record.date.slice(0, 7); // 取 YYYY-MM
      const pay = calculatePay(record);
      const hours = calculateHours(record);

      if (!statsMap.has(month)) {
        statsMap.set(month, {
          month,
          totalPay: 0,
          totalHours: 0,
          recordCount: 0,
        });
      }

      const stats = statsMap.get(month)!;
      stats.totalPay += pay;
      stats.totalHours += hours;
      stats.recordCount += 1;
    });

    // 生成從本月往前推 5 個月的月份列表（共 6 個月）
    const today = new Date();
    const monthsList: string[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;
      monthsList.push(monthStr);
    }

    // 組合 6 個月的統計資料（沒有記錄的月份顯示 0）
    return monthsList.map(month => {
      return statsMap.get(month) || {
        month,
        totalPay: 0,
        totalHours: 0,
        recordCount: 0,
      };
    });
  };

  const monthlyStats = getMonthlyStats();
  const maxMonthlyPay = Math.max(...monthlyStats.map(s => s.totalPay), 1); // 避免除以0

  /** 匯出 Excel（基於篩選後的記錄，使用統一格式） */
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      toast.warning('沒有可匯出的記錄！');
      return;
    }

    // 使用統一格式：打工日期 | 工作內容 | 工作時長 (時) | 時薪($) | 應得薪資($)
    const exportData = filteredRecords.map(record => convertToExportFormat(record));

    // 加入總計行
    const totalWorkHours = exportData.reduce((sum, row) => sum + row['工作時長 (時)'], 0);
    const totalPaySum = exportData.reduce((sum, row) => sum + row['應得薪資($)'], 0);
    
    exportData.push({
      '打工日期': '',
      '工作內容': '',
      '工作時長 (時)': totalWorkHours,
      '時薪($)': 0,
      '應得薪資($)': totalPaySum,
    } as any);

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '薪資明細');
    
    const monthStr = filterMonth || '全部';
    const fileName = `薪資表_${monthStr}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  /** 處理檔案選擇 */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 檢查檔案類型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.warning('請選擇 Excel 檔案（.xlsx 或 .xls）');
      return;
    }

    setIsImporting(true);
    try {
      const validation = await parseExcelFile(file);
      setImportValidation(validation);
      setShowImportModal(true);
    } catch (error) {
      console.error('檔案解析錯誤:', error);
      toast.error('檔案解析失敗，請確認檔案格式是否正確');
    } finally {
      setIsImporting(false);
      // 清空 input，允許重複選擇同一檔案
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /** 確認匯入 */
  const handleConfirmImport = async () => {
    if (!importValidation || !importValidation.success) {
      toast.warning('無有效資料可匯入');
      return;
    }

    try {
      // 檢查重複日期
      const existingDates = new Set(records.map(r => r.date));
      const recordsToImport = importValidation.records.filter(record => {
        return !existingDates.has(record.date);
      });

      const duplicateCount = importValidation.records.length - recordsToImport.length;

      if (recordsToImport.length === 0) {
        toast.info('所有記錄的日期都已存在於資料庫中，沒有新記錄可匯入！');
        return;
      }

      // 匯入不重複的記錄
      await batchAddRecords(recordsToImport);
      
      let message = `成功匯入 ${recordsToImport.length} 筆記錄！`;
      if (duplicateCount > 0) {
        message += `\n已跳過 ${duplicateCount} 筆重複日期的記錄。`;
      }
      
      toast.success(message);
      setShowImportModal(false);
      setImportValidation(null);
      setShowAllImportRecords(false); // 重置顯示狀態
    } catch (error) {
      console.error('匯入失敗:', error);
      toast.error('匯入失敗，請稍後再試');
    }
  };

  /** 取消匯入 */
  const handleCancelImport = () => {
    setShowImportModal(false);
    setImportValidation(null);
    setShowAllImportRecords(false); // 重置顯示狀態
  };

  /** 觸發檔案選擇 */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /** 匯出 PDF - 使用 html2canvas（基於篩選後的記錄） */
  const handleExportPDF = async () => {
    if (!pdfContentRef.current || filteredRecords.length === 0) {
      toast.warning('沒有可匯出的記錄！');
      return;
    }

    try {
      // 使用 html2canvas 截圖表格
      const canvas = await html2canvas(pdfContentRef.current, {
        scale: 2,
        backgroundColor: '#1a1a2e',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 留 10mm 邊距
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      // 添加第一頁
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      // 如果內容超過一頁，自動分頁
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      const fileName = `薪資報表_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF 生成失敗:', error);
      toast.error('PDF 生成失敗，請稍後再試！');
    }
  };

  return (
    <>
      {/* 列印專用 CSS */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          
          nav, .no-print {
            display: none !important;
          }

          .print-friendly {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }

          .print-friendly h2,
          .print-friendly h3,
          .print-friendly th {
            color: black !important;
            background: none !important;
            -webkit-text-fill-color: unset !important;
          }

          .print-friendly table {
            border: 1px solid #333 !important;
          }

          .print-friendly th {
            background: #f0f0f0 !important;
            border: 1px solid #333 !important;
          }

          .print-friendly td {
            border: 1px solid #ddd !important;
            color: black !important;
          }

          .print-friendly tfoot td {
            border-top: 2px solid #333 !important;
            background: #f9f9f9 !important;
          }

          @page {
            margin: 1cm;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }} className={isPrintMode ? 'print-friendly' : ''}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: 'var(--spacing-lg)',
          background: isPrintMode ? 'none' : 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
          WebkitBackgroundClip: isPrintMode ? 'unset' : 'text',
          WebkitTextFillColor: isPrintMode ? 'black' : 'transparent',
          color: isPrintMode ? 'black' : 'inherit',
        }}>
        薪資計算器
      </h2>

      {/* 列印模式：報表資訊 */}
      {isPrintMode && (
        <div style={{
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '2px solid #333',
          borderRadius: '8px',
          background: '#f9f9f9',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '700',
              color: 'black',
              marginBottom: '1rem',
            }}>
              薪資報表
            </h3>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            fontSize: '0.95rem',
            color: 'black',
          }}>
            <div><strong>生成日期：</strong>{new Date().toLocaleDateString('zh-TW')}</div>
            <div><strong>記錄總數：</strong>{filteredRecords.length} 筆</div>
            <div><strong>總工時：</strong>{totalHours.toFixed(1)} 小時</div>
            <div><strong>總計薪資：</strong>${totalPay.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* 統計圖表區域 */}
      {records.length > 0 && monthlyStats.length > 0 && (
        <div className="glass no-print" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>
              薪資統計
            </h3>
            <button
              onClick={() => setShowStats(!showStats)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#a855f7',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.9rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
              }}
            >
              {showStats ? '隱藏圖表' : '顯示圖表'}
            </button>
          </div>

          {showStats && (
            <>
              {/* 總覽卡片 */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    總收入
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                    ${totalPay.toLocaleString()}
                  </div>
                </div>

                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    總工時
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-secondary)' }}>
                    {totalHours.toFixed(1)}h
                  </div>
                </div>

                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.05))',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    平均時薪
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#34d399' }}>
                    ${avgHourlyRate}
                  </div>
                </div>

                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    工作天數
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fbbf24' }}>
                    {filteredRecords.length} 天
                  </div>
                </div>
              </div>

              {/* 月度趨勢圖表 */}
              <div>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  marginBottom: 'var(--spacing-md)',
                  color: 'var(--text-secondary)'
                }}>
                  月度收入趨勢（最近 6 個月）
                </h4>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  justifyContent: 'space-around',
                  gap: '1.5rem',
                  height: '280px',
                  padding: '1rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative',
                }}>
                  {monthlyStats.map((stat) => {
                    const heightPercent = (stat.totalPay / maxMonthlyPay) * 100;
                    const barHeight = Math.max(heightPercent, 5); // 最小高度 5%
                    const [year, month] = stat.month.split('-');
                    
                    // 當數值為 0 時，標籤顯示在長條圖上方而不是被擋住
                    const labelTop = stat.totalPay === 0 
                      ? 'calc(100% - 50px)' // 固定位置在長條圖上方
                      : `${100 - barHeight - 12}%`; // 正常位置
                    
                    return (
                      <div 
                        key={stat.month}
                        style={{
                          flex: 1,
                          maxWidth: '100px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: '100%',
                          position: 'relative',
                        }}
                      >
                        {/* 數值標籤 - 絕對定位在長條上方 */}
                        <div style={{
                          position: 'absolute',
                          top: labelTop,
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: stat.totalPay === 0 ? 'var(--text-secondary)' : 'var(--color-primary)',
                          whiteSpace: 'nowrap',
                          transform: 'translateY(-100%)',
                          opacity: stat.totalPay === 0 ? 0.6 : 1,
                        }}>
                          ${(stat.totalPay / 1000).toFixed(1)}k
                        </div>
                        
                        {/* 佔位空間 - 推動長條圖到底部 */}
                        <div style={{ flex: 1 }}></div>
                        
                        {/* 長條圖 */}
                        <div
                          style={{
                            width: '100%',
                            height: `${barHeight}%`,
                            minHeight: '20px',
                            background: 'linear-gradient(to top, var(--color-primary), var(--color-secondary))',
                            borderRadius: '8px 8px 0 0',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            boxShadow: '0 -4px 12px rgba(139, 92, 246, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.filter = 'brightness(1.2)';
                            e.currentTarget.style.transform = 'scaleY(1.05) translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'brightness(1)';
                            e.currentTarget.style.transform = 'scaleY(1) translateY(0)';
                          }}
                          title={`${stat.month}: $${stat.totalPay.toLocaleString()} (${stat.totalHours.toFixed(1)}h, ${stat.recordCount}天)`}
                        />
                        
                        {/* 月份標籤 */}
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          textAlign: 'center',
                          marginTop: '0.75rem',
                        }}>
                          {month}月
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 圖例說明 */}
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                }}>
                  <span>💡 提示：將滑鼠移至長條上可查看詳細資訊</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 新增記錄表單 */}
      <div id="add-record-form" className="glass no-print" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>
            新增工作記錄
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              匯入月份：
            </label>
            <input 
              type="month"
              value={importMonth}
              onChange={(e) => setImportMonth(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
            <button
              onClick={handleImportFromWorkShifts}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(168, 85, 247, 0.2)',
                color: '#a855f7',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.9rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              從打工月曆匯入
            </button>
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-md)'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              日期
            </label>
            <input 
              type="date"
              value={currentRecord.date}
              onChange={(e) => setCurrentRecord({ ...currentRecord, date: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              身份
            </label>
            <select
              value={currentRecord.role}
              onChange={(e) => {
                const newRole = e.target.value as RoleType;
                setCurrentRecord({ 
                  ...currentRecord, 
                  role: newRole,
                  hourlyRate: ROLE_HOURLY_RATES[newRole],
                });
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <option value="assistant" style={{ background: '#1a1a2e', color: 'white' }}>助教 ($200/hr)</option>
              <option value="instructor" style={{ background: '#1a1a2e', color: 'white' }}>講師 ($500/hr)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              開始時間
            </label>
            <input 
              type="time"
              value={currentRecord.startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              結束時間
            </label>
            <input 
              type="time"
              value={currentRecord.endTime}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              工作時數 (小時)
            </label>
            <input 
              type="number"
              step="0.5"
              min="0"
              value={workHours}
              onChange={(e) => handleWorkHoursChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
              }}
              placeholder="例：8"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              時薪 (元)
            </label>
            <input 
              type="number"
              value={currentRecord.hourlyRate}
              onChange={(e) => setCurrentRecord({ ...currentRecord, hourlyRate: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              班別 (選填)
            </label>
            <select
              value={currentRecord.shiftCategory || ''}
              onChange={(e) => setCurrentRecord({ ...currentRecord, shiftCategory: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <option value="" style={{ background: '#1a1a2e', color: 'white' }}>-- 無班別 --</option>
              {shiftCategories.map((category) => (
                <option key={category} value={category} style={{ background: '#1a1a2e', color: 'white' }}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleAddRecord}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s, opacity 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          新增記錄
        </button>
      </div>

      {/* 記錄列表 */}
      {records.length > 0 && (
        <div className="glass" style={{ 
          padding: 'var(--spacing-lg)', 
          marginBottom: 'var(--spacing-lg)',
          background: isPrintMode ? 'white' : undefined,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>
              工作記錄
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {selectedRecordIds.size > 0 && (
                <>
                  <button
                    onClick={handleOpenBatchEdit}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(251, 191, 36, 0.2)',
                      color: '#fbbf24',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(251, 191, 36, 0.3)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    批次編輯 ({selectedRecordIds.size})
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    批量刪除 ({selectedRecordIds.size})
                  </button>
                  <button
                    onClick={() => setSelectedRecordIds(new Set())}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(100, 116, 139, 0.2)',
                      color: '#94a3b8',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(100, 116, 139, 0.3)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(100, 116, 139, 0.2)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    取消選擇
                  </button>
                </>
              )}
              <button
                onClick={handlePrint}
                className="no-print"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#a855f7',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                列印
              </button>
              <button
                onClick={handleExportPDF}
                className="no-print"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                匯出 PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="no-print"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(52, 211, 153, 0.2)',
                  color: '#34d399',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 211, 153, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 211, 153, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                匯出 Excel
              </button>
              
              {/* 匯入 Excel 按鈕 */}
              <button
                onClick={handleImportClick}
                className="no-print"
                disabled={isImporting}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isImporting ? 'rgba(156, 163, 175, 0.2)' : 'rgba(96, 165, 250, 0.2)',
                  color: isImporting ? '#9ca3af' : '#60a5fa',
                  fontWeight: '600',
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isImporting) {
                    e.currentTarget.style.background = 'rgba(96, 165, 250, 0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isImporting) {
                    e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isImporting ? '解析中...' : '匯入 Excel'}
              </button>
              
              {/* 隱藏的檔案輸入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* 月份篩選器 */}
          <div className="no-print" style={{ 
            display: 'flex', 
            gap: 'var(--spacing-md)', 
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {/* 快速選項按鈕 */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {quickFilters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => updateFilterMonth(filter.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: filterMonth === filter.value 
                      ? '2px solid var(--color-primary)' 
                      : '1px solid rgba(255,255,255,0.2)',
                    background: filterMonth === filter.value 
                      ? 'rgba(139, 92, 246, 0.3)' 
                      : 'rgba(255,255,255,0.05)',
                    color: filterMonth === filter.value 
                      ? 'var(--color-primary)' 
                      : 'var(--text-secondary)',
                    fontWeight: filterMonth === filter.value ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem',
                  }}
                  onMouseEnter={(e) => {
                    if (filterMonth !== filter.value) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filterMonth !== filter.value) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }
                  }}
                  title={filter.description}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* 月份選擇器 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                自訂月份：
              </label>
              <input 
                type="month"
                value={filterMonth || ''}
                onChange={(e) => updateFilterMonth(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* 計數顯示 */}
            <div style={{ 
              marginLeft: 'auto',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              fontWeight: '600',
            }}>
              顯示：
              <span style={{ color: 'var(--color-primary)', marginLeft: '0.25rem', fontSize: '1.1rem' }}>
                {filteredRecords.length}
              </span>
              {filterMonth && (
                <span style={{ opacity: 0.6 }}>
                  {' '} / {records.length} 筆
                </span>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.95rem',
              border: isPrintMode ? '1px solid #333' : 'none',
            }}>
              <thead>
                <tr style={{ 
                  borderBottom: isPrintMode ? '2px solid #333' : '2px solid rgba(255,255,255,0.1)',
                  background: isPrintMode ? '#f0f0f0' : 'rgba(255,255,255,0.05)',
                }}>
                  {!isPrintMode && (
                    <th style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center', 
                      width: '50px',
                      border: isPrintMode ? '1px solid #333' : 'none',
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedRecordIds.size === filteredRecords.length && filteredRecords.length > 0}
                        onChange={toggleSelectAll}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: 'var(--color-primary)',
                        }}
                        title="全選/取消全選"
                      />
                    </th>
                  )}
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'left',
                    border: isPrintMode ? '1px solid #333' : 'none',
                    color: isPrintMode ? 'black' : 'inherit',
                  }}>日期</th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'left',
                    border: isPrintMode ? '1px solid #333' : 'none',
                    color: isPrintMode ? 'black' : 'inherit',
                  }}>身份</th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'left',
                    border: isPrintMode ? '1px solid #333' : 'none',
                    color: isPrintMode ? 'black' : 'inherit',
                  }}>班別</th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'left',
                    border: isPrintMode ? '1px solid #333' : 'none',
                    color: isPrintMode ? 'black' : 'inherit',
                  }}>時間</th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'center',
                    border: isPrintMode ? '1px solid #333' : 'none',
                    color: isPrintMode ? 'black' : 'inherit',
                  }}>工時</th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right',
                    border: isPrintMode ? '1px solid #333' : 'none',
                    color: isPrintMode ? 'black' : 'inherit',
                  }}>時薪</th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right',
                    border: isPrintMode ? '1px solid #333' : 'none',
                    color: isPrintMode ? 'black' : 'inherit',
                  }}>薪資</th>
                  {!isPrintMode && (
                    <th style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      border: isPrintMode ? '1px solid #333' : 'none',
                      color: isPrintMode ? 'black' : 'inherit',
                    }}>操作</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {[...filteredRecords]
                  .sort((a, b) => {
                    // 先按日期排序（舊到新）
                    const dateCompare = a.date.localeCompare(b.date);
                    if (dateCompare !== 0) return dateCompare;
                    // 日期相同則按開始時間排序（早到晚）
                    return a.startTime.localeCompare(b.startTime);
                  })
                  .map((record) => {
                  const displayShiftName = getDisplayShiftName(record);
                  const isSelected = selectedRecordIds.has(record.id);
                  return (
                    <tr 
                      key={record.id} 
                      style={{ 
                        borderBottom: isPrintMode ? '1px solid #ddd' : '1px solid rgba(255,255,255,0.05)',
                        background: isPrintMode ? 'white' : (isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent'),
                        transition: 'background 0.2s',
                      }}
                    >
                      {!isPrintMode && (
                        <td style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          border: isPrintMode ? '1px solid #ddd' : 'none',
                        }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRecordSelection(record.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: 'var(--color-primary)',
                            }}
                          />
                        </td>
                      )}
                      <td style={{ 
                        padding: '0.75rem',
                        border: isPrintMode ? '1px solid #ddd' : 'none',
                        color: isPrintMode ? 'black' : 'inherit',
                      }}>{record.date}</td>
                      <td style={{ 
                        padding: '0.75rem',
                        border: isPrintMode ? '1px solid #ddd' : 'none',
                        color: isPrintMode ? 'black' : 'inherit',
                      }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          background: isPrintMode ? 'transparent' : (record.role === 'instructor' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(6, 182, 212, 0.2)'),
                          color: isPrintMode ? 'black' : (record.role === 'instructor' ? '#fbbf24' : '#06b6d4'),
                          fontSize: '0.85rem',
                          fontWeight: '600',
                        }}>
                          {record.role === 'instructor' ? '講師' : '助教'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '0.75rem',
                        border: isPrintMode ? '1px solid #ddd' : 'none',
                        color: isPrintMode ? 'black' : 'inherit',
                      }}>
                        {displayShiftName !== '-' && !isPrintMode && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(168, 85, 247, 0.2)',
                            color: '#a855f7',
                            fontSize: '0.85rem',
                          }}>
                            {displayShiftName}
                          </span>
                        )}
                        {displayShiftName !== '-' && isPrintMode && (
                          <span>{displayShiftName}</span>
                        )}
                        {displayShiftName === '-' && <span style={{ color: isPrintMode ? 'black' : 'var(--text-secondary)' }}>-</span>}
                      </td>
                      <td style={{ 
                        padding: '0.75rem',
                        border: isPrintMode ? '1px solid #ddd' : 'none',
                        color: isPrintMode ? 'black' : 'inherit',
                      }}>{record.startTime} - {record.endTime}</td>
                      <td style={{ 
                        padding: '0.75rem', 
                        textAlign: 'center',
                        border: isPrintMode ? '1px solid #ddd' : 'none',
                        color: isPrintMode ? 'black' : 'inherit',
                      }}>
                        {calculateHours(record).toFixed(2)}h
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        textAlign: 'right',
                        border: isPrintMode ? '1px solid #ddd' : 'none',
                        color: isPrintMode ? 'black' : 'inherit',
                      }}>${record.hourlyRate}</td>
                      <td style={{ 
                        padding: '0.75rem', 
                        textAlign: 'right',
                        fontWeight: '600',
                        color: isPrintMode ? 'black' : 'var(--color-primary)',
                        border: isPrintMode ? '1px solid #ddd' : 'none',
                      }}>
                        ${calculatePay(record)}
                      </td>
                      {!isPrintMode && (
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleEditRecord(record)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'rgba(251, 191, 36, 0.2)',
                                color: '#fbbf24',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(251, 191, 36, 0.3)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)'}
                              title="編輯此記錄"
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => handleCopyRecord(record)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#3b82f6',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                              title="複製此記錄"
                            >
                              複製
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                              title="刪除此記錄"
                            >
                              刪除
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ 
                  borderTop: isPrintMode ? '2px solid #333' : '2px solid rgba(255,255,255,0.2)',
                  background: isPrintMode ? '#f9f9f9' : 'rgba(255,255,255,0.05)',
                  fontWeight: '700'
                }}>
                  {!isPrintMode && <td></td>}
                  <td colSpan={isPrintMode ? 7 : 7} style={{ 
                    padding: '1rem', 
                    textAlign: 'right', 
                    fontSize: '1.1rem',
                    border: isPrintMode ? '1px solid #333' : 'none',
                    color: isPrintMode ? 'black' : 'inherit',
                  }}>
                    總計薪資
                  </td>
                  <td style={{ 
                    padding: '1rem', 
                    textAlign: 'right',
                    fontSize: '1.2rem',
                    color: isPrintMode ? 'black' : 'var(--color-primary)',
                    border: isPrintMode ? '1px solid #333' : 'none',
                  }}>
                    ${totalPay}
                  </td>
                  {!isPrintMode && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="glass" style={{ 
          padding: '3rem', 
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          尚無工作記錄，請新增第一筆記錄
        </div>
      )}

      {/* 篩選結果為空的提示 */}
      {records.length > 0 && filteredRecords.length === 0 && (
        <div className="glass" style={{ 
          padding: '3rem', 
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>該月份尚無工作記錄</p>
          <button 
            onClick={() => updateFilterMonth('')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            顯示全部記錄
          </button>
        </div>
      )}

      {/* 隱藏的 PDF 內容區域 */}
      <div 
        ref={pdfContentRef} 
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '800px',
          padding: '40px',
          background: '#1a1a2e',
          color: '#ffffff',
        }}
      >
        <h1 style={{ 
          fontSize: '32px', 
          marginBottom: '20px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          薪資報表
        </h1>
        <div style={{ fontSize: '14px', marginBottom: '30px', color: '#aaa' }}>
          <div>生成日期：{new Date().toLocaleDateString('zh-TW')}</div>
          <div>記錄總數：{filteredRecords.length} 筆</div>
          <div>總計薪資：${totalPay}</div>
        </div>
        
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          marginTop: '20px',
        }}>
          <thead>
            <tr style={{ 
              background: 'rgba(139, 92, 246, 0.3)',
              borderBottom: '2px solid #8b5cf6'
            }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>日期</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>班別</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>時間</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>工時</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>時薪</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>薪資</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record, index) => (
              <tr 
                key={record.id} 
                style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  background: index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'
                }}
              >
                <td style={{ padding: '10px', fontSize: '13px' }}>{record.date}</td>
                <td style={{ padding: '10px', fontSize: '13px' }}>{getDisplayShiftName(record)}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px' }}>
                  {record.startTime} - {record.endTime}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>
                  {calculateHours(record).toFixed(2)}h
                </td>
                <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>
                  ${record.hourlyRate}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold' }}>
                  ${calculatePay(record)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ 
              borderTop: '2px solid #8b5cf6',
              background: 'rgba(139, 92, 246, 0.2)',
              fontWeight: 'bold'
            }}>
              <td colSpan={5} style={{ padding: '14px', textAlign: 'right', fontSize: '16px' }}>
                總計薪資
              </td>
              <td style={{ 
                padding: '14px', 
                textAlign: 'right', 
                fontSize: '18px',
                color: '#8b5cf6'
              }}>
                ${totalPay}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 編輯記錄彈窗 */}
      {showEditModal && editingRecord && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={handleCancelEdit}
        >
          <div 
            className="glass" 
            style={{
              padding: '2rem',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'rgba(30, 30, 45, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid rgba(139, 92, 246, 0.3)'
            }}>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700',
                background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                編輯工作記錄
              </h3>
              <button
                onClick={handleCancelEdit}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
                title="關閉"
              >
                ×
              </button>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  日期
                </label>
                <input 
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  身份
                </label>
                <select
                  value={editingRecord.role}
                  onChange={(e) => {
                    const newRole = e.target.value as RoleType;
                    setEditingRecord({ 
                      ...editingRecord, 
                      role: newRole,
                      hourlyRate: ROLE_HOURLY_RATES[newRole],
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <option value="assistant" style={{ background: '#1a1a2e', color: 'white' }}>助教 ($200/hr)</option>
                  <option value="instructor" style={{ background: '#1a1a2e', color: 'white' }}>講師 ($500/hr)</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  開始時間
                </label>
                <input 
                  type="time"
                  value={editingRecord.startTime}
                  onChange={(e) => handleEditStartTimeChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  結束時間
                </label>
                <input 
                  type="time"
                  value={editingRecord.endTime}
                  onChange={(e) => handleEditEndTimeChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  工作時數 (小時)
                </label>
                <input 
                  type="number"
                  value={editingWorkHours}
                  onChange={(e) => handleEditWorkHoursChange(e.target.value)}
                  step="0.5"
                  min="0"
                  placeholder="例如：8 或 8.5"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>

              {/* 休息時間已改為智慧推算，編輯時保留原值 */}

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  時薪 (元)
                </label>
                <input 
                  type="number"
                  value={editingRecord.hourlyRate}
                  onChange={(e) => setEditingRecord({ ...editingRecord, hourlyRate: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  班別 (選填)
                </label>
                <select
                  value={editingRecord.shiftCategory || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, shiftCategory: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <option value="" style={{ background: '#1a1a2e', color: 'white' }}>-- 無班別 --</option>
                  {shiftCategories.map((category) => (
                    <option key={category} value={category} style={{ background: '#1a1a2e', color: 'white' }}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 預覽區 */}
            <div style={{
              padding: '1.25rem',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              marginBottom: '2rem'
            }}>
              <div style={{ 
                fontSize: '0.85rem', 
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                預覽計算結果
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                <span>工作時數：</span>
                <span style={{ fontWeight: '700', color: 'var(--color-secondary)' }}>
                  {calculateHours(editingRecord).toFixed(2)} 小時
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '1rem',
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(139, 92, 246, 0.2)',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                <span>預計薪資：</span>
                <span style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '1.25rem' }}>
                  ${calculatePay(editingRecord)}
                </span>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
                }}
              >
                儲存變更
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批次編輯彈窗 */}
      {showBatchEditModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={handleCancelBatchEdit}
        >
          <div 
            className="glass" 
            style={{
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'rgba(30, 30, 45, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid rgba(139, 92, 246, 0.3)'
            }}>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700',
                background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                批次編輯工作紀錄
              </h3>
              <button
                onClick={handleCancelBatchEdit}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
                title="關閉"
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                padding: '1rem',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                marginBottom: '1.5rem',
              }}>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  已選擇 <span style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '1.1rem' }}>{selectedRecordIds.size}</span> 筆記錄
                </div>
              </div>

              {/* 身份選擇 */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  身份 <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>(選填)</span>
                </label>
                <select
                  value={batchEditData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as '' | RoleType;
                    setBatchEditData({ ...batchEditData, role: newRole });
                    // 自動更新時薪預設值
                    if (newRole === 'assistant') {
                      setBatchNewHourlyRate(200);
                    } else if (newRole === 'instructor') {
                      setBatchNewHourlyRate(350);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" style={{ background: '#1e1e2d', color: '#fff' }}>-- 不修改 --</option>
                  <option value="assistant" style={{ background: '#1e1e2d', color: '#fff' }}>助教</option>
                  <option value="instructor" style={{ background: '#1e1e2d', color: '#fff' }}>講師</option>
                </select>
              </div>

              {/* 班別輸入 */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  班別 <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>(選填)</span>
                </label>
                <input
                  type="text"
                  value={batchEditData.shiftCategory}
                  onChange={(e) => setBatchEditData({ ...batchEditData, shiftCategory: e.target.value })}
                  placeholder="例如：秋季班、冬令營"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: '500',
                  }}
                />
              </div>

              {/* 時段區塊 */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    開始時間 <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>(選填)</span>
                  </label>
                  <input
                    type="time"
                    value={batchEditData.startTime}
                    onChange={(e) => setBatchEditData({ ...batchEditData, startTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      borderRadius: '8px',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '1rem',
                      fontWeight: '500',
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    結束時間 <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>(選填)</span>
                  </label>
                  <input
                    type="time"
                    value={batchEditData.endTime}
                    onChange={(e) => setBatchEditData({ ...batchEditData, endTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      borderRadius: '8px',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '1rem',
                      fontWeight: '500',
                    }}
                  />
                </div>
              </div>

              {/* 工作時數 */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  工作時數 (小時) <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>(選填)</span>
                </label>
                <input
                  type="number"
                  value={batchEditData.workHours}
                  onChange={(e) => setBatchEditData({ ...batchEditData, workHours: e.target.value })}
                  placeholder="例如：8 或 8.5"
                  step="0.5"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: '500',
                  }}
                />
              </div>

              {/* 休息時間已改為智慧推算，批次編輯時不提供修改 */}

              {/* 時薪 */}
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.95rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                時薪 (元) <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>(選填，預設根據身份)</span>
              </label>
              <input 
                type="number"
                value={batchNewHourlyRate}
                onChange={(e) => setBatchNewHourlyRate(Number(e.target.value))}
                min="0"
                step="10"
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(139, 92, 246, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              />
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.8)',
            }}>
              ⚠️ 注意：<br />
              • 只有填寫的欄位會被更新，未填寫的欄位保持原值<br />
              • 此操作將會覆蓋所選記錄的對應欄位設定
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={handleCancelBatchEdit}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                取消
              </button>
              <button
                onClick={handleBatchEditHourlyRate}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
                }}
              >
                確認更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel 匯入預覽彈窗 */}
      {showImportModal && importValidation && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={handleCancelImport}
        >
          <div 
            className="glass" 
            style={{
              padding: '2rem',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              background: 'rgba(30, 30, 45, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(96, 165, 250, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid rgba(96, 165, 250, 0.3)'
            }}>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700',
                background: 'linear-gradient(to right, #60a5fa, #34d399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                匯入預覽
              </h3>
              <button
                onClick={handleCancelImport}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
                title="關閉"
              >
                ×
              </button>
            </div>

            {/* 狀態摘要 */}
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: importValidation.success 
                ? 'rgba(52, 211, 153, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)',
              border: importValidation.success 
                ? '1px solid rgba(52, 211, 153, 0.3)' 
                : '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '1.5rem',
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600',
                color: importValidation.success ? '#34d399' : '#ef4444',
                marginBottom: '0.5rem'
              }}>
                {importValidation.success ? '✓ 解析成功' : '✗ 解析失敗'}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                成功解析 <span style={{ color: '#60a5fa', fontWeight: '700' }}>{importValidation.records.length}</span> 筆有效記錄
              </div>
              {(() => {
                // 計算重複日期
                const existingDates = new Set(records.map(r => r.date));
                const duplicates = importValidation.records.filter(r => existingDates.has(r.date));
                const duplicateCount = duplicates.length;
                const newRecordCount = importValidation.records.length - duplicateCount;
                
                return (
                  <>
                    {duplicateCount > 0 && (
                      <div style={{ fontSize: '0.9rem', color: '#fbbf24', marginTop: '0.5rem' }}>
                        其中 {duplicateCount} 筆為重複日期，將會跳過
                      </div>
                    )}
                    {newRecordCount > 0 && (
                      <div style={{ fontSize: '0.9rem', color: '#34d399', marginTop: '0.5rem', fontWeight: '600' }}>
                        → 實際可匯入 {newRecordCount} 筆新記錄
                      </div>
                    )}
                  </>
                );
              })()}
              {importValidation.errors.length > 0 && (
                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                  已跳過 {importValidation.errors.length} 行（合計行/標題行）
                </div>
              )}
              {importValidation.warnings.length > 0 && (
                <div style={{ fontSize: '0.9rem', color: '#fbbf24', marginTop: '0.5rem' }}>
                  {importValidation.warnings.length} 個警告
                </div>
              )}
            </div>

            {/* 警告訊息 */}
            {importValidation.warnings.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: '600',
                  color: '#fbbf24',
                  marginBottom: '0.5rem'
                }}>
                  警告訊息：
                </div>
                <div style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  maxHeight: '150px',
                  overflow: 'auto',
                }}>
                  {importValidation.warnings.map((warning, index) => (
                    <div key={index} style={{ 
                      fontSize: '0.85rem', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '0.25rem'
                    }}>
                      • {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 預覽前幾筆資料 */}
            {importValidation.records.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '0.5rem'
                }}>
                  預覽前 5 筆資料：
                </div>
                <div style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <table style={{ 
                    width: '100%', 
                    fontSize: '0.85rem',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{ background: 'rgba(96, 165, 250, 0.1)' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>日期</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>工作內容</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>時薪</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>時段</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showAllImportRecords 
                        ? importValidation.records 
                        : importValidation.records.slice(0, 5)
                      ).map((record, index) => {
                        // 檢查是否為重複日期
                        const existingDates = new Set(records.map(r => r.date));
                        const isDuplicate = existingDates.has(record.date);
                        
                        return (
                          <tr key={index} style={{ 
                            background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                            opacity: isDuplicate ? 0.5 : 1,
                          }}>
                            <td style={{ 
                              padding: '0.5rem', 
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                              position: 'relative'
                            }}>
                              {record.date}
                              {isDuplicate && (
                                <span style={{ 
                                  fontSize: '0.7rem', 
                                  color: '#fbbf24',
                                  marginLeft: '0.5rem',
                                  fontWeight: '600'
                                }}>
                                  (重複)
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              {record.shiftCategory}
                            </td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              ${record.hourlyRate}
                            </td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              {record.startTime}-{record.endTime}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {importValidation.records.length > 5 && (
                  <button
                    onClick={() => setShowAllImportRecords(!showAllImportRecords)}
                    style={{ 
                      fontSize: '0.85rem', 
                      color: '#60a5fa',
                      background: 'rgba(96, 165, 250, 0.1)',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      borderRadius: '6px',
                      padding: '0.5rem 1rem',
                      marginTop: '0.75rem',
                      width: '100%',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                    }}
                  >
                    {showAllImportRecords 
                      ? '收起' 
                      : `顯示全部 ${importValidation.records.length} 筆資料 (還有 ${importValidation.records.length - 5} 筆未顯示)`
                    }
                  </button>
                )}
              </div>
            )}

            {/* 按鈕組 */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={handleCancelImport}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!importValidation.success}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: importValidation.success 
                    ? 'linear-gradient(135deg, #60a5fa, #34d399)' 
                    : 'rgba(156, 163, 175, 0.2)',
                  color: importValidation.success ? 'white' : 'rgba(156, 163, 175, 0.5)',
                  fontWeight: '600',
                  cursor: importValidation.success ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                  boxShadow: importValidation.success ? '0 4px 12px rgba(96, 165, 250, 0.4)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (importValidation.success) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(96, 165, 250, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (importValidation.success) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.4)';
                  }
                }}
              >
                確認匯入 {importValidation.records.length} 筆
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
