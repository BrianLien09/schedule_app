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

/** Firestore 固定根路徑，避免資料層散落相同的路徑字串。 */
export const FIRESTORE_PATHS = {
  usersCollection: 'users',
  sharedCollection: 'shared',
  sharedDataDocument: 'data',
} as const;

/** family-web 使用的外部資料集合名稱。 */
export const FAMILY_COLLECTIONS = {
  schedules: 'schedules',
} as const;

export type FamilyCollectionName =
  (typeof FAMILY_COLLECTIONS)[keyof typeof FAMILY_COLLECTIONS];
