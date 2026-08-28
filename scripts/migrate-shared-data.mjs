#!/usr/bin/env node

/**
 * 將舊版共用個人資料遷移到指定使用者的 UID 路徑。
 *
 * 安全設計：
 * - 預設只預覽，不會寫入資料庫。
 * - 必須明確提供 target UID，避免把資料誤分給錯誤帳號。
 * - 只複製文件，不刪除來源資料。
 * - 預設跳過目的地已存在的文件，避免覆蓋新資料。
 * - 不處理 shared/data/gameGuides，遊戲攻略應維持共用路徑。
 *
 * 此腳本使用 Google Cloud service account 呼叫 Firestore REST API，
 * 因此不受即將發布的前端 Firestore Rules 影響。請勿把 service account
 * JSON 放進 Git 或提交到 repository。
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_COLLECTIONS = [
  'courses',
  'workShifts',
  'salaryRecords',
  'events',
  'allowanceRecords',
  'allowanceSourceTypes',
  'shiftTemplates',
  'courseNotes',
];

const DEFAULT_TARGET_UID = 'R8kHfFPNvAhcqR5fErddUzHBNfJ2';
const ALLOWED_COLLECTIONS = new Set(DEFAULT_COLLECTIONS);
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';

function printUsage() {
  console.log(`
Firestore 舊資料遷移工具

用途：將舊的 /shared/data/{collection} 個人資料複製到
/users/{targetUid}/{collection}，保留原文件 ID。

預設為預覽模式，不會寫入。確認預覽結果後才加上 --apply。

使用方式：
  node scripts/migrate-shared-data.mjs --credentials <service-account.json> --project-id schedule-app-ed4c1

選項：
  --target-uid <uid>       目的使用者 UID；預設為 ${DEFAULT_TARGET_UID}
  --credentials <path>     service account JSON 路徑
  --project-id <id>        Firestore 專案 ID；未提供時讀 service account project_id
  --collections <list>     逗號分隔的集合；預設遷移全部個人集合
  --apply                  實際寫入目的地；省略時只預覽
  --overwrite              覆蓋目的地已存在的文件；只應在確認後使用
  --help                   顯示說明

也可以使用環境變數：
  GOOGLE_APPLICATION_CREDENTIALS=<service-account.json>
  FIRESTORE_PROJECT_ID=schedule-app-ed4c1
  MIGRATION_TARGET_UID=${DEFAULT_TARGET_UID}
`);
}

function parseArguments(argv) {
  const options = {
    targetUid: process.env.MIGRATION_TARGET_UID || DEFAULT_TARGET_UID,
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
    projectId: process.env.FIRESTORE_PROJECT_ID || '',
    collectionArgs: [],
    apply: false,
    overwrite: false,
    help: false,
  };

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
    if (argument === '--overwrite') {
      options.overwrite = true;
      continue;
    }

    const valueOptions = new Map([
      ['--target-uid', 'targetUid'],
      ['--credentials', 'credentialsPath'],
      ['--project-id', 'projectId'],
      ['--collections', 'collectionArgs'],
      ['--collection', 'collectionArgs'],
    ]);
    const optionName = valueOptions.get(argument);

    if (optionName) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} 缺少值`);
      }
      if (optionName === 'collectionArgs') {
        options.collectionArgs.push(value);
      } else {
        options[optionName] = value;
      }
      index += 1;
      continue;
    }

    throw new Error(`不支援的選項：${argument}`);
  }

  const collections = options.collectionArgs.length > 0
    ? options.collectionArgs
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter(Boolean)
    : DEFAULT_COLLECTIONS;

  return { ...options, collections };
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
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    ...init.headers,
  };

  const response = await fetch(url, { ...init, headers });
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

async function listDocuments(baseUrl, collectionName, accessToken) {
  const documents = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams({ pageSize: '1000' });
    if (pageToken) params.set('pageToken', pageToken);

    const response = await requestFirestore(
      `${getDocumentUrl(baseUrl, ['shared', 'data'])}/${encodeURIComponent(collectionName)}?${params}`,
      accessToken
    );

    if (Array.isArray(response.documents)) {
      documents.push(...response.documents);
    }
    pageToken = typeof response.nextPageToken === 'string' ? response.nextPageToken : '';
  } while (pageToken);

  return documents;
}

async function getDocument(baseUrl, pathSegments, accessToken) {
  const response = await fetch(getDocumentUrl(baseUrl, pathSegments), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (response.status === 404) return null;

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`讀取目的文件失敗（${response.status}）：${text}`);
  }
  return text ? JSON.parse(text) : null;
}

function getDocumentId(document) {
  if (!document || typeof document.name !== 'string') {
    throw new Error('來源回應缺少合法文件名稱');
  }

  const pathSegments = document.name.split('/');
  return pathSegments[pathSegments.length - 1];
}

async function migrateCollection({
  baseUrl,
  collectionName,
  targetUid,
  accessToken,
  apply,
  overwrite,
}) {
  const sourceDocuments = await listDocuments(baseUrl, collectionName, accessToken);
  let copied = 0;
  let skipped = 0;

  console.log(`\n[${collectionName}] 找到 ${sourceDocuments.length} 筆舊資料`);

  for (const sourceDocument of sourceDocuments) {
    const documentId = getDocumentId(sourceDocument);
    const destinationPath = ['users', targetUid, collectionName, documentId];
    const destinationUrl = getDocumentUrl(baseUrl, destinationPath);
    const existingDocument = await getDocument(baseUrl, destinationPath, accessToken);

    if (existingDocument && !overwrite) {
      console.log(`  略過已存在：${documentId}`);
      skipped += 1;
      continue;
    }

    const mode = existingDocument ? '覆蓋預覽' : '新增預覽';
    if (!apply) {
      console.log(`  ${mode}：/users/${targetUid}/${collectionName}/${documentId}`);
      copied += 1;
      continue;
    }

    await requestFirestore(destinationUrl, accessToken, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: sourceDocument.fields || {} }),
    });
    console.log(`  已複製：${documentId}`);
    copied += 1;
  }

  return { copied, skipped };
}

function validateOptions(options) {
  if (!options.targetUid) {
    throw new Error('必須提供 --target-uid；請先從 Firebase Authentication 取得目標 UID');
  }
  if (options.targetUid.includes('/')) {
    throw new Error('--target-uid 不可包含斜線');
  }
  if (options.overwrite && !options.apply) {
    console.warn('注意：--overwrite 在預覽模式只會顯示覆蓋計畫，尚未寫入');
  }

  const invalidCollections = options.collections.filter(
    (collectionName) => !ALLOWED_COLLECTIONS.has(collectionName)
  );
  if (invalidCollections.length > 0) {
    throw new Error(
      `不允許遷移的集合：${invalidCollections.join(', ')}。遊戲攻略必須留在 shared/data/gameGuides。`
    );
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
  const mode = options.apply ? '實際寫入' : '預覽（不寫入）';

  console.log(`專案：${projectId}`);
  console.log(`目標 UID：${options.targetUid}`);
  console.log(`模式：${mode}`);
  console.log(`集合：${options.collections.join(', ')}`);

  const totals = { copied: 0, skipped: 0 };
  for (const collectionName of options.collections) {
    const result = await migrateCollection({
      baseUrl,
      collectionName,
      targetUid: options.targetUid,
      accessToken,
      apply: options.apply,
      overwrite: options.overwrite,
    });
    totals.copied += result.copied;
    totals.skipped += result.skipped;
  }

  console.log(`\n完成：${options.apply ? '已複製' : '預計複製'} ${totals.copied} 筆，略過 ${totals.skipped} 筆。`);
  if (!options.apply) {
    console.log('確認預覽結果正確後，請重新執行並加上 --apply 才會寫入。');
  }
}

main().catch((error) => {
  console.error(`\n遷移失敗：${error.message}`);
  process.exitCode = 1;
});
