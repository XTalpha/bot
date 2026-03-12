#!/usr/bin/env node
/**
 * Run this script once after deploying to register your webhook with Telegram.
 * Usage: BOT_TOKEN=your_token WORKER_URL=https://your-worker.workers.dev node scripts/set-webhook.js
 */

const BOT_TOKEN = process.env.BOT_TOKEN;
const WORKER_URL = process.env.WORKER_URL;

if (!BOT_TOKEN || !WORKER_URL) {
  console.error("❌ Missing required env vars: BOT_TOKEN, WORKER_URL");
  console.log("Usage: BOT_TOKEN=xxx WORKER_URL=https://xxx.workers.dev node scripts/set-webhook.js");
  process.exit(1);
}

const webhookUrl = `${WORKER_URL}/webhook`;

async function setWebhook() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    }),
  });

  const data = await res.json();
  if (data.ok) {
    console.log(`✅ Webhook set successfully to: ${webhookUrl}`);
  } else {
    console.error("❌ Failed to set webhook:", data);
  }
}

async function getWebhookInfo() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("\n📋 Webhook Info:", JSON.stringify(data.result, null, 2));
}

setWebhook().then(getWebhookInfo);
