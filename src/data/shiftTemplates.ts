export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=日, 6=六

export interface ShiftTemplate {
  id: string;
  name: string;
  weekday: Weekday;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  workHours?: number;
  hourlyRate: number;
  isDefault: boolean;
  createdAt: number;
  role?: string;
}

/**
 * 取得範本的計薪工時；只有舊範本沒有保存工作時數時，才使用時間差兜底。
 */
export function getShiftTemplateWorkHours(
  template: Pick<ShiftTemplate, 'workHours'>,
  fallbackWorkHours: number
): number {
  return typeof template.workHours === 'number' && Number.isFinite(template.workHours)
    ? template.workHours
    : fallbackWorkHours;
}

export function generateShiftTemplateId(): string {
  return `shift-template-${Date.now()}`;
}

export function sortShiftTemplatesByPriority(templates: ShiftTemplate[]): ShiftTemplate[] {
  return [...templates].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
}
