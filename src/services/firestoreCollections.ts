/**
 * Firestore 集合名稱的唯一來源。
 *
 * 集中管理可讓路徑拼寫錯誤在編譯期就被攔下，同時清楚區分個人與家庭共用資料。
 */
export const PERSONAL_COLLECTIONS = {
  courses: 'courses',
  workShifts: 'workShifts',
  salaryRecords: 'salaryRecords',
  events: 'events',
  allowanceRecords: 'allowanceRecords',
  allowanceSourceTypes: 'allowanceSourceTypes',
  shiftTemplates: 'shiftTemplates',
  workRoles: 'workRoles',
  courseNotes: 'courseNotes',
} as const;

export type PersonalCollectionName =
  (typeof PERSONAL_COLLECTIONS)[keyof typeof PERSONAL_COLLECTIONS];

export const SHARED_COLLECTIONS = {
  courses: 'courses',
  gameGuides: 'gameGuides',
} as const;

export type SharedCollectionName =
  (typeof SHARED_COLLECTIONS)[keyof typeof SHARED_COLLECTIONS];
