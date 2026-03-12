# 🤖 Telegram AI Image Generator Bot

A Telegram bot that generates images from text prompts using **Cloudflare Workers AI** (Stable Diffusion models). Runs entirely on Cloudflare's edge network — no servers needed!

## ✨ Features

- 🎨 Generate images from text prompts
- 🔀 Switch between 3 AI models (fast, artistic, high-quality)
- 📜 View recent prompt history per user
- ⚡ Runs on Cloudflare Workers (free tier eligible)

## 🚀 Setup Guide

### 1. Create a Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts
3. Copy your **Bot Token** (looks like `123456:ABC-DEF...`)

### 2. Install Dependencies

```bash
npm install
```

### 3. Deploy to Cloudflare Workers

Make sure you're logged into Wrangler:
```bash
npx wrangler login
```

Deploy the worker:
```bash
npm run deploy
```

Note your worker URL (e.g., `https://telegram-image-bot.YOUR-SUBDOMAIN.workers.dev`)

### 4. Set Your Bot Token as a Secret

```bash
npm run set-token
# Paste your Telegram Bot Token when prompted
```

### 5. Register the Webhook

```bash
BOT_TOKEN=your_bot_token WORKER_URL=https://telegram-image-bot.your-subdomain.workers.dev npm run set-webhook
```

---

## 🎮 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/help` | Show help and tips |
| `/model` | Switch AI model |
| `/history` | View your last 5 prompts |
| _(any text)_ | Generate image from prompt |

## 🧠 Available Models

| Model Key | Cloudflare Model | Speed | Quality |
|-----------|-----------------|-------|---------|
| `sd-lightning` | stable-diffusion-xl-lightning | ⚡ Fast | Good |
| `dreamshaper` | dreamshaper-8-lcm | 🔄 Medium | Artistic |
| `sd-xl` | stable-diffusion-xl-base-1.0 | 🐢 Slower | High |

## 💡 Prompt Tips

- **Descriptive**: `"a golden retriever puppy on a beach at sunset, photorealistic"`
- **Artistic**: `"abstract digital art, vibrant colors, geometric shapes"`
- **Style tags**: append `"oil painting"`, `"anime"`, `"8k ultra HD"`, `"cinematic"`

## 📁 Project Structure

```
cloudflare-image-bot/
├── src/
│   └── index.js          # Main worker code
├── scripts/
│   └── set-webhook.js    # Webhook registration script
├── wrangler.toml         # Cloudflare Workers config
└── package.json
```

## 🔧 Local Development

```bash
npm run dev
```

Then use [ngrok](https://ngrok.com/) to expose localhost and set it as your webhook temporarily.

## 📝 Notes

- Cloudflare AI is available on **Workers Paid plan** or with AI Gateway
- Free tier may have rate limits on AI inference
- User sessions are in-memory and reset when the worker restarts
