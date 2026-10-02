import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { getDataStatus, registerDataRead, resetDataStatus, retryFamilySync, trackDataOperation } from '../src/services/dataStatusStore';

beforeEach(resetDataStatus);

test('併行保存只有全部取得雲端確認後才結束', async () => {
  let finish: () => void = () => {};
  const waiting = trackDataOperation('save', 'a', () => new Promise<void>((resolve) => { finish = resolve; }));
  await trackDataOperation('save', 'b', async () => {});
  assert.equal(getDataStatus().saving, 1);
  finish();
  await waiting;
  assert.equal(getDataStatus().saving, 0);
  assert.equal(getDataStatus().hasSaved, true);
});

test('保存與家庭同步失敗分開，重試只重送失敗操作', async () => {
  let calls = 0;
  await assert.rejects(trackDataOperation('family', 'delete', async () => {
    calls += 1;
    if (calls === 1) throw new Error('permission-denied');
  }));
  await trackDataOperation('save', 'salary', async () => {});
  assert.equal(getDataStatus().saveFailures, 0);
  assert.equal(getDataStatus().familyFailures, 1);
  await retryFamilySync();
  assert.equal(calls, 2);
  assert.equal(getDataStatus().familyFailures, 0);
  assert.equal(getDataStatus().hasSynced, true);
});

test('切換帳號後不保留前一帳號的等待結果與重試', async () => {
  let finish: () => void = () => {};
  const waiting = trackDataOperation('save', 'old-user', () => new Promise<void>((resolve) => { finish = resolve; }));
  await assert.rejects(trackDataOperation('family', 'old-family', async () => { throw new Error('failed'); }));
  resetDataStatus();
  finish();
  await waiting;
  await retryFamilySync();
  assert.equal(getDataStatus().saving, 0);
  assert.equal(getDataStatus().hasSaved, false);
  assert.equal(getDataStatus().familyFailures, 0);
});

test('解除訂閱後不再計入快取、待保存與讀取錯誤', () => {
  const first = registerDataRead();
  const second = registerDataRead();
  first.update({ fromCache: true, pending: true, failed: false });
  second.update({ fromCache: true, pending: false, failed: true });
  assert.equal(getDataStatus().pending, true);
  assert.equal(getDataStatus().readFailures, 1);
  first.remove();
  second.remove();
  assert.equal(getDataStatus().cached, false);
  assert.equal(getDataStatus().pending, false);
  assert.equal(getDataStatus().readFailures, 0);
});

test('較舊請求的失敗不能覆蓋同一文件較新的成功', async () => {
  let fail: (error: Error) => void = () => {};
  const waiting = trackDataOperation('family', 'same', () => new Promise<void>((_resolve, reject) => { fail = reject; }));
  const rejected = assert.rejects(waiting);
  await trackDataOperation('family', 'same', async () => {});
  fail(new Error('old failure'));
  await rejected;
  assert.equal(getDataStatus().familyFailures, 0);
  assert.equal(getDataStatus().syncing, 0);
});
