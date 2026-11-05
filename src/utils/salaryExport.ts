import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { SalaryRecord } from '@/hooks/useSalaryData';
import { convertToExportFormat } from '@/utils/excelParser';

/** 今天的日期字串（YYYY-MM-DD），用於匯出檔名 */
function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

/** 匯出薪資明細為 Excel，最後一列附上總工時與總薪資 */
export function exportSalaryExcel(records: SalaryRecord[], monthLabel: string): void {
  const exportData = records.map((record) => convertToExportFormat(record));
  const totalWorkHours = exportData.reduce((sum, row) => sum + row['工作時長 (時)'], 0);
  const totalPaySum = exportData.reduce((sum, row) => sum + row['應得薪資($)'], 0);

  exportData.push({
    '打工日期': '',
    '工作內容': '',
    '工作時長 (時)': totalWorkHours,
    '時薪($)': 0,
    '應得薪資($)': totalPaySum,
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '薪資明細');
  XLSX.writeFile(workbook, `薪資表_${monthLabel}_${todayString()}.xlsx`);
}

/**
 * 將指定 DOM 區塊轉成多頁 A4 PDF。
 * 內容過長時以位移同一張圖的方式分頁，避免文字被切在頁面邊界外。
 */
export async function exportElementToPdf(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#1a1a2e',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

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

  pdf.save(`薪資報表_${todayString()}.pdf`);
}
