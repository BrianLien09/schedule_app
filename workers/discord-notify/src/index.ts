import { fetchShifts, fetchTodos, getAccessToken, type ServiceAccount } from './firestore';
import { buildDailyMessage, buildWeeklyMessage, shiftItems, splitMessage, todoItems } from './message';
import { addDays, nextWeekRange, taiwanDate, weekdayIndex } from './time';

interface Env {
  /** Discord 頻道 Webhook 網址（secret） */
  DISCORD_WEBHOOK_URL: string;
  /** Firebase 服務帳號 JSON 字串（secret），需 Cloud Datastore 檢視者角色 */
  FIREBASE_SERVICE_ACCOUNT: string;
  /** 要通知的使用者 uid，以逗號分隔 */
  USER_UIDS: string;
}

async function postToDiscord(webhookUrl: string, content: string): Promise<void> {
  for (const chunk of splitMessage(content)) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: chunk }),
    });
    if (!response.ok) throw new Error(`Discord webhook 發送失敗：${response.status}`);
  }
}

async function notify(env: Env, now: Date): Promise<void> {
  const account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
  const uids = env.USER_UIDS.split(',').map((uid) => uid.trim()).filter(Boolean);
  const today = taiwanDate(now);
  // 週日晚上改發下週總覽（已涵蓋明天），避免同晚收到兩則重疊的訊息
  const isWeekly = weekdayIndex(today) === 0;
  const range = isWeekly ? nextWeekRange(today) : { start: addDays(today, 1), end: addDays(today, 1) };
  const token = await getAccessToken(account);

  for (const uid of uids) {
    const [shifts, todos] = await Promise.all([
      fetchShifts(token, account.project_id, uid, range.start, range.end),
      fetchTodos(token, account.project_id, uid, range.start, range.end),
    ]);
    const items = [...shiftItems(shifts, range.start, range.end), ...todoItems(todos, range.start, range.end)];
    const message = isWeekly ? buildWeeklyMessage(range.start, range.end, items) : buildDailyMessage(range.start, items);
    if (message) await postToDiscord(env.DISCORD_WEBHOOK_URL, message);
  }
}

const worker = {
  /** Cron 觸發入口；失敗時直接拋出，讓 Cloudflare 的 Cron 紀錄標示為失敗以便排查。 */
  async scheduled(controller: { scheduledTime: number }, env: Env): Promise<void> {
    await notify(env, new Date(controller.scheduledTime));
  },
};

export default worker;
