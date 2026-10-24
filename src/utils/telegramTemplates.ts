import { TelegramAutoReplyRule } from '../types/telegram';

export const DEFAULT_TELEGRAM_RULES: TelegramAutoReplyRule[] = [
  {
    id: 'rule-spam-investment',
    name: 'ទប់ស្កាត់ Spam វិនិយោគ & កម្ចី (Loan & Investment Scams)',
    enabled: true,
    triggerType: 'keywords',
    keywords: [
      'កម្ចី',
      'ការប្រាក់',
      'វិនិយោគ',
      'រកលុយ',
      'loan',
      'forex',
      'crypto',
      'usdt',
      'earn money',
      'passive income',
      'ឆាតមកបង',
      'ការងារស្រួល',
      'ចំណូលបន្ថែម',
    ],
    responseTemplate:
      '⚠️ [សារស្វ័យប្រវត្តិ Auto-Reply]\nសួស្តី {first_name}! គណនីនេះមិនទទួលសារផ្សាយពាណិជ្ជកម្ម គម្រោងវិនិយោគ ឬការផ្តល់កម្ចីណាមួយឡើយ។\nសូមកុំផ្ញើសាររំខានបន្តទៀត! ប្រសិនបើនៅតែបន្ត គណនីរបស់អ្នកនឹងត្រូវ Report & Block ជាស្វ័យប្រវត្តិ។',
    action: 'reply_and_warn',
    delaySeconds: 1,
    matchCount: 142,
  },
  {
    id: 'rule-disturbing-harassment',
    name: 'ទប់ស្កាត់សាររំខាន ឬមិនសមរម្យ (Spam & Harassment Deflector)',
    enabled: true,
    triggerType: 'keywords',
    keywords: [
      'hi babe',
      'sexy',
      'បើកកាមេរ៉ា',
      'ផ្ញើរូប',
      'call me',
      'video call',
      'ផ្ញើលេខ',
      'លួចមើល',
      'សិច',
      'hack',
    ],
    responseTemplate:
      '🛑 [ប្រព័ន្ធទប់ស្កាត់សាររំខាន]\nគណនីរបស់អ្នកត្រូវបានកត់សម្គាល់ថាបានផ្ញើសាររំខាន។\nសារនេះត្រូវបានកត់ត្រាទុក ហើយការសន្ទនានេះត្រូវបាន Block ដោយស្វ័យប្រវត្តិ។',
    action: 'reply_and_block',
    delaySeconds: 1,
    matchCount: 68,
  },
  {
    id: 'rule-link-spammers',
    name: 'ទប់ស្កាត់ការទម្លាក់ Link ឬ Invite Channel (Link Dropper Filter)',
    enabled: true,
    triggerType: 'links',
    keywords: ['http', 'https', 't.me/', 'joinchat', 'bit.ly', 'telegram.me'],
    responseTemplate:
      '🚫 [Auto-Filter] គណនីនេះត្រូវបានកំណត់ឱ្យបដិសេធរាល់ការទម្លាក់ Link ឬ Link ចូល Group/Channel ដោយគ្មានការអនុញ្ញាត។\nសូមផ្ញើសារជាអក្សរធម្មតាវិញ ប្រសិនបើមានកិច្ចការងារចាំបាច់។',
    action: 'reply_only',
    delaySeconds: 2,
    matchCount: 94,
  },
  {
    id: 'rule-away-dnd',
    name: 'របៀបរវល់ខ្លាំង / មិននៅមុខកុំព្យូទ័រ (Busy / DND Auto-Reply)',
    enabled: false,
    triggerType: 'always_away',
    keywords: [],
    responseTemplate:
      '👋 សួស្តី {first_name}!\nខ្ញុំកំពុងជាប់រវល់ការងារ ឬមិននៅមុខអេក្រង់ទេ នៅម៉ោង {time} នេះ។\nខ្ញុំនឹងឆ្លើយតបមកកាន់អ្នកវិញនៅពេលទំនេរ។ ប្រសិនបើមានការបន្ទាន់ខ្លាំង សូមទាក់ទងតាមទូរស័ព្ទផ្ទាល់។ អរគុណ!',
    action: 'reply_only',
    delaySeconds: 2,
    matchCount: 31,
  },
  {
    id: 'rule-bot-human-check',
    name: 'ផ្ទៀងផ្ទាត់មនុស្សពិត (Captcha / Human Verification)',
    enabled: false,
    triggerType: 'stranger_dm',
    keywords: [],
    responseTemplate:
      '🤖 [Telegram Anti-Bot Guard]\nដើម្បីបញ្ជាក់ថាអ្នកជាមនុស្សពិតប្រាកដ និងមិនមែនជា Spam Bot សូមជួយវាយតួលេខ [ ៨ ៥ ២ ] ផ្ញើមកវិញដើម្បីបើកសិទ្ធិឆាត។ អរគុណ!',
    action: 'reply_only',
    delaySeconds: 1,
    matchCount: 19,
  },
];

