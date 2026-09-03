export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  workHours?: number;
  hourlyRate: number;
  createdAt: number;
  role?: string;
  roleName?: string;
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

export function sortShiftTemplates(templates: ShiftTemplate[]): ShiftTemplate[] {
  return [...templates].sort((a, b) => b.createdAt - a.createdAt);
}
