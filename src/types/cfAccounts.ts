export type CFAccountStatus = 'pending' | 'opened' | 'creating' | 'success' | 'failed';

export interface CFAccountItem {
  id: string;
  email: string;
  password: string;
  status: CFAccountStatus;
  accountId?: string;
  message?: string;
  createdAt?: string;
}

export type CFRegisterMode = 'assisted' | 'api' | 'bot_script';

export interface CFAccountBatchConfig {
  mode: CFRegisterMode;
  passwordMode: 'unified' | 'unique';
  unifiedPassword: string;
  authType: 'token' | 'global_key';
  apiToken?: string;
  authEmail?: string;
  authKey?: string;
  parentAccountId?: string;
  delayMs: number;
}