export const TEMPLATE_PRESETS = [
  {
    id: 'anti_spam_khmer',
    name: '🛑 សារព្រមាន Spam ភាសាខ្មែរ (ស្តង់ដារ)',
    content:
      '⚠️ [សារស្វ័យប្រវត្តិ Auto-Reply]\nសួស្តី {first_name}! គណនីនេះមិនទទួលសារផ្សាយពាណិជ្ជកម្ម គម្រោងវិនិយោគ ឬការផ្តល់កម្ចីណាមួយឡើយ។\nសូមកុំផ្ញើសាររំខានបន្តទៀត! ប្រសិនបើនៅតែបន្ត គណនីរបស់អ្នកនឹងត្រូវ Report & Block ជាស្វ័យប្រវត្តិ។',
  },
  {
    id: 'immediate_block',
    name: '🚫 សារ Block ភ្លាមៗ (Strict Deflector)',
    content:
      '🛑 សាររបស់អ្នកត្រូវបានកំណត់ជាសាររំខាន (Spam Detected)។ គណនីនេះត្រូវបានបិទ (Blocked) ដោយស្វ័យប្រវត្តិ។ សូមកុំព្យាយាមទាក់ទងមកទៀត។',
  },
  {
    id: 'busy_meeting',
    name: '💼 កំពុងប្រជុំ / រវល់ខ្លាំង (Busy at Work)',
    content:
      '👋 សួស្តី {first_name}! ខ្ញុំកំពុងជាប់ប្រជុំ និងរវល់ការងារខ្លាំងនៅថ្ងៃនេះ ({date})។ ខ្ញុំនឹងពិនិត្យ និងឆ្លើយតបសាររបស់អ្នកនៅពេលចប់ភារកិច្ច។ អរគុណសម្រាប់ការយោគយល់!',
  },
  {
    id: 'human_captcha',
    name: '🧩 សំណួរផ្ទៀងផ្ទាត់មុនឆាត (Captcha Verification)',
    content:
      '🔒 [ផ្ទៀងផ្ទាត់សុវត្ថិភាព]\nដើម្បីការពារសាររំខានពី Bot សូមឆ្លើយសំណួរងាយៗនេះ៖\nតើ 5 + 3 ស្មើប៉ុន្មាន? សូមវាយចម្លើយផ្ញើមកវិញទើបសាររបស់អ្នកបង្ហាញនៅលើទូរស័ព្ទរបស់ខ្ញុំ។',
  },
  {
    id: 'english_anti_spam',
    name: '🌐 English Anti-Spam & Do Not Disturb',
    content:
      '🚫 [Auto-Reply] Hi {first_name}. This Telegram account does not accept unsolicited advertisements, investment offers, or crypto promotions. Spammers are automatically blocked and reported.',
  },
];

