import { PERSONAL_COLLECTIONS } from '@/services/firestoreCollections';

/**
 * 薪資計算的個人設定。
 * 存放在 workRoles 集合的固定文件，而不是新開 salarySettings 集合：
 * Firestore Rules 以集合白名單控管個人資料，沿用既有集合不必重新部署規則，功能上線即可使用；
 * workRoles 本來就承載「時薪」這類計薪設定，語意上也相近。
 */
export const SALARY_SETTINGS_COLLECTION = PERSONAL_COLLECTIONS.workRoles;
export const SALARY_SETTINGS_ID = 'salary-settings';

export interface SalarySettings {
  /** 勞保勞工自付額（元／月）；0 代表未投保或尚未設定 */
  laborInsuranceEmployee: number;
}

export const DEFAULT_SALARY_SETTINGS: SalarySettings = {
  laborInsuranceEmployee: 0,
};

/** Firestore 讀回的值可能缺欄位或是舊格式，統一轉成非負整數，避免算出負的到帳金額 */
export function normalizeSalarySettings(data: Partial<SalarySettings> | null | undefined): SalarySettings {
  const raw = data?.laborInsuranceEmployee;
  const amount = typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
  return { laborInsuranceEmployee: amount };
}
