import * as XLSX from 'xlsx';
import type { SalaryRecord } from '@/hooks/useSalaryData';

/**
 * Excel 日期轉換為 YYYY-MM-DD 格式
 * 
 * Excel 可能使用的格式：
 * - 序列號（如 45859 代表 2025/7/21）
 * - 文字格式（如 "7/21/25", "2025-07-21"）
 */
function parseExcelDate(value: any): string {
  if (!value) {
    throw new Error('日期欄位不得為空');
  }

  // 如果是數字（Excel 序列號格式）
  if (typeof value === 'number') {
    // Excel 的日期序列號從 1900/1/1 開始
    const excelEpoch = new Date(1900, 0, 1);
    // Excel 有一個已知的 bug：將 1900 年當作閏年（實際上不是）
    // 所以需要減去 2 天來修正
    const days = value - 2;
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 如果是字串格式
  if (typeof value === 'string') {
    // 嘗試解析 M/D/YY 或 M/D/YYYY 格式
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (match) {
      let [, month, day, year] = match;
      
      // 處理兩位數年份（25 → 2025）
      if (year.length === 2) {
        const yearNum = parseInt(year, 10);
        // 假設 00-49 代表 2000-2049，50-99 代表 1950-1999
        year = yearNum < 50 ? `20${year}` : `19${year}`;
      }
      
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // 嘗試解析 YYYY-MM-DD 格式
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return value;
    }

    // 嘗試使用 Date 物件解析
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  throw new Error(`無法解析日期格式：${value}`);
}

/**
 * 解析時薪（移除貨幣符號與逗號）
 */
function parseHourlyRate(value: any): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    // 移除 $、逗號、空格等
    const cleaned = value.replace(/[$,\s]/g, '');
    const rate = parseFloat(cleaned);
    
    if (isNaN(rate) || rate <= 0) {
      throw new Error(`無效的時薪：${value}`);
    }
    
    return rate;
  }

  throw new Error(`無法解析時薪：${value}`);
}

/**
 * 解析工作時長
 */
function parseWorkHours(value: any): number {
  const hours = typeof value === 'number' ? value : parseFloat(value);
  
  if (isNaN(hours) || hours <= 0) {
    throw new Error(`無效的工作時長：${value}`);
  }
  
  return hours;
}

/**
 * 智慧推算開始/結束時間
 * 
 * 規則：
 * - 預設開始時間 09:00
 * - 根據工作時長計算結束時間（不含休息時間）
 * 
 * 範例：
 * - 6 小時 → 09:00-15:00
 * - 7 小時 → 09:00-16:00
 * - 8 小時 → 09:00-17:00
 */
