export type OperationScope = 'save' | 'family';

interface ReadStatus {
  fromCache: boolean;
  pending: boolean;
  failed: boolean;
}

export interface DataStatus {
  saving: number;
  syncing: number;
  saveFailures: number;
  familyFailures: number;
  readFailures: number;
  cached: boolean;
  pending: boolean;
  hasSaved: boolean;
  hasSynced: boolean;
}

const initialStatus: DataStatus = {
  saving: 0, syncing: 0, saveFailures: 0, familyFailures: 0,
  readFailures: 0, cached: false, pending: false, hasSaved: false, hasSynced: false,
};
let status = initialStatus;
let generation = 0;
const listeners = new Set<() => void>();
const reads = new Map<symbol, ReadStatus>();
const failures = { save: new Set<string>(), family: new Set<string>() };
const attempts = new Map<string, symbol>();
const familyRetries = new Map<string, () => Promise<unknown>>();

function publish(updates: Partial<DataStatus>): void {
  status = { ...status, ...updates };
  listeners.forEach((listener) => listener());
}

export function subscribeDataStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getDataStatus(): DataStatus { return status; }
export function getServerDataStatus(): DataStatus { return initialStatus; }

/** 切換帳號後忽略上一個帳號仍在等待的請求結果。 */
export function resetDataStatus(): void {
  generation += 1;
  reads.clear();
  failures.save.clear();
  failures.family.clear();
  attempts.clear();
  familyRetries.clear();
  publish(initialStatus);
}

function publishReads(): void {
  const values = [...reads.values()];
  publish({
    cached: values.some((read) => read.fromCache),
    pending: values.some((read) => read.pending),
    readFailures: values.filter((read) => read.failed).length,
  });
}

export function registerDataRead(): {
  update: (read: ReadStatus) => void;
  remove: () => void;
} {
  const token = Symbol();
  const currentGeneration = generation;
  reads.set(token, { fromCache: true, pending: false, failed: false });
  publishReads();
  return {
    update: (read) => {
      if (generation !== currentGeneration || !reads.has(token)) return;
      reads.set(token, read);
      publishReads();
    },
    remove: () => {
      if (generation !== currentGeneration) return;
      reads.delete(token);
      publishReads();
    },
  };
}

/** 成功只在伺服器確認後回報；離線等待不冒充已保存。 */
export async function trackDataOperation<T>(
  scope: OperationScope,
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const currentGeneration = generation;
  const attemptKey = `${scope}:${key}`;
  const attempt = Symbol();
  attempts.set(attemptKey, attempt);
  const countKey = scope === 'save' ? 'saving' : 'syncing';
  const failureKey = scope === 'save' ? 'saveFailures' : 'familyFailures';
  publish({ [countKey]: status[countKey] + 1 });
  try {
    const result = await operation();
    if (generation === currentGeneration && attempts.get(attemptKey) === attempt) {
      failures[scope].delete(key);
      if (scope === 'family') familyRetries.delete(key);
      publish({
        [failureKey]: failures[scope].size,
        [scope === 'save' ? 'hasSaved' : 'hasSynced']: true,
      });
    }
    return result;
  } catch (error) {
    if (generation === currentGeneration && attempts.get(attemptKey) === attempt) {
      failures[scope].add(key);
      if (scope === 'family') familyRetries.set(key, operation);
      publish({ [failureKey]: failures[scope].size });
    }
    throw error;
  } finally {
    if (generation === currentGeneration) {
      if (attempts.get(attemptKey) === attempt) attempts.delete(attemptKey);
      publish({ [countKey]: status[countKey] - 1 });
    }
  }
}

/** 重送原本失敗的家庭操作，包含刪除，不以整月覆寫取代它。 */
export async function retryFamilySync(): Promise<void> {
  await Promise.allSettled([...familyRetries].map(([key, operation]) =>
    trackDataOperation('family', key, operation)
  ));
}
