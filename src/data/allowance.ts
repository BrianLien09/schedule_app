/**
 * 生活費匯入記錄相關型別定義
 * 
 * 用途：記錄從爸爸帳戶匯入的生活費，區分打工收入與生活費來源
 * Firestore 路徑：/shared/data/allowanceRecords/{recordId}
 */

/**
 * 生活費匯入記錄
 */
export interface AllowanceRecord {
  id: string;                      // 唯一識別碼（格式：allowance-{timestamp}）
  date: string;                    // 匯入日期（YYYY-MM-DD）
  amount: number;                  // 匯入金額
  totalBalance: number;            // 帳簿餘額（匯入後的總餘額）
  xiaoBalance: number;             // 小呆餘額（手動輸入）
  sourceType: string;              // 來源類型（可自定義：打工收入、生活費匯款等）
  note?: string;                   // 備註
  timestamp: number;               // 建立時間戳記（用於排序）
}

/**
 * 預設來源類型
 * 
 * 使用者可以在此基礎上新增自訂類型（如「紅包」、「獎學金」等）
 */
export const DEFAULT_SOURCE_TYPES = [
  '打工收入',
  '生活費匯款',
  '獎學金',
  '退費',
  '其他',
];

/**
 * 生成唯一 ID
 * 
 * 格式：allowance-{timestamp}
 * 範例：allowance-1738838400000
 */
export function generateAllowanceId(): string {
  return `allowance-${Date.now()}`;
}

/**
 * 計算孔呆餘額
 * 
 * 公式：孔呆餘額 = 帳簿餘額 - 小呆餘額
 * 
 * @param totalBalance - 帳簿餘額
 * @param xiaoBalance - 小呆餘額
 * @returns 孔呆餘額
 */
export function calculateKongBalance(totalBalance: number, xiaoBalance: number): number {
  return totalBalance - xiaoBalance;
}

/**
 * 格式化日期為複製格式
 * 
 * 輸入：YYYY-MM-DD（Firestore 格式）
 * 輸出：YYYY/M/D（複製格式，去除前導零）
 * 
 * @example
 * formatDateForCopy('2026-02-07') // '2026/2/7'
 */
export function formatDateForCopy(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${year}/${parseInt(month)}/${parseInt(day)}`;
}

/**
 * 生成複製文字
 * 
 * 根據來源類型決定是否包含孔呆餘額：
 * - 生活費匯款：包含孔呆餘額
 * - 其他來源：不包含孔呆餘額
 * 
 * 格式（生活費匯款）：
 * 匯入日期: 2026/2/7
 * 匯入金額: 11900
 * 帳簿餘額: 53281
 * 孔呆餘額: 5381
 * 小呆餘額: 47900
 * 
 * 格式（其他來源）：
 * 匯入日期: 2026/2/7
 * 匯入金額: 3000
 * 來源: 打工收入
 * 帳簿餘額: 56281
 * 小呆餘額: 50900
 * 
 * @param record - 生活費記錄
 * @returns 格式化的複製文字
 */
export function generateCopyText(record: AllowanceRecord): string {
  const isAllowance = record.sourceType === '生活費匯款';
  
  if (isAllowance) {
    const kongBalance = calculateKongBalance(record.totalBalance, record.xiaoBalance);
    return `匯入日期: ${formatDateForCopy(record.date)}
匯入金額: ${record.amount}
帳簿餘額: ${record.totalBalance}
孔呆餘額: ${kongBalance}
小呆餘額: ${record.xiaoBalance}`;
  } else {
    return `匯入日期: ${formatDateForCopy(record.date)}
匯入金額: ${record.amount}
來源: ${record.sourceType}
帳簿餘額: ${record.totalBalance}
小呆餘額: ${record.xiaoBalance}`;
  }
}