function calculateTimeRange(workHours: number): {
  startTime: string;
  endTime: string;
} {
  const startTime = '09:00';

  // 結束時間 = 開始時間 + 工作時長
  const startHour = 9;
  const endHour = startHour + workHours;
  
  const endHourInt = Math.floor(endHour);
  const endMinutes = Math.round((endHour - endHourInt) * 60);
  
  const endTime = `${String(endHourInt).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

  return { startTime, endTime };
}

/**
 * 根據時薪推斷身份
 */
function inferRole(hourlyRate: number): 'assistant' | 'instructor' {
  // 200 → 助教，350 → 講師
  // 如果時薪接近 350（容錯範圍 ±50），判定為講師
  return hourlyRate >= 300 ? 'instructor' : 'assistant';
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Excel 匯入資料驗證結果
 */
export interface ImportValidation {
  success: boolean;
  records: SalaryRecord[];
  errors: string[];
  warnings: string[];
}

/**
 * 解析 Excel 檔案為 SalaryRecord 陣列
 * 
 * 支援格式：
 * - 打工日期 | 工作內容 | 工作時長 (時) | 時薪($) | 應得薪資($)
 * 
 * @param file - Excel 檔案
 * @returns 解析結果（包含成功的記錄與錯誤訊息）
 */
export async function parseExcelFile(file: File): Promise<ImportValidation> {
  const records: SalaryRecord[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 讀取檔案
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // 取得第一個工作表
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // 方法一：嘗試從第一行開始讀取（標準格式）
    let rawJsonData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false,
      defval: '',
    });

    // 方法二：如果第一行不是標題，從第二行開始讀取
    if (rawJsonData.length === 0 || !('打工日期' in (rawJsonData[0] as Record<string, any>))) {
      // 嘗試跳過第一行（可能是月份標題）
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      range.s.r = 1; // 從第二行開始
      const newRef = XLSX.utils.encode_range(range);
      
      rawJsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: '',
        range: newRef,
      });
    }

    if (rawJsonData.length === 0) {
      errors.push('檔案中沒有資料');
      return { success: false, records: [], errors, warnings };
    }

    // 清理欄位名稱（去除前後空格、全形符號）
    const jsonData = rawJsonData.map(row => {
      const cleanedRow: Record<string, any> = {};
      for (const [key, value] of Object.entries(row as Record<string, any>)) {
        let cleanedKey = String(key).trim();
        // 處理可能的全形括號和符號
        cleanedKey = cleanedKey.replace(/（/g, '(').replace(/）/g, ')');
        cleanedKey = cleanedKey.replace(/＄/g, '$');
        cleanedRow[cleanedKey] = value;
      }
      return cleanedRow;
    });

    // 檢查必要欄位
    const firstRow = jsonData[0] as Record<string, any>;
    const requiredColumns = ['打工日期', '工作內容', '工作時長 (時)', '時薪($)'];
    const actualColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      errors.push(`缺少必要欄位：${missingColumns.join('、')}`);
      errors.push(`實際欄位：${actualColumns.map(col => `"${col}"`).join('、')}`);
      errors.push(`提示：請檢查欄位名稱是否有多餘空格或使用全形符號`);
      return { success: false, records: [], errors, warnings };
    }

    // 解析每一筆資料
    let skippedCount = 0;
    jsonData.forEach((row: any, index: number) => {
      const rowNumber = index + 2; // Excel 行號（第1行是標題）

      try {
        // 檢查是否為空行或特殊行（合計、標題等）
        const dateValue = row['打工日期'];
        const workContent = String(row['工作內容'] || '').trim();
        
        // 跳過特殊行（合計行、標題行、月份分隔行）
        if (!dateValue || 
            String(dateValue).includes('合計') || 
            String(dateValue).includes('打工日期') ||
            String(dateValue).match(/^\d{4}_\d{1,2}月打工$/) ||
            String(dateValue).match(/^\d{4}\s+\d{1,2}月打工$/) ||  // 處理 "2025 7月打工" 格式
            !workContent ||
            workContent.includes('工作內容')) {
          skippedCount++;
          return;
        }

        // 解析日期
        const date = parseExcelDate(dateValue);

        // 解析工作內容（對應到 shiftCategory）
        const shiftCategory = workContent;
        if (!shiftCategory) {
          throw new Error('工作內容不得為空');
        }

        // 解析工作時長
        const workHours = parseWorkHours(row['工作時長 (時)']);

        // 解析時薪
        const hourlyRate = parseHourlyRate(row['時薪($)']);

        // 智慧推算時間
        const { startTime, endTime } = calculateTimeRange(workHours);

        // 推斷身份
        const role = inferRole(hourlyRate);

        // 建立記錄
        const record: SalaryRecord = {
          id: generateId(),
          date,
          startTime,
          endTime,
          workHours, // 使用解析出的工作時數
          hourlyRate,
          role,
          shiftCategory,
        };

        // 驗證應得薪資（如果存在）
        if (row['應得薪資($)']) {
          const expectedPay = parseHourlyRate(row['應得薪資($)']);
          const calculatedPay = workHours * hourlyRate;
          
          if (Math.abs(expectedPay - calculatedPay) > 0.01) {
            warnings.push(
              `第 ${rowNumber} 行：應得薪資不符（檔案: ${expectedPay}, 計算: ${calculatedPay}）`
            );
          }
        }

        records.push(record);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        errors.push(`第 ${rowNumber} 行：${errorMessage}`);
      }
    });

    // 檢查是否有重複日期
    const dateCount = new Map<string, number>();
    records.forEach(record => {
      const count = dateCount.get(record.date) || 0;
      dateCount.set(record.date, count + 1);
    });

    dateCount.forEach((count, date) => {
      if (count > 1) {
        warnings.push(`日期 ${date} 有 ${count} 筆記錄（可能重複）`);
      }
    });

    // 顯示跳過行數的資訊
    if (skippedCount > 0) {
      warnings.push(`已跳過 ${skippedCount} 行（合計行/標題行）`);
    }

    // 只要有成功解析的記錄就算成功（允許跳過無效行）
    const success = records.length > 0;
    
    // 如果沒有成功記錄但也沒有錯誤，添加提示
    if (!success && errors.length === 0) {
      errors.push(`無法解析任何有效記錄，共跳過 ${skippedCount} 行`);
      errors.push(`總行數：${jsonData.length}`);
    }
    
    return { success, records, errors, warnings };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '檔案讀取失敗';
    errors.push(`檔案處理錯誤：${errorMessage}`);
    return { success: false, records: [], errors, warnings };
  }
}

/**
 * 將 SalaryRecord 轉換為統一的 Excel 匯出格式
 * 
 * 格式：打工日期 | 工作內容 | 工作時長 (時) | 時薪($) | 應得薪資($)
 */
export function convertToExportFormat(record: SalaryRecord): {
  '打工日期': string;
  '工作內容': string;
  '工作時長 (時)': number;
  '時薪($)': number;
  '應得薪資($)': number;
} {
  // 計算工作時長（直接從開始到結束時間，不扣除休息）
  const [startHour, startMin] = record.startTime.split(':').map(Number);
  const [endHour, endMin] = record.endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const totalMinutes = endMinutes - startMinutes;
  const workHours = totalMinutes / 60;

  // 計算應得薪資
  const totalPay = workHours * record.hourlyRate;

  return {
    '打工日期': record.date,
    '工作內容': record.shiftCategory || '',
    '工作時長 (時)': Number(workHours.toFixed(2)),
    '時薪($)': record.hourlyRate,
    '應得薪資($)': Number(totalPay.toFixed(0)),
  };
}
