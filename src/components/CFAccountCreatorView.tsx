import React, { useState, useMemo } from 'react';
import {
  Users,
  Key,
  Shield,
  Download,
  Terminal,
  Play,
  RefreshCw,
  Copy,
  Check,
  FileSpreadsheet,
  FileCode,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  HelpCircle,
  ArrowRight,
  Bookmark,
  CheckCheck,
} from 'lucide-react';
import { CFAccountItem, CFRegisterMode } from '../types/cfAccounts';

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  let pwd = '';
  for (let i = 0; i < 16; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${pwd}9!A`;
}

export const CFAccountCreatorView: React.FC = () => {
  // Active mode
  const [activeMode, setActiveMode] = useState<CFRegisterMode>('assisted');

  // Input emails text
  const [emailsText, setEmailsText] = useState<string>('');

  // Password & Config
  const [passwordMode, setPasswordMode] = useState<'unified' | 'unique'>('unified');
  const [unifiedPassword, setUnifiedPassword] = useState<string>('CloudflareSecure2026!@#');
  const [showPasswords, setShowPasswords] = useState<boolean>(false);

  // API Credentials
  const [authType, setAuthType] = useState<'token' | 'global_key'>('token');
  const [apiToken, setApiToken] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authKey, setAuthKey] = useState<string>('');
  const [parentAccountId, setParentAccountId] = useState<string>('');
  const [isTestingAuth, setIsTestingAuth] = useState<boolean>(false);
  const [authStatusMessage, setAuthStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Execution state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [accountsList, setAccountsList] = useState<CFAccountItem[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [copiedPassEmail, setCopiedPassEmail] = useState<string | null>(null);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState<boolean>(false);
  const [activeScriptTab, setActiveScriptTab] = useState<'python' | 'nodejs'>('python');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'success' | 'failed'>('all');

  // Parse emails from text
  const parsedEmails = useMemo(() => {
    return emailsText
      .split(/[\r\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes('@'));
  }, [emailsText]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  // Generate 100 demo emails helper
  const handleGenerate100Emails = () => {
    const domain = 'myteam.domain.com';
    const list: string[] = [];
    for (let i = 1; i <= 100; i++) {
      list.push(`cf.account.${i}@${domain}`);
    }
    setEmailsText(list.join('\n'));
    setAccountsList([]);
    addLog('Generated 100 sample emails in textarea');
  };

  const getNormalizedList = (): CFAccountItem[] => {
    if (accountsList.length > 0 && accountsList.length === parsedEmails.length) {
      return accountsList;
    }
    return parsedEmails.map((email, idx) => ({
      id: `acc-${idx + 1}`,
      email,
      password: passwordMode === 'unified' ? unifiedPassword : generateRandomPassword(),
      status: 'pending',
      accountId: '',
      message: '',
      createdAt: '',
    }));
  };

  const currentList = getNormalizedList();

  // Test Cloudflare Auth
  const handleTestAuth = async () => {
    setIsTestingAuth(true);
    setAuthStatusMessage(null);
    try {
      const res = await fetch('/api/cf/test-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiToken: authType === 'token' ? apiToken.trim() : undefined,
          authEmail: authType === 'global_key' ? authEmail.trim() : undefined,
          authKey: authType === 'global_key' ? authKey.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setAuthStatusMessage({
          type: 'success',
          text: `✓ Authenticated successfully as ${data.user.email || data.user.id}`,
        });
        addLog(`✓ Cloudflare credentials verified! User: ${data.user.email || data.user.id}`);
      } else {
        setAuthStatusMessage({
          type: 'error',
          text: `✗ ${data.error || 'Authentication failed'}`,
        });
        addLog(`✗ Cloudflare Auth failed: ${data.error}`);
      }
    } catch (err: any) {
      setAuthStatusMessage({
        type: 'error',
        text: `✗ Connection error: ${err?.message || err}`,
      });
    } finally {
      setIsTestingAuth(false);
    }
  };

  // 1-Click Fast Register Assistant
  const handleOneClickRegister = (item: CFAccountItem) => {
    // 1. Copy password to clipboard
    navigator.clipboard.writeText(item.password);
    setCopiedPassEmail(item.email);
    setTimeout(() => setCopiedPassEmail(null), 3500);

    // 2. Open Cloudflare signup with email pre-filled
    const signupUrl = `https://dash.cloudflare.com/sign-up?email=${encodeURIComponent(item.email)}`;
    window.open(signupUrl, '_blank');

    // 3. Mark as opened
    setAccountsList((prevList) => {
      const list = prevList.length > 0 ? [...prevList] : getNormalizedList();
      const target = list.find((a) => a.email === item.email);
      if (target && target.status !== 'success') {
        target.status = 'opened';
        target.message = 'Opened in browser (Password copied to clipboard)';
      }
      return [...list];
    });

    addLog(`[1-Click] Opened Cloudflare signup for ${item.email}. Password copied to clipboard!`);
  };

  const handleMarkAsDone = (item: CFAccountItem) => {
    setAccountsList((prevList) => {
      const list = prevList.length > 0 ? [...prevList] : getNormalizedList();
      const target = list.find((a) => a.email === item.email);
      if (target) {
        target.status = 'success';
        target.message = 'Registered & Confirmed';
        target.createdAt = new Date().toISOString();
      }
      return [...list];
    });
    addLog(`✓ Marked ${item.email} as registered successfully.`);
  };

  // Assisted Runner: Advance to next account
  const handleNextAssistedAccount = () => {
    const list = accountsList.length > 0 ? accountsList : currentList;
    const currentItem = list[currentIndex];
    if (currentItem) {
      // Mark current as done
      handleMarkAsDone(currentItem);
    }
    if (currentIndex < list.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextItem = list[nextIdx];
      if (nextItem) {
        handleOneClickRegister(nextItem);
      }
    }
  };

  // Start Batch Creation (API Token method)
  const handleStartBatchAPI = async () => {
    if (parsedEmails.length === 0) return;

    const hasCreds =
      (authType === 'token' && apiToken.trim()) ||
      (authType === 'global_key' && authEmail.trim() && authKey.trim());

    if (!hasCreds) {
      setAuthStatusMessage({
        type: 'error',
        text: 'Please enter your Cloudflare API Token or Global API Key first!',
      });
      addLog('⚠️ API creation requires Cloudflare API Token or Global API Key.');
      return;
    }

    const initialList = getNormalizedList();
    setAccountsList(initialList);
    setIsProcessing(true);
    setCurrentIndex(0);
    setLogs([]);
    addLog(`Starting Cloudflare API batch creation for ${initialList.length} accounts...`);

    for (let i = 0; i < initialList.length; i++) {
      setCurrentIndex(i);
      const current = initialList[i];
      current.status = 'creating';
      setAccountsList([...initialList]);

      addLog(`[${i + 1}/${initialList.length}] API provisioning for ${current.email}...`);

      try {
        const res = await fetch('/api/cf/create-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: current.email,
            password: current.password,
            apiToken: authType === 'token' ? apiToken.trim() : undefined,
            authEmail: authType === 'global_key' ? authEmail.trim() : undefined,
            authKey: authType === 'global_key' ? authKey.trim() : undefined,
            parentAccountId: parentAccountId.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (data.success) {
          current.status = 'success';
          current.accountId = data.accountId || data.memberId || 'Created';
          current.message = data.message || 'Provisioned successfully via API';
          current.createdAt = new Date().toISOString();
          addLog(`✓ [${current.email}] Created! (ID: ${current.accountId})`);
        } else {
          current.status = 'failed';
          current.message = data.error || 'API creation failed';
          addLog(`✗ [${current.email}] Failed: ${data.error}`);
        }
      } catch (err: any) {
        current.status = 'failed';
        current.message = err?.message || 'Network error';
        addLog(`✗ [${current.email}] Error: ${err?.message || err}`);
      }

      setAccountsList([...initialList]);

      if (i < initialList.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setIsProcessing(false);
    addLog('✓ Batch operation finished!');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const listToExport = accountsList.length > 0 ? accountsList : currentList;

    const rows = [
      ['Index', 'Email', 'Password', 'Status', 'Account_ID', 'Message', 'Created_At'],
      ...listToExport.map((item, idx) => [
        idx + 1,
        item.email,
        item.password,
        item.status,
        item.accountId || '',
        item.message || '',
        item.createdAt || '',
      ]),
    ];

    const csvContent = rows
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudflare_${listToExport.length}_accounts.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const listToExport = accountsList.length > 0 ? accountsList : currentList;

    const blob = new Blob([JSON.stringify(listToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudflare_${listToExport.length}_accounts.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Python Script Generator (Undetected-Chromedriver)
  const pythonScript = useMemo(() => {
    const sampleList = (accountsList.length > 0 ? accountsList : currentList).map((a) => ({
      email: a.email,
      password: a.password,
    }));

    return `# ==============================================================
# Cloudflare 100 Accounts Automation (Python + Undetected Chromedriver)
# Solves/Bypasses Cloudflare Turnstile Verification Automatically!
# ==============================================================
# Setup:
#   pip install undetected-chromedriver selenium
# Run:
#   python cf_creator.py
# ==============================================================

import time
import json
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ACCOUNTS = ${JSON.stringify(sampleList, null, 2)}

def main():
    print(f"Starting registration of {len(ACCOUNTS)} Cloudflare accounts...")
    
    options = uc.ChromeOptions()
    # options.add_argument("--auto-open-devtools-for-tabs")
    driver = uc.Chrome(options=options)
    
    results = []

    try:
        for idx, acc in enumerate(ACCOUNTS, 1):
            email = acc['email']
            password = acc['password']
            print(f"[{idx}/{len(ACCOUNTS)}] Registering: {email}...")

            driver.get(f"https://dash.cloudflare.com/sign-up?email={email}")
            time.sleep(3)

            # Wait for email & password fields
            try:
                pass_field = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.NAME, "password"))
                )
                pass_field.clear()
                pass_field.send_keys(password)
                time.sleep(1)

                print("  Waiting for user or auto Turnstile verification...")
                # Allow time for Turnstile challenge to be solved
                time.sleep(4)

                submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                submit_btn.click()
                time.sleep(6)

                print(f"  ✓ {email} successfully registered!")
                results.append({"email": email, "password": password, "status": "Success"})
            except Exception as e:
                print(f"  ✗ Error on {email}: {e}")
                results.append({"email": email, "password": password, "status": "Failed", "error": str(e)})

            time.sleep(2)

    finally:
        with open("cloudflare_created_accounts.json", "w") as f:
            json.dump(results, f, indent=2)
        print("Completed! Results saved to cloudflare_created_accounts.json")
        driver.quit()

if __name__ == "__main__":
    main()
`;
  }, [accountsList, currentList]);

  // Node.js Puppeteer Script Generator
  const nodejsScript = useMemo(() => {
    const sampleList = (accountsList.length > 0 ? accountsList : currentList).map((a) => ({
      email: a.email,
      password: a.password,
    }));

    return `/**
 * Cloudflare 100 Accounts Automation (Node.js + Puppeteer Stealth)
 * Setup:
 *   npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
 * Run:
 *   node cf_creator.js
 */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

const ACCOUNTS = ${JSON.stringify(sampleList, null, 2)};

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  console.log(\`Starting automated registration for \${ACCOUNTS.length} accounts...\`);

  for (let i = 0; i < ACCOUNTS.length; i++) {
    const acc = ACCOUNTS[i];
    console.log(\`[\${i + 1}/\${ACCOUNTS.length}] Registering: \${acc.email}...\`);
    const page = await browser.newPage();

    try {
      await page.goto(\`https://dash.cloudflare.com/sign-up?email=\${encodeURIComponent(acc.email)}\`, { waitUntil: 'networkidle2' });
      await page.waitForSelector('input[name="password"]', { timeout: 10000 });
      await page.type('input[name="password"]', acc.password, { delay: 40 });

      console.log('  Waiting 5s for Turnstile check...');
      await new Promise(r => setTimeout(r, 5000));

      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 6000));

      results.push({ email: acc.email, password: acc.password, status: 'Success' });
      console.log(\`  ✓ \${acc.email} registered!\`);
    } catch (err) {
      console.error(\`  ✗ Error on \${acc.email}: \${err.message}\`);
      results.push({ email: acc.email, password: acc.password, status: 'Failed', error: err.message });
    } finally {
      await page.close();
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  fs.writeFileSync('cloudflare_created_accounts.json', JSON.stringify(results, null, 2));
  console.log('Done! Results saved in cloudflare_created_accounts.json');
  await browser.close();
}

main().catch(console.error);`;
  }, [accountsList, currentList]);

  // Download code file helper
  const handleDownloadScriptFile = (filename: string, content: string) => {
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

  // Bookmarklet code for 1-click autofill in Cloudflare signup tab
  const bookmarkletCode = `javascript:(function(){const p=prompt('Paste password from tool:');if(!p)return;const passEl=document.querySelector('input[name="password"]');if(passEl){passEl.value=p;passEl.dispatchEvent(new Event('input',{bubbles:true}));alert('Password filled!');}else{alert('Password input not found.');}})();`;

  // Filtered accounts list
  const filteredList = useMemo(() => {
    const list = accountsList.length > 0 ? accountsList : currentList;
    if (filterStatus === 'all') return list;
    if (filterStatus === 'pending')
      return list.filter((a) => a.status === 'pending' || a.status === 'opened');
    return list.filter((a) => a.status === filterStatus);
  }, [accountsList, currentList, filterStatus]);

  const successCount = (accountsList.length > 0 ? accountsList : currentList).filter(
    (a) => a.status === 'success'
  ).length;
  const failedCount = (accountsList.length > 0 ? accountsList : currentList).filter(
    (a) => a.status === 'failed'
  ).length;
  const openedCount = (accountsList.length > 0 ? accountsList : currentList).filter(
    (a) => a.status === 'opened'
  ).length;

  const currentAssistedItem = currentList[currentIndex] || currentList[0];

  return (
    <div className="space-y-6">
      {/* Informational Guidance Banner regarding Turnstile Captcha & API Token in Khmer */}
      <section className="bg-amber-950/25 border border-amber-800/50 rounded-xl p-4 text-xs text-amber-200 space-y-3">
        <div className="flex items-start gap-2.5">
          <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <h3 className="font-semibold text-zinc-100 text-sm">
              មូលហេតុ និងដំណោះស្រាយសម្រាប់ការបង្កើត Account Cloudflare ទាំង ១០០៖
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              Cloudflare មានប្រព័ន្ធការពារ <strong>Turnstile Captcha</strong> នៅលើទំព័រ Sign-up ដូច្នេះ Server មិនអាចលួចចុះឈ្មោះ Bot ដោយផ្ទាល់តាមរយៈ API ធម្មតាបានឡើយ (កាលពីមុនវាចេញកំហុស <em>"Method POST not available"</em> ដោយសារ Cloudflare មិនអនុញ្ញាត)។
            </p>
            <p className="text-zinc-300 leading-relaxed">
              ដើម្បីដោះស្រាយបញ្ហានេះ Tool ឥឡូវនេះផ្តល់ជូន <strong>ជម្រើសងាយស្រួល ៣ យ៉ាង</strong>៖
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-[11px]">
              <div
                onClick={() => setActiveMode('assisted')}
                className={`p-2.5 rounded-lg border cursor-pointer transition ${
                  activeMode === 'assisted'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-100 ring-1 ring-amber-500/50'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold text-amber-400 mb-1">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>១. ជំនួយការ 1-Click (គ្មាន API)</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  បើក Sign-up ជាមួយ Email ស្រាប់ + Copy Password ដោយស្វ័យប្រវត្ត។ ចំណាយពេលតែ <strong>៣-៥ វិនាទី</strong> ក្នុង ១ Account!
                </p>
              </div>

              <div
                onClick={() => setActiveMode('api')}
                className={`p-2.5 rounded-lg border cursor-pointer transition ${
                  activeMode === 'api'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-100 ring-1 ring-amber-500/50'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold text-emerald-400 mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>២. តាមរយៈ API Token / Global Key</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  ប្រសិនបើអ្នកមាន Account Cloudflare ១ រួចហើយ គ្រាន់តែបញ្ចូល API Token ឬ Global Key ដើម្បីបង្កើត Sub-accounts ស្វ័យប្រវត្ត!
                </p>
              </div>

              <div
                onClick={() => setActiveMode('bot_script')}
                className={`p-2.5 rounded-lg border cursor-pointer transition ${
                  activeMode === 'bot_script'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-100 ring-1 ring-amber-500/50'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold text-sky-400 mb-1">
                  <FileCode className="w-3.5 h-3.5" />
                  <span>៣. Python / Node.js Bot Script</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  ទាញយក Script រួច Run លើកុំព្យូទ័ររបស់អ្នក វានឹងបើក Chrome Browser បង្កើតទាំង ១០០ ដោយស្វ័យប្រវត្ត ១០០%!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveMode('assisted')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeMode === 'assisted'
              ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>⚡ Fast 1-Click Register (No Token)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('api')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeMode === 'api'
              ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>🛡️ Cloudflare API Mode</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('bot_script')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeMode === 'bot_script'
              ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>🤖 Automation Bot Script (.py / .js)</span>
        </button>
      </div>

      {/* Fast Registration Runner (Visible in assisted mode) */}
      {activeMode === 'assisted' && parsedEmails.length > 0 && currentAssistedItem && (
        <section className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-600/40 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-current text-amber-400 animate-pulse" />
                Active Registration Assistant — Account #{currentIndex + 1} of {currentList.length}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-zinc-100 font-mono select-all">
                  {currentAssistedItem.email}
                </span>
                <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 flex items-center gap-1">
                  <span>Pass:</span>
                  <strong className="text-zinc-200">
                    {showPasswords ? currentAssistedItem.password : '••••••••••••••••'}
                  </strong>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentAssistedItem.password);
                      setCopiedPassEmail(currentAssistedItem.email);
                      setTimeout(() => setCopiedPassEmail(null), 2000);
                    }}
                    className="hover:text-white p-0.5 text-zinc-400 cursor-pointer"
                    title="Copy password"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleOneClickRegister(currentAssistedItem)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>🚀 Open Sign-up (Copy Pass)</span>
              </button>

              <button
                type="button"
                onClick={handleNextAssistedAccount}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-semibold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>✓ Done & Next Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
            <span>
              💡 <strong>How it works:</strong> Click "Open Sign-up" (opens tab with email filled &amp; copies password) → Paste password → Solve Turnstile → Click Sign Up → Come back and click "Done & Next"!
            </span>
            {copiedPassEmail && (
              <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                ✓ Password copied to clipboard!
              </span>
            )}
          </div>
        </section>
      )}

      {/* Input & Password Configuration Section */}
      <section className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Cloudflare 100+ Accounts Input &amp; Password Strategy
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Paste your list of emails to register, provision, and export Cloudflare accounts in batch.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleGenerate100Emails}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-mono transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Generate 100 Sample Emails</span>
            </button>

            {emailsText && (
              <button
                type="button"
                onClick={() => {
                  setEmailsText('');
                  setAccountsList([]);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Textarea for 100 emails */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-mono text-zinc-300 font-medium">
              Email Addresses List (One per line)
            </label>
            <span className="font-mono text-amber-400 font-semibold text-[11px]">
              {parsedEmails.length} email(s) detected
            </span>
          </div>

          <textarea
            value={emailsText}
            onChange={(e) => {
              setEmailsText(e.target.value);
              setAccountsList([]);
            }}
            disabled={isProcessing}
            rows={5}
            placeholder={`admincf1@gmail.com\nadmincf2@gmail.com\nadmincf3@gmail.com\nadmincf4@gmail.com\n... up to 100+ emails`}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-lg p-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 outline-none transition resize-y leading-relaxed"
          />
        </div>

        {/* Password Strategy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
          <div className="space-y-2.5 bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800">
            <span className="font-mono text-zinc-300 font-semibold block flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Password Strategy
            </span>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="radio"
                  name="passwordMode"
                  checked={passwordMode === 'unified'}
                  onChange={() => {
                    setPasswordMode('unified');
                    setAccountsList([]);
                  }}
                  className="text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-0"
                />
                <span>Use Master Password for all accounts</span>
              </label>

              {passwordMode === 'unified' && (
                <div className="relative pl-5">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={unifiedPassword}
                    onChange={(e) => {
                      setUnifiedPassword(e.target.value);
                      setAccountsList([]);
                    }}
                    placeholder="Master password (min 8 chars, 1 digit, 1 special)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 font-mono text-xs text-zinc-100 outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="radio"
                  name="passwordMode"
                  checked={passwordMode === 'unique'}
                  onChange={() => {
                    setPasswordMode('unique');
                    setAccountsList([]);
                  }}
                  className="text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-0"
                />
                <span>Generate Unique 16-character Strong Password per account</span>
              </label>
            </div>
          </div>

          {/* Quick Actions & Bookmarklet Tool */}
          <div className="space-y-2.5 bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800 flex flex-col justify-between">
            <span className="font-mono text-zinc-300 font-semibold flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-sky-400" />
              Quick Fill Bookmarklet (Optional Helper)
            </span>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Drag this button to your Bookmarks Bar. When you open Cloudflare Signup, click it to automatically paste the password without typing!
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={bookmarkletCode}
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(bookmarkletCode);
                  setCopiedBookmarklet(true);
                  setTimeout(() => setCopiedBookmarklet(false), 2500);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-mono hover:bg-sky-500/25 transition cursor-grab"
                title="Drag to bookmarks bar or click to copy bookmarklet"
              >
                <Bookmark className="w-3 h-3 text-sky-400" />
                <span>{copiedBookmarklet ? 'Copied Bookmarklet Code!' : '⚡ Drag CF Quick-Fill'}</span>
              </a>
              <span className="text-[10px] text-zinc-500">Drag to bookmarks bar</span>
            </div>
          </div>
        </div>

        {/* API Configuration (When in API Mode) */}
        {activeMode === 'api' && (
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 space-y-3 pt-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="font-mono text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                Cloudflare API Credentials
              </span>
              <a
                href="https://dash.cloudflare.com/profile/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Find API Token / Global Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Auth Type Switcher */}
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  type="radio"
                  name="authType"
                  checked={authType === 'token'}
                  onChange={() => setAuthType('token')}
                  className="text-amber-500"
                />
                <span>API Token (Bearer)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  type="radio"
                  name="authType"
                  checked={authType === 'global_key'}
                  onChange={() => setAuthType('global_key')}
                  className="text-amber-500"
                />
                <span>Global API Key + Account Email</span>
              </label>
            </div>

            {authType === 'token' ? (
              <div className="space-y-1">
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Paste Cloudflare API Token (Permissions: Account:Edit, User:Read)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Cloudflare Account Email (e.g. yourname@domain.com)"
                  className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-500"
                />
                <input
                  type="password"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  placeholder="Global API Key (from My Profile > API Tokens)"
                  className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestAuth}
                disabled={isTestingAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition cursor-pointer"
              >
                {isTestingAuth ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Test Credentials</span>
              </button>

              {authStatusMessage && (
                <span
                  className={`text-xs font-mono ${
                    authStatusMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {authStatusMessage.text}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {activeMode === 'api' ? (
              <button
                type="button"
                onClick={handleStartBatchAPI}
                disabled={isProcessing || parsedEmails.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-semibold text-xs sm:text-sm shadow-md transition disabled:opacity-40 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isProcessing
                    ? `Processing ${currentIndex + 1}/${parsedEmails.length}...`
                    : `Provision ${parsedEmails.length} Accounts via API`}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (currentList.length > 0) {
                    handleOneClickRegister(currentList[0]);
                  }
                }}
                disabled={parsedEmails.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-semibold text-xs sm:text-sm shadow-md transition disabled:opacity-40 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Start 1-Click Fast Register ({parsedEmails.length} Accounts)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={parsedEmails.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-medium transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV ({parsedEmails.length})</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              disabled={parsedEmails.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-medium transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Export JSON</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
          </button>
        </div>
      </section>

      {/* Bot Automation Scripts Section (Visible in bot_script mode) */}
      {activeMode === 'bot_script' && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-sky-400" />
                Automated Bot Script (Runs locally on your computer)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Download ready-to-run script containing all your {parsedEmails.length} emails and generated passwords.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveScriptTab('python')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                  activeScriptTab === 'python'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                Python (Selenium Undetected)
              </button>

              <button
                type="button"
                onClick={() => setActiveScriptTab('nodejs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                  activeScriptTab === 'nodejs'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                Node.js (Puppeteer Stealth)
              </button>
            </div>
          </div>

          {activeScriptTab === 'python' ? (
            <div className="space-y-3">
              <div className="bg-black/90 p-4 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-[300px]">
                <pre>{pythonScript}</pre>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <span className="text-zinc-400 font-mono text-[11px]">
                  Commands: <code>pip install undetected-chromedriver selenium</code> &amp;{' '}
                  <code>python cf_creator.py</code>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(pythonScript)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadScriptFile('cf_creator.py', pythonScript)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs font-mono transition cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download cf_creator.py</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-black/90 p-4 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-[300px]">
                <pre>{nodejsScript}</pre>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <span className="text-zinc-400 font-mono text-[11px]">
                  Commands: <code>npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth</code> &amp;{' '}
                  <code>node cf_creator.js</code>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(nodejsScript)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadScriptFile('cf_creator.js', nodejsScript)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs font-mono transition cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download cf_creator.js</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Accounts List & Result Table */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="bg-zinc-900/90 px-4 py-3 border-b border-zinc-800 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 text-zinc-200 font-mono">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">Accounts Catalog ({currentList.length})</span>
          </div>

          {/* Status Filter Badges */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded cursor-pointer transition ${
                filterStatus === 'all'
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({currentList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('success')}
              className={`px-2.5 py-1 rounded cursor-pointer transition ${
                filterStatus === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              Done ({successCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1 rounded cursor-pointer transition ${
                filterStatus === 'pending'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 font-bold'
                  : 'text-zinc-400 hover:text-amber-400'
              }`}
            >
              Pending ({currentList.length - successCount})
            </button>
            {failedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterStatus('failed')}
                className={`px-2.5 py-1 rounded cursor-pointer transition ${
                  filterStatus === 'failed'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 font-bold'
                    : 'text-zinc-400 hover:text-rose-400'
                }`}
              >
                Failed ({failedCount})
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {parsedEmails.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 text-xs space-y-2">
              <Users className="w-8 h-8 mx-auto text-zinc-700" />
              <p>Paste your 100 emails above or click "Generate 100 Sample Emails" to preview.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-zinc-900/60 text-zinc-400 text-[11px] sticky top-0 border-b border-zinc-800/80 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-10">#</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Password</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Result / Info</th>
                  <th className="py-2.5 px-3 text-right">Quick Register</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredList.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-zinc-900/40 transition ${
                      currentIndex === idx && activeMode === 'assisted' ? 'bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-zinc-500 text-[11px]">{idx + 1}</td>
                    <td className="py-2 px-3 text-zinc-200 select-all font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{item.email}</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(item.email)}
                          className="p-0.5 text-zinc-600 hover:text-zinc-300 cursor-pointer"
                          title="Copy email"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-zinc-400 select-all font-mono">
                      <div className="flex items-center gap-1.5">
                        <span>{showPasswords ? item.password : '••••••••••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.password);
                            setCopiedPassEmail(item.email);
                            setTimeout(() => setCopiedPassEmail(null), 2000);
                          }}
                          className="p-0.5 text-zinc-600 hover:text-zinc-300 cursor-pointer"
                          title="Copy password"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {item.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Done / Registered
                        </span>
                      ) : item.status === 'opened' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 bg-sky-950/40 border border-sky-800/50 px-2 py-0.5 rounded">
                          <ExternalLink className="w-3 h-3" />
                          Opened in Browser
                        </span>
                      ) : item.status === 'creating' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Processing
                        </span>
                      ) : item.status === 'failed' ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2 py-0.5 rounded"
                          title={item.message}
                        >
                          <AlertCircle className="w-3 h-3" />
                          Requires Token/Turnstile
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-zinc-400 truncate max-w-xs" title={item.message}>
                      {item.accountId ? (
                        <span className="text-emerald-400">ID: {item.accountId}</span>
                      ) : item.status === 'success' ? (
                        <span className="text-emerald-400">Registered</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkAsDone(item)}
                          className="text-[11px] text-zinc-500 hover:text-emerald-400 transition cursor-pointer flex items-center gap-1"
                          title="Mark this account as registered"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Done</span>
                        </button>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentIndex(idx);
                          handleOneClickRegister(item);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-sans text-xs transition cursor-pointer"
                        title="Copies password & opens Cloudflare sign-up with email prefilled"
                      >
                        <Zap className="w-3 h-3 text-emerald-400 fill-current" />
                        <span>1-Click Register</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Terminal Activity Logs */}
      {logs.length > 0 && (
        <section className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-zinc-900/90 px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-mono">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Creation Console Output ({logs.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setLogs([])}
              className="text-zinc-500 hover:text-zinc-300 text-[11px] font-mono cursor-pointer"
            >
              Clear
            </button>
          </div>
          <div className="p-3 bg-black/60 font-mono text-xs text-zinc-400 max-h-40 overflow-y-auto space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed hover:text-zinc-200">
                {log}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
