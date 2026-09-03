export type RoleType = string;

export interface WorkRole {
  id: string;
  name: string;
  hourlyRate: number;
  createdAt: number;
}

export type WorkRoleInput = Pick<WorkRole, 'name' | 'hourlyRate'>;

export const WORK_ROLES_COLLECTION = 'workRoles';
export const WORK_ROLES_CONFIG_ID = 'role-config';

/** 首次啟用職稱／職位管理時寫入的預設資料。 */
export const DEFAULT_WORK_ROLES: WorkRole[] = [
  { id: 'assistant', name: '助教', hourlyRate: 200, createdAt: 0 },
  { id: 'instructor', name: '講師', hourlyRate: 500, createdAt: 0 },
  { id: 'admin', name: '行政', hourlyRate: 200, createdAt: 0 },
];

/** 舊資料沒有職稱／職位名稱時，仍可用固定 ID 顯示可讀文字。 */
export const LEGACY_ROLE_LABELS: Record<string, string> = {
  assistant: '助教',
  instructor: '講師',
  admin: '行政',
};

/** 舊資料沒有時薪時的相容預設值；新職稱／職位的時薪由 Firestore 資料提供。 */
export const ROLE_HOURLY_RATES: Record<string, number> = DEFAULT_WORK_ROLES.reduce(
  (rates, role) => {
    rates[role.id] = role.hourlyRate;
    return rates;
  },
  {} as Record<string, number>
);

export function generateWorkRoleId(): string {
  return `role-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export function getWorkRoleLabel(
  roleId: RoleType | undefined,
  roles: WorkRole[],
  fallbackName?: string
): string {
  if (!roleId) return fallbackName?.trim() || '未設定職稱／職位';

  const role = roles.find((item) => item.id === roleId);
  if (role) return role.name;

  return fallbackName?.trim() || LEGACY_ROLE_LABELS[roleId] || roleId;
}

export function getWorkRoleHourlyRate(
  roleId: RoleType | undefined,
  roles: WorkRole[] = []
): number {
  const role = roles.find((item) => item.id === roleId);
  if (role && Number.isFinite(role.hourlyRate)) return role.hourlyRate;

  return ROLE_HOURLY_RATES[roleId || 'assistant'] ?? 200;
}

export function sortWorkRoles(roles: WorkRole[]): WorkRole[] {
  return [...roles].sort((a, b) => {
    const aDefaultIndex = DEFAULT_WORK_ROLES.findIndex((role) => role.id === a.id);
    const bDefaultIndex = DEFAULT_WORK_ROLES.findIndex((role) => role.id === b.id);

    if (aDefaultIndex !== -1 || bDefaultIndex !== -1) {
      if (aDefaultIndex === -1) return 1;
      if (bDefaultIndex === -1) return -1;
      return aDefaultIndex - bDefaultIndex;
    }

    return a.createdAt - b.createdAt || a.name.localeCompare(b.name, 'zh-Hant');
  });
}