export function generatePythonTelethonScript(rules: TelegramAutoReplyRule[]): string {
  const activeKeywords = rules
    .filter((r) => r.enabled && r.triggerType === 'keywords')
    .flatMap((r) => r.keywords)
    .map((k) => `"${k.toLowerCase()}"`)
    .join(', ');

  const defaultReply = rules.find((r) => r.enabled)?.responseTemplate || 'សូមកុំផ្ញើសាររំខាន!';

  return `#!/usr/bin/env python3
"""
========================================================================
Telegram Personal Account Auto-Responder & Anti-Spam UserBot
បច្ចេកវិទ្យា: Python + Telethon (MTProto API)
មុខងារ: ដំណើរការលើគណនីតេឡេក្រាមផ្ទាល់ខ្លួន (Personal Account) ដើម្បីស្ទាក់ចាប់
និងឆ្លើយតបសារស្វ័យប្រវត្តិចំពោះអ្នកដែលផ្ញើសារមករំខាន / Spam / Strangers
========================================================================
របៀបដំឡើង និងដំណើរការ៖
1. ដំឡើង Library: pip install telethon
2. យក API_ID និង API_HASH ពីវេបសាយ: https://my.telegram.org (ចូល Apps)
3. Run កូដនេះ: python telegram_userbot.py
"""

import asyncio
from datetime import datetime
from telethon import TelegramClient, events

# ----------------- CONFIGURATION -----------------
# ទទួលបានពី https://my.telegram.org -> API development tools
API_ID = 12345678              # ជំនួសដោយ API ID របស់អ្នក
API_HASH = "your_api_hash_here" # ជំនួសដោយ API HASH របស់អ្នក
SESSION_NAME = "antispam_userbot_session"

# បញ្ជីពាក្យគន្លឹះ Spam ដែលត្រូវស្ទាក់ចាប់ (Blacklist Keywords)
SPAM_KEYWORDS = [
    ${activeKeywords || '"កម្ចី", "ការប្រាក់", "វិនិយោគ", "loan", "crypto", "forex", "ឆាតមកបង"'}
]

# សារឆ្លើយតបស្វ័យប្រវត្តិ
AUTO_REPLY_TEMPLATE = """${defaultReply}"""

# រក្សាទុក User ID ដែលបានឆ្លើយតបរួច ដើម្បីកុំឱ្យ Spam ឆ្លើយតបដដែលៗ (Flood Prevention)
responded_users = set()

# ចាប់ផ្តើម Client
client = TelegramClient(SESSION_NAME, API_ID, API_HASH)

@client.on(events.NewMessage(incoming=True))
async def handle_incoming_private_message(event):
    # ដំណើរការតែចំពោះ Private Chat (DM) ប៉ុណ្ណោះ មិនរំខានក្នុង Group ទេ
    if not event.is_private:
        return

    sender = await event.get_sender()
    sender_id = sender.id
    first_name = sender.first_name or "មិត្តភក្តិ"
    username = f"@{sender.username}" if sender.username else "No Username"
    text = (event.raw_text or "").lower()

    # ពិនិត្យមើលថាតើត្រូវលក្ខខណ្ឌ Spam ឬទេ
    is_spam = False
    matched_word = None

    for kw in SPAM_KEYWORDS:
        if kw in text:
            is_spam = True
            matched_word = kw
            break

    # ពិនិត្យមើល Link Dropping
    if "http://" in text or "https://" in text or "t.me/" in text:
        is_spam = True
        matched_word = "URL/Link"

    if is_spam:
        print(f"[🚨 SPAM DETECTED] ពី: {first_name} ({username}) | ពាក្យទាក់ទង: {matched_word}")
        print(f"   សារ: {event.raw_text}")

        # ការពារការឆ្លើយតបញឹកញាប់ពេក (ឆ្លើយតបតែម្តងគត់ក្នុងមួយ User)
        if sender_id not in responded_users:
            responded_users.add(sender_id)

            # រៀបចំសារឆ្លើយតប
            current_time = datetime.now().strftime("%I:%M %p")
            current_date = datetime.now().strftime("%Y-%m-%d")
            reply_text = (
                AUTO_REPLY_TEMPLATE
                .replace("{first_name}", first_name)
                .replace("{username}", username)
                .replace("{time}", current_time)
                .replace("{date}", current_date)
            )

            # រង់ចាំ ១ វិនាទី (ដើម្បីមើលទៅដូចធម្មជាតិ)
            await asyncio.sleep(1)

            # ផ្ញើសារឆ្លើយតប
            await event.reply(reply_text)
            print(f"[✅ AUTO-REPLIED] បានផ្ញើសារព្រមានទៅកាន់ {first_name} ដោយជោគជ័យ!")

            # ជម្រើស: បើចង់ Block ភ្លាមៗ អាចដោះ comment បន្ទាត់ខាងក្រោម៖
            # from telethon.tl.functions.contacts import BlockRequest
            # await client(BlockRequest(id=sender_id))
            # print(f"[🛑 BLOCKED] បាន Block {username} រួចរាល់!")

async def main():
    print("=" * 60)
    print("🤖 Telegram Anti-Spam UserBot កំពុងដំណើរការ...")
    print("កំពុងការពារគណនីផ្ទាល់ខ្លួនរបស់អ្នក 24/7 ពីសាររំខាន...")
    print("=" * 60)
    await client.start()
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
`;
}

