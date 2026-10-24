export type TelegramMode = 'bot' | 'userbot';

export type TriggerType =
  | 'keywords'
  | 'links'
  | 'forwarded'
  | 'stranger_dm'
  | 'always_away';

export type ResponseAction = 'reply_only' | 'reply_and_warn' | 'reply_and_block' | 'silent_block';

export interface TelegramAutoReplyRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: TriggerType;
  keywords: string[]; // e.g. ["loan", "crypto", "វិនិយោគ"]
  responseTemplate: string;
  action: ResponseAction;
  delaySeconds: number;
  matchCount: number;
}

export interface TelegramMessageLog {
  id: string;
  timestamp: string;
  senderName: string;
  senderUsername?: string;
  senderId: string;
  incomingMessage: string;
  triggeredRuleName?: string;
  matchedKeywords?: string[];
  replySent?: string;
  actionTaken: ResponseAction | 'ignored';
  status: 'sent' | 'blocked' | 'simulated' | 'failed';
}

export interface TelegramBotStatus {
  connected: boolean;
  botUsername?: string;
  botFirstName?: string;
  botId?: number;
  lastChecked?: string;
  error?: string;
}
