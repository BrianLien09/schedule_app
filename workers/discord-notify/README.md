# Discord 每日行程通知 (Cloudflare Worker)

每天台灣時間 22:00 發送隔天的打工班表與未完成代辦；週日改發下週（週一到週日）總覽。
明日沒有任何安排時不會發送訊息。

每位使用者各發一則訊息，以不同顏色與作者名稱區分，內容分成「💼 打工班表」與「📝 代辦行程」兩個區塊。

## 部署

```bash
cd workers/discord-notify
npm install
npx wrangler secret put DISCORD_WEBHOOK_URL       # Discord 頻道設定 → 整合 → Webhook
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT  # 服務帳號 JSON 全文（角色：Cloud Datastore 檢視者）
npx wrangler secret put USER_UIDS                 # 格式：uid=顯示名稱，多人以逗號分隔，例如 abc123=小明,def456=小華
npx wrangler deploy
```

## 本機測試

```bash
npx wrangler dev --test-scheduled
# 另開終端機觸發：
curl "http://localhost:8787/__scheduled"
```

注意：免費版 Cron 可能有數十秒到數分鐘的誤差，無法保證整點準時。
