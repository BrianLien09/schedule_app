# Discord 每日行程通知 (Cloudflare Worker)

每天台灣時間 22:00 發送隔天的打工班表與未完成代辦；週日改發下週（週一到週日）總覽。
明日沒有任何安排時不會發送訊息。

## 部署

```bash
cd workers/discord-notify
npm install
npx wrangler secret put DISCORD_WEBHOOK_URL       # Discord 頻道設定 → 整合 → Webhook
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT  # 服務帳號 JSON 全文（角色：Cloud Datastore 檢視者）
npx wrangler secret put USER_UIDS                 # Firebase Auth uid，多個以逗號分隔
npx wrangler deploy
```

## 本機測試

```bash
npx wrangler dev --test-scheduled
# 另開終端機觸發：
curl "http://localhost:8787/__scheduled"
```

注意：免費版 Cron 可能有數十秒到數分鐘的誤差，無法保證整點準時。
