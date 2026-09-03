'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useSalaryData, type SalaryRecord } from '@/hooks/useSalaryData';
import { useShiftTemplates } from '@/hooks/useShiftTemplates';
import { useWorkRoles } from '@/hooks/useWorkRoles';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { generateShiftTemplateId, type ShiftTemplate } from '@/data/shiftTemplates';
import { getWorkRoleHourlyRate, getWorkRoleLabel, type RoleType } from '@/data/workRoles';
import { parseExcelFile, convertToExportFormat, type ImportValidation } from '@/utils/excelParser';

import SalaryHeaderStats from './salary/SalaryHeaderStats';
import SalaryRecordForm from './salary/SalaryRecordForm';
import SalaryRecordList from './salary/SalaryRecordList';
import SalaryAnalytics, { type MonthStats } from './salary/SalaryAnalytics';
import ShiftTemplateManager from './salary/ShiftTemplateManager';
import WorkRoleManager from './salary/WorkRoleManager';
import styles from './SalaryCalculator.module.css';

export default function SalaryCalculator() {
  const { shifts } = useScheduleData();
  const { 
    records, 
    addRecord, 
    updateRecord, 
    deleteRecord,
    batchAddRecords,
    batchUpdateRecords,
    batchDeleteRecords 
  } = useSalaryData();
  const {
    templates,
    loading: templatesLoading,
    canEdit: canEditTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useShiftTemplates();
  const {
    roles,
    loading: rolesLoading,
    canEdit: canEditRoles,
    addRole,
    updateRole,
    deleteRole,
  } = useWorkRoles();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  
  // URL 狀態管理
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // 標籤頁狀態：'records' | 'analytics' | 'templates' | 'roles'
  const [activeTab, setActiveTab] = useState<'records' | 'analytics' | 'templates' | 'roles'>('records');

  const [currentRecord, setCurrentRecord] = useState<Omit<SalaryRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    workHours: 8,
    role: 'assistant',
    hourlyRate: 200,
    shiftCategory: '',
  });
  
  // 新增記錄時的工作時數輔助欄位（小時）
  const [workHours, setWorkHours] = useState<string>('8');
  
  // 班別類別選項
  const [shiftCategories] = useState<string[]>([
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
    if (urlMonth && /^\d{4}-\d{2}$/.test(urlMonth)) {
      return urlMonth;
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // 薪資統計篩選狀態；統計卡片與明細列表維持獨立資料範圍，預設統計全部資料。
  const [statsFilter, setStatsFilter] = useState<string>('');
  
  // 匯入月份選擇
  const [importMonth, setImportMonth] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  
  const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
  const [editingWorkHours, setEditingWorkHours] = useState<string>(''); 
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStats, setShowStats] = useState(true); 
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set()); 
  const [showBatchEditModal, setShowBatchEditModal] = useState(false);
  const [batchNewHourlyRate, setBatchNewHourlyRate] = useState<number>(200);

  const [newTemplate, setNewTemplate] = useState<Omit<ShiftTemplate, 'id' | 'createdAt'>>({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    workHours: 8,
    hourlyRate: 200,
    role: 'assistant',
    roleName: '助教',
  });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  
  // 批量編輯多欄位狀態
  const [batchEditData, setBatchEditData] = useState({
    role: '' as '' | RoleType,
    startTime: '',
    endTime: '',
    workHours: '',
    shiftCategory: '',
  });
  const [isPrintMode, setIsPrintMode] = useState(false); 
  const pdfContentRef = useRef<HTMLDivElement>(null);
  
  // Excel 匯入相關狀態
  const [showImportModal, setShowImportModal] = useState(false);
  const [importValidation, setImportValidation] = useState<ImportValidation | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isSavingBatchEdit, setIsSavingBatchEdit] = useState(false);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [showAllImportRecords, setShowAllImportRecords] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateWorkHoursFromTimes = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return Math.max(0, (endMinutes - startMinutes) / 60);
  };

  const updateFilterMonth = (month: string) => {
    setFilterMonth(month);
  };

  const monthRange = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNumber = today.getMonth() + 1;
    const currentMonth = `${currentYear}-${String(currentMonthNumber).padStart(2, '0')}`;
    const previousMonthDate = new Date(currentYear, today.getMonth() - 1, 1);
    const previousMonth = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;

    return { currentMonth, previousMonth };
  }, []);

  const detailFilterMonth = useMemo(() => {
    const hasCurrentMonthRecords = records.some((record) => record.date.startsWith(monthRange.currentMonth));

    // 明細預設看本月；本月沒有資料時，改看上月並同步更新顯示中的篩選狀態。
    if (
      filterMonth === monthRange.currentMonth &&
      records.length > 0 &&
      !hasCurrentMonthRecords
    ) {
      return monthRange.previousMonth;
    }

    return filterMonth;
  }, [filterMonth, monthRange, records]);

  /** 同步明細實際顯示月份與 URL Search Params */
  useEffect(() => {
    const currentMonth = searchParams.get('month');
    if (detailFilterMonth && detailFilterMonth !== currentMonth) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('month', detailFilterMonth);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } else if (!detailFilterMonth && currentMonth) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('month');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [detailFilterMonth, pathname, router, searchParams]);

  const filteredRecords = useMemo(() => {
    if (!detailFilterMonth) return records;
    return records.filter(record => record.date.startsWith(detailFilterMonth));
  }, [records, detailFilterMonth]);

  const quickFilters = useMemo(() => {
    return [
      { label: '全部', value: '', description: '顯示所有記錄' },
      { label: '本月', value: monthRange.currentMonth, description: '僅顯示本月記錄' },
      { label: '上月', value: monthRange.previousMonth, description: '僅顯示上個月記錄' },
    ];
  }, [monthRange]);

  const statsQuickFilters = useMemo(() => {
    return [
      { label: '全部', value: '', description: '顯示所有統計' },
      { label: '本月', value: monthRange.currentMonth, description: '僅顯示本月統計' },
      { label: '上月', value: monthRange.previousMonth, description: '僅顯示上月統計' },
    ];
  }, [monthRange]);

  const statsRecords = useMemo(() => {
    if (!statsFilter) return records;
    return records.filter(record => record.date.startsWith(statsFilter));
  }, [records, statsFilter]);

  const shiftCategoryOptions = useMemo(() => {
    const templateNames = templates
      .map((template) => template.name.trim())
      .filter((name) => name.length > 0);
    const uniqueTemplateNames = Array.from(new Set(templateNames));

    if (uniqueTemplateNames.length > 0) {
      return uniqueTemplateNames;
    }

    return shiftCategories;
  }, [templates, shiftCategories]);

  const calculateHours = (record: Omit<SalaryRecord, 'id'>): number => {
    return record.workHours || 0;
  };

  const calculatePay = (record: Omit<SalaryRecord, 'id'>): number => {
    return Math.round((record.workHours || 0) * record.hourlyRate);
  };

  const handleAddRecord = async () => {
    if (isAddingRecord) return;
    const hours = parseFloat(workHours) || 0;
    const newRecord: SalaryRecord = {
      ...currentRecord,
      roleName: getWorkRoleLabel(currentRecord.role, roles, currentRecord.roleName),
      workHours: hours,
      id: Date.now().toString(),
    };
    setIsAddingRecord(true);
    try {
      await addRecord(newRecord);
      toast.success('已新增打工記錄');
    } catch {
      toast.error('新增打工記錄失敗，請稍後再試');
    } finally {
      setIsAddingRecord(false);
    }
  };

  const handleApplyTemplate = (template: ShiftTemplate) => {
    const hours = template.workHours ?? calculateWorkHoursFromTimes(template.startTime, template.endTime);
    setCurrentRecord(prev => ({
      ...prev,
      startTime: template.startTime,
      endTime: template.endTime,
      role: template.role ?? prev.role,
      roleName: getWorkRoleLabel(template.role ?? prev.role, roles, prev.roleName),
      hourlyRate: template.hourlyRate,
      shiftCategory: template.name,
    }));
    setWorkHours(hours.toString());
    toast.info(`已帶入「${template.name}」範本`);
  };

  const resetTemplateForm = () => {
    setEditingTemplateId(null);
    setNewTemplate({
      name: '',
      startTime: '09:00',
      endTime: '17:00',
      workHours: 8,
      hourlyRate: 200,
      role: 'assistant',
      roleName: '助教',
    });
  };

  const handleStartEditTemplate = (template: ShiftTemplate) => {
    if (!canEditTemplates) {
      toast.warning('目前沒有編輯班別的權限');
      return;
    }
    setEditingTemplateId(template.id);
    setNewTemplate({
      name: template.name,
      startTime: template.startTime,
      endTime: template.endTime,
      workHours: template.workHours ?? 0,
      hourlyRate: template.hourlyRate,
      role: template.role || 'assistant',
      roleName: template.roleName || getWorkRoleLabel(template.role || 'assistant', roles),
    });
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast.warning('班別名稱不可為空');
      return;
    }
    if (!canEditTemplates) {
      toast.warning('目前沒有編輯班別的權限');
      return;
    }

    if (editingTemplateId) {
      await updateTemplate(editingTemplateId, { ...newTemplate });
      toast.success('已更新班別範本');
      resetTemplateForm();
      return;
    }

    const template: ShiftTemplate = {
      ...newTemplate,
      id: generateShiftTemplateId(),
      createdAt: Date.now(),
    };
    await addTemplate(template);
    toast.success('已新增班別範本');
    resetTemplateForm();
  };

  const handleDeleteTemplate = async (template: ShiftTemplate) => {
    if (!canEditTemplates) {
      toast.warning('目前沒有編輯班別的權限');
      return;
    }
    const confirmed = await confirm({
      title: '刪除班別',
      message: `確定要刪除「${template.name}」嗎？此操作無法復原！`,
      confirmText: '刪除',
      danger: true,
    });
    if (!confirmed) return;
    await deleteTemplate(template.id);
    toast.success('已刪除班別範本');
  };

  const handleDeleteRecord = (id: string) => {
    deleteRecord(id);
    toast.success('已刪除打工記錄');
  };

  const handleCopyRecord = (record: SalaryRecord) => {
    setCurrentRecord({
      date: record.date,
      startTime: record.startTime,
      endTime: record.endTime,
      workHours: record.workHours,
      role: record.role,
      roleName: record.roleName,
      hourlyRate: record.hourlyRate,
      shiftCategory: record.shiftCategory || '',
      workShiftId: record.workShiftId,
    });
    setWorkHours(record.workHours.toString());
    setActiveTab('records');
    toast.info('已複製記錄到新增表單');
  };

  const handleImportFromWorkShifts = () => {
    const existingWorkShiftIds = new Set(records.map(r => r.workShiftId).filter(Boolean));
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

    const newRecords: SalaryRecord[] = monthShifts.map(shift => {
      const startTime = shift.startTime;
      const endTime = shift.endTime;
      const role = shift.role ?? 'assistant';
      const hourlyRate = shift.hourlyRate ?? getWorkRoleHourlyRate(role, roles);
      const hours = shift.workHours ?? calculateWorkHoursFromTimes(startTime, endTime);
      const normalizedHours = Number.isFinite(hours) ? hours : 0;
      
      return {
        id: `shift-${shift.id}-${Date.now()}`,
        date: shift.date,
        startTime,
        endTime,
        workHours: normalizedHours,
        role,
        roleName: getWorkRoleLabel(role, roles, shift.roleName),
        hourlyRate,
        shiftCategory: shift.shiftCategory || shift.note || '',
        workShiftId: shift.id,
      };
    });

    batchAddRecords(newRecords);
    toast.success(`成功匯入 ${newRecords.length} 筆 ${year} 年 ${month} 月的打工記錄！`);
  };

  const getDisplayShiftName = (record: SalaryRecord): string => {
    if (record.shiftCategory) return record.shiftCategory;
    if (record.workShiftId) {
      const shift = shifts.find(s => s.id === record.workShiftId);
      return shift?.note || '-';
    }
    return '-';
  };

  const handleEditRecord = (record: SalaryRecord) => {
    setEditingRecord({ ...record });
    setEditingWorkHours(record.workHours.toString());
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord || isSavingEdit) return;
    const hours = parseFloat(editingWorkHours) || 0;
    setIsSavingEdit(true);
    try {
      await updateRecord(editingRecord.id, {
        ...editingRecord,
        workHours: hours,
      });
      setShowEditModal(false);
      setEditingRecord(null);
      toast.success('已儲存變更');
    } catch {
      toast.error('儲存變更失敗，請稍後再試');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingRecord(null);
  };

  const toggleRecordSelection = (id: string) => {
    const newSelection = new Set(selectedRecordIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRecordIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedRecordIds.size === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleOpenBatchEdit = () => {
    if (selectedRecordIds.size === 0) {
      toast.warning('請先選擇要編輯的記錄！');
      return;
    }
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

  const handleBatchEditHourlyRate = async () => {
    if (isSavingBatchEdit) return;
    const updateData: Partial<SalaryRecord> = {};
    if (batchNewHourlyRate > 0) {
      updateData.hourlyRate = batchNewHourlyRate;
    }
    if (batchEditData.role) {
      updateData.role = batchEditData.role;
      const selectedRole = roles.find((role) => role.id === batchEditData.role);
      updateData.roleName = selectedRole?.name;
      if (batchNewHourlyRate === 200) {
        updateData.hourlyRate = selectedRole?.hourlyRate ?? batchNewHourlyRate;
      }
    }
    if (batchEditData.startTime) {
      updateData.startTime = batchEditData.startTime;
    }
    if (batchEditData.endTime) {
      updateData.endTime = batchEditData.endTime;
    }
    if (batchEditData.workHours) {
      const hours = parseFloat(batchEditData.workHours);
      if (!isNaN(hours) && hours > 0) {
        updateData.workHours = hours;
      }
    }
    if (batchEditData.shiftCategory) {
      updateData.shiftCategory = batchEditData.shiftCategory;
    }
    
    if (Object.keys(updateData).length === 0) {
      toast.warning('請至少填寫一個要修改的欄位！');
      return;
    }

    const updates = Array.from(selectedRecordIds).map(id => ({
      id,
      data: updateData
    }));
    
    setIsSavingBatchEdit(true);
    try {
      await batchUpdateRecords(updates);
      setShowBatchEditModal(false);
      setSelectedRecordIds(new Set());
      toast.success(`已成功更新 ${selectedRecordIds.size} 筆記錄！`);
    } catch {
      toast.error('批次更新失敗，請稍後再試');
    } finally {
      setIsSavingBatchEdit(false);
    }
  };

  const handleCancelBatchEdit = () => {
    setShowBatchEditModal(false);
  };

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
    toast.success('已刪除選取的記錄');
  };

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const statsTotalPay = useMemo(() => {
    return statsRecords.reduce((sum, record) => sum + calculatePay(record), 0);
  }, [statsRecords]);

  const statsTotalHours = useMemo(() => {
    return statsRecords.reduce((sum, r) => sum + calculateHours(r), 0);
  }, [statsRecords]);

  const statsAvgHourlyRate = useMemo(() => {
    if (statsTotalHours === 0) return 0;
    return Math.round(statsTotalPay / statsTotalHours);
  }, [statsTotalPay, statsTotalHours]);

  const statsWorkDays = useMemo(() => statsRecords.length, [statsRecords]);

  const getMonthlyStats = (): MonthStats[] => {
    const statsMap = new Map<string, MonthStats>();
    records.forEach(record => {
      const month = record.date.slice(0, 7);
      const pay = calculatePay(record);
      const hours = calculateHours(record);

      if (!statsMap.has(month)) {
        statsMap.set(month, { month, totalPay: 0, totalHours: 0, recordCount: 0 });
      }
      const stats = statsMap.get(month)!;
      stats.totalPay += pay;
      stats.totalHours += hours;
      stats.recordCount += 1;
    });

    const anchorMonthStr = statsFilter || monthRange.currentMonth;
    let anchorDate = new Date();
    if (anchorMonthStr && /^\d{4}-\d{2}$/.test(anchorMonthStr)) {
      const [year, month] = anchorMonthStr.split('-').map(Number);
      anchorDate = new Date(year, month - 1, 1);
    }

    const monthsList: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      monthsList.push(`${year}-${month}`);
    }

    return monthsList.map(month => statsMap.get(month) || { month, totalPay: 0, totalHours: 0, recordCount: 0 });
  };

  const monthlyStats = getMonthlyStats();
  const maxMonthlyPay = Math.max(...monthlyStats.map(s => s.totalPay), 1);

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      toast.warning('沒有可匯出的記錄！');
      return;
    }

    const exportData = filteredRecords.map(record => convertToExportFormat(record));
    const totalWorkHours = exportData.reduce((sum, row) => sum + row['工作時長 (時)'], 0);
    const totalPaySum = exportData.reduce((sum, row) => sum + row['應得薪資($)'], 0);
    
    exportData.push({
      '打工日期': '',
      '工作內容': '',
      '工作時長 (時)': totalWorkHours,
      '時薪($)': 0,
      '應得薪資($)': totalPaySum,
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '薪資明細');
    
    const monthStr = detailFilterMonth || '全部';
    const fileName = `薪資表_${monthStr}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('已下載 Excel 檔案');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = async () => {
    if (isConfirmingImport) return;
    if (!importValidation || !importValidation.success) {
      toast.warning('無有效資料可匯入');
      return;
    }

    setIsConfirmingImport(true);
    try {
      const existingDates = new Set(records.map(r => r.date));
      const recordsToImport = importValidation.records.filter(record => !existingDates.has(record.date));
      const duplicateCount = importValidation.records.length - recordsToImport.length;

      if (recordsToImport.length === 0) {
        toast.info('所有記錄的日期都已存在於資料庫中，沒有新記錄可匯入！');
        return;
      }

      await batchAddRecords(recordsToImport);
      let message = `成功匯入 ${recordsToImport.length} 筆記錄！`;
      if (duplicateCount > 0) {
        message += ` (已跳過 ${duplicateCount} 筆重複日期的記錄)`;
      }
      toast.success(message);
      setShowImportModal(false);
      setImportValidation(null);
      setShowAllImportRecords(false);
    } catch (error) {
      console.error('匯入失敗:', error);
      toast.error('匯入失敗，請稍後再試');
    } finally {
      setIsConfirmingImport(false);
    }
  };

  const handleCancelImport = () => {
    setShowImportModal(false);
    setImportValidation(null);
    setShowAllImportRecords(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportPDF = async () => {
    if (!pdfContentRef.current || filteredRecords.length === 0) {
      toast.warning('沒有可匯出的記錄！');
      return;
    }

    try {
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
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      const fileName = `薪資報表_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      toast.success('已下載 PDF 報表');
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

      <div style={{ maxWidth: '1000px', margin: '0 auto' }} className={isPrintMode ? 'print-friendly' : ''} ref={pdfContentRef}>
        
        {/* 標題與速覽卡片列 */}
        <div className={!isPrintMode ? 'page-section-enter' : undefined} style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: 'var(--spacing-md)',
            background: isPrintMode ? 'none' : 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
            WebkitBackgroundClip: isPrintMode ? 'unset' : 'text',
            WebkitTextFillColor: isPrintMode ? 'black' : 'transparent',
            color: isPrintMode ? 'black' : 'inherit',
          }}>
            薪資計算助手
          </h2>

          {/* 四大核心 KPI 速覽 */}
          {!isPrintMode && (
            <SalaryHeaderStats
              totalPay={statsTotalPay}
              totalHours={statsTotalHours}
              avgHourlyRate={statsAvgHourlyRate}
              workDays={statsWorkDays}
            />
          )}
        </div>

        {/* 標籤頁 (Tabs) 導覽列 */}
        {!isPrintMode && (
          <div className="no-print page-section-enter page-section-enter-delay-1" style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: 'var(--spacing-lg)',
            borderBottom: '2px solid rgba(220, 208, 194, 0.5)',
            paddingBottom: '0.25rem',
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('records')}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'records' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'records' ? '#f0ece1' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, color 0.2s ease',
              }}
            >
              薪資明細與記帳
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'analytics' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'analytics' ? '#f0ece1' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, color 0.2s ease',
              }}
            >
              統計與趨勢分析
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'templates' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'templates' ? '#f0ece1' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, color 0.2s ease',
              }}
            >
              班別範本管理
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'roles' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'roles' ? '#f0ece1' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, color 0.2s ease',
              }}
            >
              職稱／職位與時薪
            </button>
          </div>
        )}

        {/* 標籤頁內容切換 */}
        <div key={activeTab} className={styles.tabPanel}>
        {activeTab === 'records' && (
          <>
            {/* 新增記錄表單 */}
            <SalaryRecordForm
              currentRecord={currentRecord}
              setCurrentRecord={setCurrentRecord}
              workHours={workHours}
              setWorkHours={setWorkHours}
              roles={roles}
              shiftCategoryOptions={shiftCategoryOptions}
              templates={templates}
              importMonth={importMonth}
              setImportMonth={setImportMonth}
              onAddRecord={handleAddRecord}
              isAddingRecord={isAddingRecord}
              onImportFromWorkShifts={handleImportFromWorkShifts}
              onApplyTemplate={handleApplyTemplate}
            />

            {/* 明細表格與操作 */}
            <SalaryRecordList
              records={records}
              filteredRecords={filteredRecords}
              roles={roles}
              filterMonth={detailFilterMonth}
              updateFilterMonth={updateFilterMonth}
              quickFilters={quickFilters}
              selectedRecordIds={selectedRecordIds}
              toggleRecordSelection={toggleRecordSelection}
              toggleSelectAll={toggleSelectAll}
              setSelectedRecordIds={setSelectedRecordIds}
              onOpenBatchEdit={handleOpenBatchEdit}
              onBatchDelete={handleBatchDelete}
              onPrint={handlePrint}
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onImportClick={handleImportClick}
              isImporting={isImporting}
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              onEditRecord={handleEditRecord}
              onCopyRecord={handleCopyRecord}
              onDeleteRecord={handleDeleteRecord}
              getDisplayShiftName={getDisplayShiftName}
              calculatePay={calculatePay}
              calculateHours={calculateHours}
              showEditModal={showEditModal}
              editingRecord={editingRecord}
              editingWorkHours={editingWorkHours}
              onEditWorkHoursChange={setEditingWorkHours}
              onEditStartTimeChange={(t) => editingRecord && setEditingRecord({ ...editingRecord, startTime: t })}
              onEditEndTimeChange={(t) => editingRecord && setEditingRecord({ ...editingRecord, endTime: t })}
              onSaveEdit={handleSaveEdit}
              isSavingEdit={isSavingEdit}
              onCancelEdit={handleCancelEdit}
              setEditingRecord={setEditingRecord}
              showBatchEditModal={showBatchEditModal}
              batchNewHourlyRate={batchNewHourlyRate}
              setBatchNewHourlyRate={setBatchNewHourlyRate}
              batchEditData={batchEditData}
              setBatchEditData={setBatchEditData}
              shiftCategoryOptions={shiftCategoryOptions}
              onBatchEditHourlyRate={handleBatchEditHourlyRate}
              isSavingBatchEdit={isSavingBatchEdit}
              onCancelBatchEdit={handleCancelBatchEdit}
            />
          </>
        )}

        {activeTab === 'analytics' && (
          <SalaryAnalytics
            statsFilter={statsFilter}
            setStatsFilter={setStatsFilter}
            statsQuickFilters={statsQuickFilters}
            showStats={showStats}
            setShowStats={setShowStats}
            statsTotalPay={statsTotalPay}
            statsTotalHours={statsTotalHours}
            statsAvgHourlyRate={statsAvgHourlyRate}
            statsWorkDays={statsWorkDays}
            monthlyStats={monthlyStats}
            maxMonthlyPay={maxMonthlyPay}
          />
        )}

        {activeTab === 'templates' && (
          <ShiftTemplateManager
            templates={templates}
            templatesLoading={templatesLoading}
            canEditTemplates={canEditTemplates}
            newTemplate={newTemplate}
            setNewTemplate={setNewTemplate}
            editingTemplateId={editingTemplateId}
            onSaveTemplate={handleSaveTemplate}
            onStartEditTemplate={handleStartEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onResetTemplateForm={resetTemplateForm}
            roles={roles}
          />
        )}

        {activeTab === 'roles' && (
          <WorkRoleManager
            roles={roles}
            loading={rolesLoading}
            canEdit={canEditRoles}
            onAddRole={addRole}
            onUpdateRole={updateRole}
            onDeleteRole={deleteRole}
          />
        )}
        </div>

        {/* Excel 匯入預覽 Modal */}
        {showImportModal && importValidation && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div className="glass" style={{
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 'var(--spacing-lg)',
              background: '#f0ece1',
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: 'var(--spacing-md)' }}>
                Excel 匯入預覽
              </h3>

              {importValidation.errors.length > 0 && (
                <div style={{
                  padding: '1rem',
                  marginBottom: 'var(--spacing-md)',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#dc2626',
                }}>
                  <strong>驗證錯誤：</strong>
                  <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                    {importValidation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importValidation.success && (
                <div>
                  <div style={{
                    padding: '1rem',
                    marginBottom: 'var(--spacing-md)',
                    borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#16a34a',
                  }}>
                    成功解析 <strong>{importValidation.records.length}</strong> 筆記錄！
                  </div>

                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: 'var(--spacing-md)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.05)' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>日期</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>班別</th>
                          <th style={{ padding: '0.5rem', textAlign: 'center' }}>工時</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>時薪</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>薪資</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllImportRecords 
                          ? importValidation.records 
                          : importValidation.records.slice(0, 5)
                        ).map((record, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <td style={{ padding: '0.5rem' }}>{record.date}</td>
                            <td style={{ padding: '0.5rem' }}>{record.shiftCategory || '-'}</td>
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{record.workHours}h</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>${record.hourlyRate}</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>${calculatePay(record).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!showAllImportRecords && importValidation.records.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllImportRecords(true)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          marginTop: '0.5rem',
                          background: 'transparent',
                          border: '1px dashed rgba(0,0,0,0.2)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        顯示全部 ({importValidation.records.length} 筆)
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCancelImport}
                  disabled={isConfirmingImport}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.2)',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                {importValidation.success && (
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={isConfirmingImport}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--color-primary)',
                      color: '#fff',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {isConfirmingImport ? '匯入中...' : `確認匯入 (${importValidation.records.length} 筆)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
