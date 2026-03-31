const TG_API = 'https://api.telegram.org/bot';

async function getConfig() {
  try {
    const { prisma } = await import("@/lib/db");
    const configs = await prisma.config.findMany({
      where: { key: { in: ["telegramBotToken", "telegramChatId"] } },
    });
    const cfgMap = {};
    for (const c of configs) cfgMap[c.key] = c.value;
    if (cfgMap.telegramBotToken && cfgMap.telegramChatId) {
      return { token: cfgMap.telegramBotToken, chatId: cfgMap.telegramChatId };
    }
  } catch (e) {
    // DB not available
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    return { token, chatId };
  }

  return null;
}

/**
 * Send a message to the configured Telegram chat.
 * Throws if not configured or if the API call fails.
 */
export async function sendMessage(text, options = {}) {
  const config = await getConfig();
  if (!config) {
    throw new Error('Telegram not configured — set bot token and chat ID in Settings or environment variables');
  }

  const response = await fetch(`${TG_API}${config.token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...options,
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }
  return data;
}
