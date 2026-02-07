const TG_API = 'https://api.telegram.org/bot';

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  return { token, chatId };
}

/**
 * Send a message to the configured Telegram chat
 */
export async function sendMessage(text, options = {}) {
  const { token, chatId } = getConfig();
  if (!token || !chatId) {
    console.log('Telegram not configured, skipping notification');
    console.log('Message would have been:', text);
    return null;
  }

  try {
    const response = await fetch(`${TG_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram error:', data.description);
    }
    return data;
  } catch (error) {
    console.error('Telegram send error:', error.message);
    return null;
  }
}

/**
 * Format a weekly ranking report for Telegram
 */
export function formatWeeklyReport({ weekDate, critical, warnings, positive, stats, dashboardUrl }) {
  const lines = [];

  lines.push(`📊 <b>Ranking Report — ${weekDate}</b>`);
  lines.push('');

  if (critical.length > 0) {
    lines.push('🔴 <b>CRITICAL</b>');
    for (const a of critical) {
      lines.push(`  • <b>${a.keyword}</b>: ${a.details}`);
    }
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push('🟡 <b>WARNING</b>');
    for (const a of warnings) {
      lines.push(`  • <b>${a.keyword}</b>: ${a.details}`);
    }
    lines.push('');
  }

  if (positive.length > 0) {
    lines.push('🟢 <b>WINS</b>');
    for (const a of positive) {
      lines.push(`  • <b>${a.keyword}</b>: ${a.details}`);
    }
    lines.push('');
  }

  if (critical.length === 0 && warnings.length === 0 && positive.length === 0) {
    lines.push('✅ No significant changes this week. All steady.');
    lines.push('');
  }

  lines.push(`📈 <b>Total:</b> ${stats.urlCount} articles, ${stats.kwCount} keywords tracked`);

  if (dashboardUrl) {
    lines.push(`🔗 <a href="${dashboardUrl}">Open Dashboard</a>`);
  }

  return lines.join('\n');
}

/**
 * Send a quick alert for critical drops (immediate notification)
 */
export async function sendCriticalAlert({ keyword, url, oldPos, newPos, details }) {
  const text = [
    `🚨 <b>CRITICAL RANKING DROP</b>`,
    ``,
    `<b>${keyword}</b>`,
    `Position: #${oldPos} → #${newPos}`,
    details ? `Details: ${details}` : '',
    `URL: ${url}`,
  ].filter(Boolean).join('\n');

  return sendMessage(text);
}
