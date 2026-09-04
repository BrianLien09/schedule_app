import assert from 'node:assert/strict';
import test from 'node:test';
import * as XLSX from 'xlsx';
import { convertToExportFormat, parseExcelFile } from '../src/utils/excelParser';
import type { SalaryRecord } from '../src/data/workRecords';

function createWorkbookFile(rows: Record<string, string | number>[]): File {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '打工紀錄');
  const content = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new File([content], 'salary-records.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

test('parseExcelFile 解析有效記錄並提示薪資不一致', async () => {
  const result = await parseExcelFile(
    createWorkbookFile([
      {
        '打工日期': '9/4/26',
        '工作內容': '秋季班',
        '工作時長 (時)': 3.5,
        '時薪($)': 200,
        '應得薪資($)': 800,
      },
    ])
  );

  assert.equal(result.success, true);
  assert.deepEqual(result.records[0], {
    id: result.records[0]?.id,
    date: '2026-09-04',
    startTime: '09:00',
    endTime: '12:30',
    workHours: 3.5,
    hourlyRate: 200,
    role: 'assistant',
    shiftCategory: '秋季班',
  });
  assert.match(result.warnings.join('\n'), /應得薪資不符/);
});

test('parseExcelFile 回報缺少必要欄位', async () => {
  const result = await parseExcelFile(
    createWorkbookFile([{ '打工日期': '2026-09-04', '工作內容': '秋季班' }])
  );

  assert.equal(result.success, false);
  assert.match(result.errors.join('\n'), /缺少必要欄位/);
});

test('convertToExportFormat 以時間區間輸出工時與薪資', () => {
  const record: SalaryRecord = {
    id: 'salary-1',
    date: '2026-09-04',
    startTime: '09:15',
    endTime: '12:45',
    workHours: 0,
    hourlyRate: 200,
    role: 'assistant',
    shiftCategory: '秋季班',
  };

  assert.deepEqual(convertToExportFormat(record), {
    '打工日期': '2026-09-04',
    '工作內容': '秋季班',
    '工作時長 (時)': 3.5,
    '時薪($)': 200,
    '應得薪資($)': 700,
  });
});
