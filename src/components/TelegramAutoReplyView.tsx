import React, { useState } from 'react';
import {
  Send,
  ShieldAlert,
  Bot,
  User,
  Zap,
  Play,
  RotateCcw,
  Check,
  Copy,
  Download,
  Plus,
  Trash2,
  FileCode,
  Radio,
  Clock,
  Sparkles,
  Search,
  MessageSquare,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import {
  TelegramAutoReplyRule,
  TelegramBotStatus,
  TelegramMessageLog,
  TelegramMode,
} from '../types/telegram';
import {
  DEFAULT_TELEGRAM_RULES,
  TEMPLATE_PRESETS,
  generateNodeTelegrafScript,
  generatePythonTelethonScript,
} from '../utils/telegramTemplates';

export const TelegramAutoReplyView: React.FC = () => {
  // Mode: 'userbot' (Personal Account) | 'bot' (Telegram Bot API)
  const [telegramMode, setTelegramMode] = useState<TelegramMode>('userbot');

  // Credentials
  const [botToken, setBotToken] = useState<string>('demo');
  const [testChatId, setTestChatId] = useState<string>('123456789');
  const [botStatus, setBotStatus] = useState<TelegramBotStatus>({
    connected: true,
    botUsername: 'antispam_deflector_bot',
    botFirstName: 'AntiSpam Defender Bot',
    botId: 7924180421,
    lastChecked: 'Just now',
  });
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  // Rules State
  const [rules, setRules] = useState<TelegramAutoReplyRule[]>(DEFAULT_TELEGRAM_RULES);
  const [selectedRuleId, setSelectedRuleId] = useState<string>(DEFAULT_TELEGRAM_RULES[0].id);

  // Simulator Inputs
  const [simSenderName, setSimSenderName] = useState<string>('Sok Chea (Spammer)');
  const [simSenderUsername, setSimSenderUsername] = useState<string>('sok_fastloan');
  const [simIncomingText, setSimIncomingText] = useState<string>(
    'សួស្តីបង! ខាងខ្ញុំមានសេវាកម្ចីរហ័សការប្រាក់ទាប វិនិយោគ 100$ ចំណេញ 500$ ឆាតមកបងឥឡូវនេះ!'
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<{
    matched: boolean;
    ruleName?: string;
    replyText?: string;
    action?: string;
  } | null>(null);

  // Activity Logs
  const [logs, setLogs] = useState<TelegramMessageLog[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
      senderName: 'Crypto Trader VIP',
      senderUsername: '@fast_crypto_vip',
      senderId: '849102941',
      incomingMessage: 'Hello! Join our VIP crypto signals channel t.me/vip_signals',
      triggeredRuleName: 'ទប់ស្កាត់ការទម្លាក់ Link ឬ Invite Channel',
      replySent: '🚫 [Auto-Filter] គណនីនេះត្រូវបានកំណត់ឱ្យបដិសេធរាល់ការទម្លាក់ Link...',
      actionTaken: 'reply_only',
      status: 'sent',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toLocaleTimeString(),
      senderName: 'Fast Loan KH',
      senderUsername: '@loan_cambodia',
      senderId: '984124501',
      incomingMessage: 'បងត្រូវការខ្ចីលុយការប្រាក់ទាបអត់? ដាក់ពាក្យ 10 នាទីបានលុយ',
      triggeredRuleName: 'ទប់ស្កាត់ Spam វិនិយោគ & កម្ចី',
      replySent: '⚠️ [សារស្វ័យប្រវត្តិ Auto-Reply] សួស្តី! គណនីនេះមិនទទួលសារផ្សាយពាណិជ្ជកម្ម...',
      actionTaken: 'reply_and_warn',
      status: 'sent',
    },
  ]);

  // Script Modal
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [activeScriptTab, setActiveScriptTab] = useState<'python' | 'nodejs'>('python');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // New Keyword input for selected rule
  const [newKeywordInput, setNewKeywordInput] = useState<string>('');

  const activeRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

  // Test Bot Connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionMessage(null);
    try {
      const res = await fetch('/api/telegram/test-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken }),
      });
      const data = await res.json();
      if (data.success) {
        setBotStatus({
          connected: true,
          botUsername: data.bot.username,
          botFirstName: data.bot.first_name,
          botId: data.bot.id,
          lastChecked: 'Just now',
        });
        setConnectionMessage(`✓ ${data.message}`);
      } else {
        setBotStatus({ connected: false, error: data.error });
        setConnectionMessage(`✕ ${data.error}`);
      }
    } catch {
      setBotStatus({ connected: false, error: 'Network error' });
      setConnectionMessage('✕ មិនអាចតភ្ជាប់ទៅ Server បានទេ');
    } finally {
      setIsTestingConnection(false);
      setTimeout(() => setConnectionMessage(null), 5000);
    }
  };

  // Toggle Rule
  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  // Add Keyword
  const handleAddKeyword = () => {
    if (!newKeywordInput.trim()) return;
    const kw = newKeywordInput.trim().toLowerCase();
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === selectedRuleId && !r.keywords.includes(kw)) {
          return { ...r, keywords: [...r.keywords, kw] };
        }
        return r;
      })
    );
    setNewKeywordInput('');
  };

  // Remove Keyword
  const handleRemoveKeyword = (kwToRemove: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === selectedRuleId) {
          return { ...r, keywords: r.keywords.filter((k) => k !== kwToRemove) };
        }
        return r;
      })
    );
  };

  // Update Response Template
  const handleUpdateTemplate = (newTemplate: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === selectedRuleId ? { ...r, responseTemplate: newTemplate } : r))
    );
  };

  // Apply Template Preset
  const handleApplyPreset = (presetContent: string) => {
    handleUpdateTemplate(presetContent);
  };

  // Add New Rule
  const handleAddNewRule = () => {
    const newId = `rule-custom-${Date.now()}`;
    const newRule: TelegramAutoReplyRule = {
      id: newId,
      name: 'ច្បាប់ទប់ស្កាត់ថ្មី (Custom Anti-Spam Rule)',
      enabled: true,
      triggerType: 'keywords',
      keywords: ['spam', 'promo', 'ឈ្នះរង្វាន់'],
      responseTemplate:
        '⚠️ [Auto-Reply] សូមកុំផ្ញើសាររំខាន! គណនីនេះមិនទទួលសារផ្សាយពាណិជ្ជកម្មឡើយ។',
      action: 'reply_only',
      delaySeconds: 1,
      matchCount: 0,
    };
    setRules((prev) => [...prev, newRule]);
    setSelectedRuleId(newId);
  };

  // Delete Rule
  const handleDeleteRule = (ruleId: string) => {
    if (rules.length <= 1) return;
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    if (selectedRuleId === ruleId) {
      const remaining = rules.filter((r) => r.id !== ruleId);
      setSelectedRuleId(remaining[0]?.id || '');
    }
  };

  // Run Simulation / Send Message
  const handleSimulateIncoming = async (forceRealSend: boolean = false) => {
    setIsSimulating(true);
    setSimulationResult(null);

    // Evaluate against enabled rules
    const lowerText = simIncomingText.toLowerCase();
    let matchedRule: TelegramAutoReplyRule | null = null;
    let matchedKeywords: string[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      if (rule.triggerType === 'keywords') {
        const found = rule.keywords.filter((kw) => lowerText.includes(kw.toLowerCase()));
        if (found.length > 0) {
          matchedRule = rule;
          matchedKeywords = found;
          break;
        }
      } else if (rule.triggerType === 'links') {
        if (
          lowerText.includes('http://') ||
          lowerText.includes('https://') ||
          lowerText.includes('t.me/')
        ) {
          matchedRule = rule;
          matchedKeywords = ['URL/Link'];
          break;
        }
      } else if (rule.triggerType === 'always_away') {
        matchedRule = rule;
        matchedKeywords = ['Away/DND Mode'];
        break;
      } else if (rule.triggerType === 'stranger_dm') {
        matchedRule = rule;
        matchedKeywords = ['Stranger DM'];
        break;
      }
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString();

    if (matchedRule) {
      const replyFormatted = matchedRule.responseTemplate
        .replace(/{first_name}/g, simSenderName)
        .replace(/{username}/g, simSenderUsername ? `@${simSenderUsername}` : '')
        .replace(/{time}/g, timeStr)
        .replace(/{date}/g, dateStr);

      setSimulationResult({
        matched: true,
        ruleName: matchedRule.name,
        replyText: replyFormatted,
        action: matchedRule.action,
      });

      // Update rule match count
      setRules((prev) =>
        prev.map((r) =>
          r.id === matchedRule?.id ? { ...r, matchCount: r.matchCount + 1 } : r
        )
      );

      // If force real send, make API call to /api/telegram/send-message
      if (forceRealSend && testChatId) {
        try {
          await fetch('/api/telegram/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              botToken,
              chatId: testChatId,
              text: replyFormatted,
            }),
          });
        } catch (e) {
          console.error(e);
        }
      }

      // Add to logs
      const newLog: TelegramMessageLog = {
        id: `log-${Date.now()}`,
        timestamp: now.toLocaleTimeString(),
        senderName: simSenderName,
        senderUsername: simSenderUsername ? `@${simSenderUsername}` : undefined,
        senderId: testChatId || '987654321',
        incomingMessage: simIncomingText,
        triggeredRuleName: matchedRule.name,
        matchedKeywords,
        replySent: replyFormatted,
        actionTaken: matchedRule.action,
        status: 'sent',
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    } else {
      setSimulationResult({
        matched: false,
      });
      const newLog: TelegramMessageLog = {
        id: `log-${Date.now()}`,
        timestamp: now.toLocaleTimeString(),
        senderName: simSenderName,
        senderUsername: simSenderUsername ? `@${simSenderUsername}` : undefined,
        senderId: testChatId || '987654321',
        incomingMessage: simIncomingText,
        actionTaken: 'ignored',
        status: 'simulated',
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    }

    setIsSimulating(false);
  };

  // Download code helper
  const handleDownloadCode = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const pythonScript = generatePythonTelethonScript(rules);
  const nodejsScript = generateNodeTelegrafScript(rules);

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Send className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-zinc-100">
                Telegram Auto-Responder &amp; Anti-Spam Deflector
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Auto-Reply Engine Active
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              ឧបករណ៍ឆ្លើយតបសារស្វ័យប្រវត្តិ (Auto-Reply) និងទប់ស្កាត់ Spam តាម Telegram សម្រាប់ឆ្លើយតបទៅអ្នកដែលផ្ញើសារមករំខាន,
              គម្រោងកម្ចីបោកប្រាស់, វិនិយោគ Forex/Crypto, ឬ Link ចូល Group ដោយស្វ័យប្រវត្តិតាមរយៈពាក្យគន្លឹះ (Keywords) ឬគណនីផ្ទាល់ខ្លួន (UserBot)។
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Switcher */}
            <div className="bg-zinc-950 p-1 border border-zinc-800 rounded-xl flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setTelegramMode('userbot')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                  telegramMode === 'userbot'
                    ? 'bg-sky-500 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="ដំណើរការឆ្លើយតបលើគណនី Telegram ផ្ទាល់ខ្លួន (Private Chats)"
              >
                <User className="w-3.5 h-3.5" />
                <span>គណនីផ្ទាល់ខ្លួន (UserBot)</span>
              </button>
              <button
                type="button"
                onClick={() => setTelegramMode('bot')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                  telegramMode === 'bot'
                    ? 'bg-sky-500 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="ដំណើរការតាមរយៈ Telegram Bot API (@BotFather)"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Bot API (@BotFather)</span>
              </button>
            </div>

            {/* Export Scripts Button */}
            <button
              type="button"
              onClick={() => setIsScriptModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>កូដ Python &amp; Node.js (24/7 VPS)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Configuration & Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rules & Template Engine (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Rules List & Selection */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-zinc-200 font-mono">
                  ច្បាប់ស្ទាក់ចាប់ &amp; ពាក្យគន្លឹះ (Anti-Spam Rules: {rules.length})
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddNewRule}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-medium transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>បន្ថែមច្បាប់ថ្មី</span>
              </button>
            </div>

            <div className="divide-y divide-zinc-800/80 max-h-[300px] overflow-y-auto">
              {rules.map((rule) => {
                const isSelected = rule.id === selectedRuleId;
                return (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`p-3.5 flex items-center justify-between gap-3 transition cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-sky-950/30 border-l-4 border-sky-400'
                        : 'hover:bg-zinc-850/50'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Checkbox toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRule(rule.id);
                        }}
                        className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 transition ${
                          rule.enabled
                            ? 'bg-emerald-500 text-zinc-950'
                            : 'bg-zinc-800 border border-zinc-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-semibold truncate ${
                              isSelected ? 'text-sky-300' : 'text-zinc-200'
                            }`}
                          >
                            {rule.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                            {rule.triggerType}
                          </span>
                          {rule.matchCount > 0 && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              ✓ {rule.matchCount} matched
                            </span>
                          )}
                        </div>

                        <p className="text-zinc-400 text-[11px] truncate">
                          {rule.triggerType === 'keywords'
                            ? `Keywords: ${rule.keywords.slice(0, 5).join(', ')}${
                                rule.keywords.length > 5 ? '...' : ''
                              }`
                            : rule.triggerType === 'links'
                            ? 'ស្ទាក់ចាប់រាល់សារដែលមាន Link (http, t.me, etc.)'
                            : rule.triggerType === 'always_away'
                            ? 'ឆ្លើយតបគ្រប់សារពេលកំពុងរវល់ (DND)'
                            : 'ផ្ទៀងផ្ទាត់សារពីមនុស្សមិនស្គាល់'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          rule.action === 'reply_and_block'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            : rule.action === 'reply_and_warn'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {rule.action === 'reply_and_block'
                          ? 'Auto-Block'
                          : rule.action === 'reply_and_warn'
                          ? 'Warn Spammer'
                          : 'Reply Only'}
                      </span>
                      {rules.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRule(rule.id);
                          }}
                          className="text-zinc-500 hover:text-rose-400 p-1 transition"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit Selected Rule Details */}
          {activeRule && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-wrap gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono text-sky-400 font-semibold">
                    កែសម្រួលច្បាប់: {activeRule.name}
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    កំណត់ពាក្យគន្លឹះ និងពាក្យពេចន៍ឆ្លើយតបស្វ័យប្រវត្តិចំពោះអ្នកផ្ញើសាររំខាន
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">សកម្មភាព:</span>
                  <select
                    value={activeRule.action}
                    onChange={(e) =>
                      setRules((prev) =>
                        prev.map((r) =>
                          r.id === activeRule.id
                            ? { ...r, action: e.target.value as any }
                            : r
                        )
                      )
                    }
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="reply_only">Reply Only (ឆ្លើយតបតែប៉ុណ្ណោះ)</option>
                    <option value="reply_and_warn">Reply &amp; Warn (ឆ្លើយតប និងព្រមាន)</option>
                    <option value="reply_and_block">Reply &amp; Block (ឆ្លើយតប និង Block)</option>
                  </select>
                </div>
              </div>

              {/* Keywords Tag Manager (if triggerType is keywords) */}
              {activeRule.triggerType === 'keywords' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                    <span>ពាក្យគន្លឹះដែលត្រូវស្ទាក់ចាប់ (Blacklist Keywords):</span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {activeRule.keywords.length} keywords
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newKeywordInput}
                      onChange={(e) => setNewKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                      placeholder="វាយពាក្យគន្លឹះ រួចចុច Enter (ឧ. កម្ចី, វិនិយោគ, forex, loan...)"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-sky-500 transition"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition cursor-pointer"
                    >
                      បន្ថែម
                    </button>
                  </div>

                  {/* Keyword Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
                    {activeRule.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono"
                      >
                        <span>{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="text-zinc-500 hover:text-rose-400 ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Message Template */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>សារឆ្លើយតបស្វ័យប្រវត្តិ (Response Message):</span>
                  </label>

                  {/* Preset Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-[11px] text-zinc-400">ពុម្ពគំរូ:</span>
                    <select
                      onChange={(e) => {
                        const found = TEMPLATE_PRESETS.find((p) => p.id === e.target.value);
                        if (found) handleApplyPreset(found.content);
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded-md px-2 py-0.5 text-[11px] text-zinc-300 outline-none focus:border-sky-500 cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        ជ្រើសរើសពុម្ពសារ...
                      </option>
                      {TEMPLATE_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={activeRule.responseTemplate}
                  onChange={(e) => handleUpdateTemplate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono outline-none focus:border-sky-500 leading-relaxed transition"
                  placeholder="សរសេរសារឆ្លើយតបស្វ័យប្រវត្តនៅទីនេះ..."
                />

                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Variables: {'{first_name}'}, {'{username}'}, {'{time}'}, {'{date}'}</span>
                  <span>Delay: {activeRule.delaySeconds}s</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Tester & Live Logs (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Telegram Credentials Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                {telegramMode === 'userbot'
                  ? 'UserBot Settings (គណនីផ្ទាល់ខ្លួន)'
                  : 'Bot API Connection (@BotFather)'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                  botStatus.connected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    botStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                  }`}
                ></span>
                {botStatus.connected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {telegramMode === 'bot' ? (
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Bot Token (ពី @BotFather):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="password"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="123456789:ABCdefGHIjklMNOpqrs..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer"
                    >
                      {isTestingConnection ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                </div>

                {connectionMessage && (
                  <p
                    className={`text-[11px] font-mono ${
                      connectionMessage.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {connectionMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-sky-950/20 border border-sky-500/20 text-sky-300 text-[11px] space-y-1">
                  <span className="font-semibold block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    របៀបដំណើរការឆ្លើយតបឆាតផ្ទាល់ខ្លួន (UserBot):
                  </span>
                  <p className="text-zinc-300 leading-relaxed">
                    UserBot ដំណើរការលើគណនី Telegram ផ្ទាល់ខ្លួនរបស់អ្នក 24/7 (មិនមែន Bot ទេ)។
                    រាល់ពេលមានអ្នកឆាតមករំខានក្នុង Private Chat ប្រព័ន្ធនឹង Auto-reply និង Block ភ្លាមៗ។
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScriptModalOpen(true)}
                  className="w-full py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>ទាញយក Python Script សម្រាប់ Run លើ PC / VPS</span>
                </button>
              </div>
            )}
          </div>

          {/* Interactive Live Message Simulator */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-amber-400" />
                សាកល្បងស្ទាក់ចាប់សារភ្លាមៗ (Test Live Simulator)
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Interactive</span>
            </div>

            {/* Quick Sample Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400">ជ្រើសរើសសារគំរូដើម្បីសាកល្បង៖</span>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {[
                  {
                    label: '💸 កម្ចីការប្រាក់ទាប',
                    text: 'សួស្តីបង! មានកម្ចីរហ័សការប្រាក់ទាប វិនិយោគចំណេញច្រើន ឆាតមកបង!',
                  },
                  {
                    label: '🔗 ទម្លាក់ Link Spam',
                    text: 'Hello dear! Check this hot channel: https://t.me/free_crypto_airdrop',
                  },
                  {
                    label: '👋 សារធម្មតា',
                    text: 'សួស្តីបងសុខសប្បាយទេ? ទំនេរជជែកគ្នាលេងបន្តិច?',
                  },
                  {
                    label: '🚫 សាររំខាន',
                    text: 'Hi babe call me please! បើកកាមេរ៉ាមើលមុខបន្តិចមក!',
                  },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setSimIncomingText(s.text)}
                    className="px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Input Area */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Sender Name:</label>
                  <input
                    type="text"
                    value={simSenderName}
                    onChange={(e) => setSimSenderName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Username:</label>
                  <input
                    type="text"
                    value={simSenderUsername}
                    onChange={(e) => setSimSenderUsername(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-0.5">Incoming Message Text:</label>
                <textarea
                  rows={2}
                  value={simIncomingText}
                  onChange={(e) => setSimIncomingText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSimulateIncoming(false)}
                  disabled={isSimulating}
                  className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>សាកល្បងស្ទាក់ចាប់ (Simulate)</span>
                </button>
              </div>
            </div>

            {/* Simulation Feedback Card */}
            {simulationResult && (
              <div
                className={`p-3 rounded-lg border text-xs space-y-1.5 animate-fadeIn ${
                  simulationResult.matched
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1">
                    {simulationResult.matched ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>ស្ទាក់ចាប់បាន Spam: {simulationResult.ruleName}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>សារធម្មតា (មិនត្រូវលក្ខខណ្ឌ Spam)</span>
                      </>
                    )}
                  </span>
                  {simulationResult.action && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                      Action: {simulationResult.action}
                    </span>
                  )}
                </div>

                {simulationResult.replyText && (
                  <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800 text-zinc-200 font-mono text-[11px] whitespace-pre-wrap">
                    <span className="text-sky-400 font-semibold block mb-0.5">
                      សារដែលបាន Auto-Reply ត្រឡប់ទៅវិញ៖
                    </span>
                    {simulationResult.replyText}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Interception Log Feed */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-200 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                ប្រវត្តិនៃការឆ្លើយតប (Interception Logs: {logs.length})
              </span>
              <button
                type="button"
                onClick={() => setLogs([])}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition"
              >
                Clear Logs
              </button>
            </div>

            <div className="divide-y divide-zinc-850 max-h-[220px] overflow-y-auto text-xs">
              {logs.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs font-mono">
                  មិនទាន់មានប្រវត្តិសារនៅឡើយទេ។
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 hover:bg-zinc-850/40 transition space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-zinc-200">
                        {log.senderName} {log.senderUsername && `(${log.senderUsername})`}
                      </span>
                      <span className="text-zinc-500 font-mono text-[10px]">{log.timestamp}</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] truncate">
                      <span className="text-zinc-500 font-mono">In:</span> {log.incomingMessage}
                    </p>
                    {log.replySent && (
                      <p className="text-sky-300 text-[11px] truncate">
                        <span className="text-sky-500 font-mono">Reply:</span> {log.replySent}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Script Modal for 24/7 Hosting */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-zinc-100">
                  កូដសម្រាប់យកទៅដាក់ដំណើរការ 24/7 (Server / VPS / PC)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScriptModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Script Tab Selector */}
            <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScriptTab('python')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${
                    activeScriptTab === 'python'
                      ? 'bg-amber-500 text-zinc-950 font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Python (Telethon UserBot សម្រាប់គណនីផ្ទាល់ខ្លួន)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScriptTab('nodejs')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${
                    activeScriptTab === 'nodejs'
                      ? 'bg-amber-500 text-zinc-950 font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Node.js (Telegraf Bot)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const code = activeScriptTab === 'python' ? pythonScript : nodejsScript;
                    navigator.clipboard.writeText(code);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 text-xs cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeScriptTab === 'python') {
                      handleDownloadCode('telegram_userbot.py', pythonScript);
                    } else {
                      handleDownloadCode('telegram_bot.js', nodejsScript);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="p-4 bg-zinc-950 flex-1 overflow-y-auto">
              <pre className="text-xs text-zinc-300 font-mono whitespace-pre leading-relaxed select-all">
                {activeScriptTab === 'python' ? pythonScript : nodejsScript}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
