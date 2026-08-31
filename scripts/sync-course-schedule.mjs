#!/usr/bin/env node

/**
 * 將 shared/data/courses 的最新課表整理到 Brian 的個人課表。
 *
 * 資料模型：
 * - 來源：/shared/data/courses（目前作為其他帳戶的共享課表）
 * - 目標：/users/{targetUid}/courses
 * - 本次同步只處理大二上 2026-1，不建立尚未有資料的學期。
 *
 * 安全設計：
 * - 預設只預覽，不會寫入資料庫。
 * - 只新增或更新目標文件，不刪除 Brian 其他學期的資料。
 * - 來源文件與個人課表文件 ID 衝突時，使用穩定的新 ID，避免覆蓋大一下資料。
 * - 課程依星期、開始時間、結束時間排序，並寫入 order 欄位。
 *
 * 此腳本使用 Google Cloud service account 呼叫 Firestore REST API，
 * 不受前端 Firestore Rules 影響。請勿把 service account JSON 放進 Git。
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_TARGET_UID = 'R8kHfFPNvAhcqR5fErddUzHBNfJ2';
const DEFAULT_SEMESTER = '2026-1';
const SOURCE_PATH = ['shared', 'data', 'courses'];
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';

function printUsage() {
  console.log(`
同步大二上課表到 Brian 個人資料

用途：讀取 /shared/data/courses，整理課程順序後同步至
/users/{targetUid}/courses，並以 semester 欄位標記 ${DEFAULT_SEMESTER}。

預設為預覽模式，不會寫入。確認預覽結果後才加上 --apply。
共享來源不會被刪除，也不會處理其他學期。

使用方式：
  node scripts/sync-course-schedule.mjs --credentials <service-account.json> --project-id <project-id>

選項：
  --target-uid <uid>       Brian 的目標 UID；預設為 ${DEFAULT_TARGET_UID}
  --credentials <path>     service account JSON 路徑
  --project-id <id>        Firestore 專案 ID；未提供時讀 service account project_id
  --semester <value>       要同步的學期；預設為 ${DEFAULT_SEMESTER}
  --apply                  實際寫入目的地；省略時只預覽
  --help                   顯示說明

也可以使用環境變數：
  GOOGLE_APPLICATION_CREDENTIALS=<service-account.json>
  FIRESTORE_PROJECT_ID=<project-id>
  COURSE_SYNC_TARGET_UID=${DEFAULT_TARGET_UID}
`);
}

function parseArguments(argv) {
  const options = {
    targetUid: process.env.COURSE_SYNC_TARGET_UID || DEFAULT_TARGET_UID,
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
    projectId: process.env.FIRESTORE_PROJECT_ID || '',
    semester: DEFAULT_SEMESTER,
    apply: false,
    help: false,
  };

  const valueOptions = new Map([
    ['--target-uid', 'targetUid'],
    ['--credentials', 'credentialsPath'],
    ['--project-id', 'projectId'],
    ['--semester', 'semester'],
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (argument === '--apply') {
      options.apply = true;
      continue;
    }

    const optionName = valueOptions.get(argument);
    if (optionName) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} 缺少值`);
      }
      options[optionName] = value;
      index += 1;
      continue;
    }

    throw new Error(`不支援的選項：${argument}`);
  }

  return options;
}

function loadCredentials(credentialsPath) {
  if (!credentialsPath) {
    throw new Error('請提供 --credentials，或設定 GOOGLE_APPLICATION_CREDENTIALS');
  }

  const resolvedPath = path.resolve(credentialsPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`找不到 service account JSON：${resolvedPath}`);
  }

  let credentials;
  try {
    credentials = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  } catch (error) {
    throw new Error(`無法讀取 service account JSON：${error.message}`);
  }

  if (
    typeof credentials.project_id !== 'string' ||
    typeof credentials.client_email !== 'string' ||
    typeof credentials.private_key !== 'string'
  ) {
    throw new Error('service account JSON 缺少 project_id、client_email 或 private_key');
  }

  return credentials;
}

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

async function createAccessToken(credentials) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = encodeBase64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: FIRESTORE_SCOPE,
    aud: TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + 3600,
  }));
  const unsignedToken = `${header}.${payload}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsignedToken)
    .sign(credentials.private_key);
  const assertion = `${unsignedToken}.${encodeBase64Url(signature)}`;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const body = await response.json();

  if (!response.ok || typeof body.access_token !== 'string') {
    throw new Error(`取得 Google access token 失敗：${JSON.stringify(body)}`);
  }

  return body.access_token;
}

function getFirestoreBaseUrl(projectId) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
}

function getDocumentUrl(baseUrl, pathSegments) {
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
  return `${baseUrl}/${encodedPath}`;
}

async function requestFirestore(url, accessToken, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...init.headers,
    },
  });
  const text = await response.text();
  let body = {};

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!response.ok) {
    const detail = body.error?.message || body.raw || response.statusText;
    throw new Error(`Firestore API ${response.status}：${detail}`);
  }

  return body;
}

async function listDocuments(baseUrl, pathSegments, accessToken) {
  const documents = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams({ pageSize: '1000' });
    if (pageToken) params.set('pageToken', pageToken);

    const response = await requestFirestore(
      `${getDocumentUrl(baseUrl, pathSegments)}?${params}`,
      accessToken
    );

    if (Array.isArray(response.documents)) {
      documents.push(...response.documents);
    }
    pageToken = typeof response.nextPageToken === 'string' ? response.nextPageToken : '';
  } while (pageToken);

  return documents;
}

function getDocumentId(document) {
  if (!document || typeof document.name !== 'string') {
    throw new Error('Firestore 回應缺少合法文件名稱');
  }

  const pathSegments = document.name.split('/');
  return pathSegments[pathSegments.length - 1];
}

function getStringField(fields, fieldName) {
  const value = fields?.[fieldName]?.stringValue;
  return typeof value === 'string' ? value : null;
}

function getNumberField(fields, fieldName) {
  const value = fields?.[fieldName];
  const rawValue = value?.integerValue ?? value?.doubleValue;
  const numberValue = Number(rawValue);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function compareText(first, second) {
  return first.localeCompare(second, 'zh-Hant');
}

function compareCourses(first, second) {
  const firstDay = getNumberField(first.fields, 'day') ?? Number.MAX_SAFE_INTEGER;
  const secondDay = getNumberField(second.fields, 'day') ?? Number.MAX_SAFE_INTEGER;
  if (firstDay !== secondDay) return firstDay - secondDay;

  const firstStart = getStringField(first.fields, 'startTime') || '';
  const secondStart = getStringField(second.fields, 'startTime') || '';
  const startResult = compareText(firstStart, secondStart);
  if (startResult !== 0) return startResult;

  const firstEnd = getStringField(first.fields, 'endTime') || '';
  const secondEnd = getStringField(second.fields, 'endTime') || '';
  const endResult = compareText(firstEnd, secondEnd);
  if (endResult !== 0) return endResult;

  const firstName = getStringField(first.fields, 'name') || '';
  const secondName = getStringField(second.fields, 'name') || '';
  const nameResult = compareText(firstName, secondName);
  if (nameResult !== 0) return nameResult;

  return compareText(getDocumentId(first), getDocumentId(second));
}

function cloneFields(fields) {
  return JSON.parse(JSON.stringify(fields || {}));
}

function sanitizeDocumentId(value) {
  return value.replace(/[^A-Za-z0-9_-]/gu, '-').slice(0, 80);
}

function getShortHash(value) {
  return crypto.createHash('sha1').update(value).digest('hex').slice(0, 8);
}

function isTargetSemester(document, semester) {
  return getStringField(document.fields, 'semester') === semester;
}

function getCollisionDocumentId(sourceId, semester, targetDocuments) {
  const baseId = `course-${sanitizeDocumentId(semester)}-${sanitizeDocumentId(sourceId)}`;
  const existingBase = targetDocuments.get(baseId);
  if (!existingBase || isTargetSemester(existingBase, semester)) {
    return baseId;
  }

  return `${baseId}-${getShortHash(sourceId)}`;
}

function createTargetPlan(sourceDocuments, targetDocuments, semester) {
  return [...sourceDocuments]
    .sort(compareCourses)
    .map((sourceDocument, index) => {
      const sourceId = getDocumentId(sourceDocument);
      const preferredTarget = targetDocuments.get(sourceId);
      const targetId = !preferredTarget || isTargetSemester(preferredTarget, semester)
        ? sourceId
        : getCollisionDocumentId(sourceId, semester, targetDocuments);
      const existingTarget = targetDocuments.get(targetId);
      const fields = cloneFields(sourceDocument.fields);

      fields.semester = { stringValue: semester };
      fields.order = { integerValue: String(index + 1) };

      // 讓同一次執行中的後續課程也能避開已規劃的文件 ID。
      targetDocuments.set(targetId, { fields });

      return {
        sourceId,
        targetId,
        fields,
        action: existingTarget && isTargetSemester(existingTarget, semester)
          ? '更新'
          : '新增',
      };
    });
}

async function writeDocument(baseUrl, targetUid, plan, accessToken) {
  const targetPath = ['users', targetUid, 'courses', plan.targetId];
  await requestFirestore(getDocumentUrl(baseUrl, targetPath), accessToken, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: plan.fields }),
  });
}

function validateOptions(options) {
  if (!options.targetUid || options.targetUid.includes('/')) {
    throw new Error('--target-uid 必須是不可包含斜線的 UID');
  }
  if (!/^\d{4}-[12]$/u.test(options.semester)) {
    throw new Error('--semester 格式必須是 YYYY-1 或 YYYY-2');
  }
  if (options.semester !== DEFAULT_SEMESTER) {
    throw new Error(`目前只允許同步大二上 ${DEFAULT_SEMESTER}，其他學期請保留空白或另行建立資料`);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  validateOptions(options);
  const credentials = loadCredentials(options.credentialsPath);
  const projectId = options.projectId || credentials.project_id;
  const accessToken = await createAccessToken(credentials);
  const baseUrl = getFirestoreBaseUrl(projectId);
  const sourceDocuments = await listDocuments(baseUrl, SOURCE_PATH, accessToken);
  const targetDocuments = new Map(
    (await listDocuments(baseUrl, ['users', options.targetUid, 'courses'], accessToken))
      .map((document) => [getDocumentId(document), document])
  );
  const plans = createTargetPlan(sourceDocuments, targetDocuments, options.semester);

  console.log(`專案：${projectId}`);
  console.log(`來源：/${SOURCE_PATH.join('/')}`);
  console.log(`目標：/users/${options.targetUid}/courses`);
  console.log(`學期：${options.semester}`);
  console.log(`模式：${options.apply ? '實際寫入' : '預覽（不寫入）'}`);
  console.log(`來源課程：${sourceDocuments.length} 筆`);

  let created = 0;
  let updated = 0;
  for (const plan of plans) {
    console.log(`  ${plan.action}：${plan.sourceId} -> ${plan.targetId}（order ${plan.fields.order.integerValue}）`);
    if (plan.action === '新增') created += 1;
    if (plan.action === '更新') updated += 1;
    if (options.apply) {
      await writeDocument(baseUrl, options.targetUid, plan, accessToken);
    }
  }

  console.log(`\n完成：${options.apply ? '已處理' : '預計處理'} ${plans.length} 筆（新增 ${created}、更新 ${updated}）。`);
  console.log('未列入來源的 Brian 個人課程與其他學期資料未被刪除。');
  if (!options.apply) {
    console.log('確認預覽結果正確後，請重新執行並加上 --apply 才會寫入。');
  }
}

main().catch((error) => {
  console.error(`\n課表同步失敗：${error.message}`);
  process.exitCode = 1;
});
