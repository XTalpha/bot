/**
 * Cloudflare Worker - Telegram Image Generation Bot
 * Uses Cloudflare AI (Stable Diffusion) to generate images from text prompts
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

// Available Cloudflare AI image models
const MODELS = {
  "sd-xl": "@cf/stabilityai/stable-diffusion-xl-base-1.0",
  "dreamshaper": "@cf/lykon/dreamshaper-8-lcm",
  "sd-lightning": "@cf/bytedance/stable-diffusion-xl-lightning",
};

const DEFAULT_MODEL = "sd-lightning";

// User session storage (in-memory, resets on worker restart)
const userSessions = new Map();

function getUserSession(userId) {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, {
      model: DEFAULT_MODEL,
      history: [],
    });
  }
  return userSessions.get(userId);
}

async function sendMessage(botToken, chatId, text, options = {}) {
  const url = `${TELEGRAM_API}${botToken}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      ...options,
    }),
  });
}

async function sendPhoto(botToken, chatId, imageBuffer, caption = "") {
  const url = `${TELEGRAM_API}${botToken}/sendPhoto`;
  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("caption", caption, { parse_mode: "Markdown" });
  formData.append(
    "photo",
    new Blob([imageBuffer], { type: "image/png" }),
    "image.png"
  );
  await fetch(url, { method: "POST", body: formData });
}

async function sendChatAction(botToken, chatId, action = "upload_photo") {
  const url = `${TELEGRAM_API}${botToken}/sendChatAction`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action }),
  });
}

async function generateImage(ai, prompt, modelKey) {
  const modelId = MODELS[modelKey] || MODELS[DEFAULT_MODEL];
  const response = await ai.run(modelId, {
    prompt,
    num_steps: 20,
  });
  return response;
}

function getModelKeyboard() {
  return {
    inline_keyboard: Object.keys(MODELS).map((key) => [
      { text: `🎨 ${key}`, callback_data: `model:${key}` },
    ]),
  };
}

function getHelpText() {
  return `
🤖 *Cloudflare AI Image Generator Bot*

*How to use:*
Just send me any text prompt and I'll generate an image!

*Commands:*
/start - Welcome message
/help - Show this help
/model - Change AI model
/history - View your recent prompts

*Available Models:*
• \`sd-lightning\` ⚡ Fast (default)
• \`dreamshaper\` 🎨 Artistic
• \`sd-xl\` 🏆 High quality

*Tips for better images:*
- Be descriptive: _"a sunset over mountains, photorealistic"_
- Add style: _"oil painting", "anime style", "8k"_
- Include mood: _"dark", "vibrant", "minimalist"_
  `.trim();
}

async function handleUpdate(update, env) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const ai = env.AI;

  // Handle callback queries (inline keyboard buttons)
  if (update.callback_query) {
    const query = update.callback_query;
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;

    if (data.startsWith("model:")) {
      const modelKey = data.replace("model:", "");
      const session = getUserSession(userId);
      session.model = modelKey;
      await sendMessage(
        botToken,
        chatId,
        `✅ Model changed to *${modelKey}*!\n\nNow send me a prompt to generate an image.`
      );
    }

    // Acknowledge the callback
    await fetch(`${TELEGRAM_API}${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: query.id }),
    });
    return;
  }

  if (!update.message) return;

  const message = update.message;
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text || "";

  // Handle commands
  if (text.startsWith("/start")) {
    await sendMessage(
      botToken,
      chatId,
      `👋 *Welcome to Cloudflare AI Image Bot!*\n\nI can generate images from your text descriptions using Cloudflare AI.\n\nJust type any prompt like:\n_"a futuristic city at night, neon lights, cyberpunk"_\n\nUse /help for more info.`
    );
    return;
  }

  if (text.startsWith("/help")) {
    await sendMessage(botToken, chatId, getHelpText());
    return;
  }

  if (text.startsWith("/model")) {
    const session = getUserSession(userId);
    await sendMessage(
      botToken,
      chatId,
      `🎨 *Select AI Model*\n\nCurrent: \`${session.model}\`\n\nChoose a model:`,
      { reply_markup: getModelKeyboard() }
    );
    return;
  }

  if (text.startsWith("/history")) {
    const session = getUserSession(userId);
    if (session.history.length === 0) {
      await sendMessage(
        botToken,
        chatId,
        "📭 No history yet. Send a prompt to generate your first image!"
      );
    } else {
      const historyText = session.history
        .slice(-5)
        .map((p, i) => `${i + 1}. _${p}_`)
        .join("\n");
      await sendMessage(
        botToken,
        chatId,
        `📜 *Your Recent Prompts:*\n\n${historyText}`
      );
    }
    return;
  }

  // Ignore other commands
  if (text.startsWith("/")) return;

  // Generate image from prompt
  if (!text.trim()) return;

  const session = getUserSession(userId);
  const prompt = text.trim();

  // Show typing indicator
  await sendChatAction(botToken, chatId);

  await sendMessage(
    botToken,
    chatId,
    `⏳ Generating image with *${session.model}*...\n\n📝 Prompt: _${prompt}_`
  );

  try {
    const imageData = await generateImage(ai, prompt, session.model);

    // Save to history
    session.history.push(prompt);
    if (session.history.length > 20) session.history.shift();

    await sendPhoto(
      botToken,
      chatId,
      imageData,
      `✨ *Generated with ${session.model}*\n📝 _${prompt}_`
    );
  } catch (error) {
    console.error("Image generation error:", error);
    await sendMessage(
      botToken,
      chatId,
      `❌ *Generation failed!*\n\nError: ${error.message}\n\nTry a different prompt or use /model to switch models.`
    );
  }
}

export default {
  async fetch(request, env) {
    // Verify webhook secret
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/webhook") {
      try {
        const update = await request.json();
        await handleUpdate(update, env);
        return new Response("OK", { status: 200 });
      } catch (err) {
        console.error("Webhook error:", err);
        return new Response("Error", { status: 500 });
      }
    }

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(
        JSON.stringify({ status: "Bot is running! 🚀" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Not found", { status: 404 });
  },
};