export function generateNodeTelegrafScript(rules: TelegramAutoReplyRule[]): string {
  const activeKeywords = rules
    .filter((r) => r.enabled && r.triggerType === 'keywords')
    .flatMap((r) => r.keywords)
    .map((k) => `"${k.toLowerCase()}"`)
    .join(', ');

  const defaultReply = rules.find((r) => r.enabled)?.responseTemplate || 'សូមកុំផ្ញើសាររំខាន!';

  return `/**
 * ========================================================================
 * Telegram Official Bot Auto-Responder & Spam Filter
 * បច្ចេកវិទ្យា: Node.js + Telegraf / Node-Telegram-Bot-API
 * មុខងារ: ដំណើរការតាមរយៈ Telegram Bot API (Token ពី @BotFather)
 * ========================================================================
 * របៀបដំឡើង និងដំណើរការ៖
 * 1. npm install telegraf
 * 2. ដាក់ Bot Token របស់អ្នក
 * 3. node bot.js
 */

const { Telegraf } = require('telegraf');

// ដាក់ Telegram Bot Token ដែលបានមកពី @BotFather
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

const bot = new Telegraf(BOT_TOKEN);

const SPAM_KEYWORDS = [
  ${activeKeywords || '"កម្ចី", "ការប្រាក់", "វិនិយោគ", "loan", "crypto", "forex", "ឆាតមកបង"'}
];

const AUTO_REPLY = \`${defaultReply}\`;

// តាមដានរាល់សារដែលផ្ញើចូល
bot.on('message', async (ctx) => {
  const text = (ctx.message.text || '').toLowerCase();
  const user = ctx.from;
  const firstName = user.first_name || 'Friend';
  const username = user.username ? \`@\${user.username}\` : 'N/A';

  const isSpam = SPAM_KEYWORDS.some((kw) => text.includes(kw)) ||
                 text.includes('http://') ||
                 text.includes('https://') ||
                 text.includes('t.me/');

  if (isSpam) {
    console.log(\`[SPAM ALERT] From: \${firstName} (\${username}) - Message: \${ctx.message.text}\`);

    const now = new Date();
    const formattedReply = AUTO_REPLY
      .replace(/{first_name}/g, firstName)
      .replace(/{username}/g, username)
      .replace(/{time}/g, now.toLocaleTimeString())
      .replace(/{date}/g, now.toLocaleDateString());

    // ឆ្លើយតបស្វ័យប្រវត្តិ
    await ctx.reply(formattedReply);
    console.log(\`[REPLIED] Sent warning message to \${firstName}\`);
  }
});

bot.launch().then(() => {
  console.log('🤖 Telegram Auto-Responder Bot is actively running!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
`;
}
