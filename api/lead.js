// Приймає заявку з форми лендингу і пересилає її в Telegram.
// Потрібні змінні середовища у Vercel: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const esc = (v, max) =>
  String(v == null ? '' : v)
    .slice(0, max)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  // Пастка для ботів: справжні люди це поле не бачать і не заповнюють
  if (body.website) return res.status(200).json({ ok: true });

  const name = esc(body.name, 100);
  const contact = esc(body.contact, 100);
  const niche = esc(body.niche, 200);
  const tier = esc(body.tier, 100);

  if (!name || !contact) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  const text =
    '🔔 <b>Нова заявка VYRON</b>\n\n' +
    '<b>Тариф:</b> ' + (tier || '—') + '\n' +
    '<b>Ім\'я:</b> ' + name + '\n' +
    '<b>Контакт:</b> ' + contact + '\n' +
    '<b>Ніша:</b> ' + (niche || '—');

  try {
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'telegram_error' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'network_error' });
  }
};
