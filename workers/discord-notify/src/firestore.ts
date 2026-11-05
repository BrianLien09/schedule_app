import type { NotifyShift, NotifyTodo } from './message';

export interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

interface FirestoreValue {
  stringValue?: string;
  booleanValue?: boolean;
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

interface RunQueryRow {
  document?: FirestoreDocument;
}

function base64Url(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** 以服務帳號簽 JWT 換取 access token（Workers 沒有 Admin SDK，只能走 OAuth2 JWT bearer）。 */
export async function getAccessToken(account: ServiceAccount): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: issuedAt,
    exp: issuedAt + 3600,
  }));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`));
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${base64Url(signature)}`,
    }),
  });
  if (!response.ok) throw new Error(`取得 Firebase access token 失敗：${response.status}`);
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('Firebase token 回應缺少 access_token');
  return data.access_token;
}

/** 單一欄位區間查詢（>= start 且 <= end），不需要複合索引。 */
async function queryRange(
  token: string,
  projectId: string,
  uid: string,
  collectionId: string,
  field: string,
  start: string,
  end: string,
): Promise<FirestoreDocument[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(uid)}:runQuery`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              { fieldFilter: { field: { fieldPath: field }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: start } } },
              { fieldFilter: { field: { fieldPath: field }, op: 'LESS_THAN_OR_EQUAL', value: { stringValue: end } } },
            ],
          },
        },
      },
    }),
  });
  if (!response.ok) throw new Error(`Firestore 查詢 ${collectionId} 失敗：${response.status}`);
  const rows = (await response.json()) as RunQueryRow[];
  return rows.flatMap((row) => (row.document ? [row.document] : []));
}

const text = (doc: FirestoreDocument, field: string): string => doc.fields?.[field]?.stringValue ?? '';

export async function fetchShifts(token: string, projectId: string, uid: string, start: string, end: string): Promise<NotifyShift[]> {
  const docs = await queryRange(token, projectId, uid, 'salaryRecords', 'date', start, end);
  return docs.map((doc) => ({
    date: text(doc, 'date'),
    startTime: text(doc, 'startTime'),
    endTime: text(doc, 'endTime'),
    title: text(doc, 'shiftCategory') || text(doc, 'roleName') || '打工',
  }));
}

/** 待辦只會出現在起日或迄日，所以分別以兩個欄位查詢後依文件路徑合併去重。 */
export async function fetchTodos(token: string, projectId: string, uid: string, start: string, end: string): Promise<NotifyTodo[]> {
  const [byStart, byEnd] = await Promise.all([
    queryRange(token, projectId, uid, 'todos', 'startDate', start, end),
    queryRange(token, projectId, uid, 'todos', 'endDate', start, end),
  ]);
  const merged = new Map<string, FirestoreDocument>();
  for (const doc of [...byStart, ...byEnd]) merged.set(doc.name, doc);
  return [...merged.values()].map((doc) => ({
    id: doc.name,
    title: text(doc, 'title'),
    startDate: text(doc, 'startDate'),
    endDate: text(doc, 'endDate'),
    startTime: text(doc, 'startTime'),
    endTime: text(doc, 'endTime'),
    completed: doc.fields?.completed?.booleanValue === true,
  }));
}
