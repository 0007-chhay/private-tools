# Web Suite Pro 🚀
### Wayback Site Cloner, Cloudflare R2 / S3 Rclone Backup, Cloudflare Account Manager & Viral Trends Analytics

A comprehensive webmaster, storage automation, and content creator productivity suite built with React 19, TypeScript, Express, and Tailwind CSS.

---

## 🌟 Core Features (មុខងារសំខាន់ៗទាំង ៤)

### 1. 🌐 Wayback Machine Site Cloner
- **Archive Extraction:** Crawls Wayback Machine snapshots using the Internet Archive CDX API.
- **Asset Rewriting:** Automatically rewrites internal links, CSS, JavaScript, and image URLs to be relative for local hosting.
- **Live Preview:** Built-in iframe inspector for reviewing cloned sites.
- **ZIP Packaging:** Compresses cloned HTML, styles, and assets into a ready-to-deploy ZIP archive (`JSZip`).

### 2. 🗄️ Rclone CLI & Cloudflare R2 / S3 Storage Backup
- **rclone.conf Generator:** Instantly generates configured `rclone.conf` credentials with one-click copy and `.conf` file download.
- **S3 & R2 Credential Verification:** Validates Account ID, Access Key ID, and Secret Access Key against Cloudflare R2 or AWS S3 endpoints.
- **One-Click Backup Commands:** Ready-to-use CLI sync commands (e.g., `rclone sync cloudflare-r2:my-bucket ./r2-backup --progress`).
- **Interactive Bucket Explorer:** Browse buckets, inspect file sizes, and simulate cloud sync operations.

### 3. ☁️ Cloudflare Batch Account Creator & Token Provisioner
- **Batch Generator:** Generate multiple accounts with custom prefixes, custom domains, and secure passwords.
- **API Account Provisioning:** Integrates with Cloudflare Enterprise/Tenant API endpoints (`/client/v4/accounts`).
- **Token Assistant:** Step-by-step guidance for setting up API Tokens, Global Keys, and bypassing bot verification manually.
- **Data Export:** Export account credentials as CSV or JSON for safe record-keeping.

### 4. 📈 Viral Trends & TikTok Audience Analytics
- **Live Trends & Hashtag Scraper:** Real-time trending hashtags, view counts, and 7-day virality growth rates across Cambodia (🇰🇭), SEA, Thailand, Vietnam, US, and Global.
- **🔄 Sync Live Trends:** Instant on-demand sync from server scraper engine with live status indicators.
- **Viral Audio Library:** Trending sounds with recommended video durations, genres, and energy vibes.
- **Audience Heatmap (24x7):** Analyzes peak active hours throughout the week to maximize viral reach and engagement.
- **Viral Hook Formulas:** Pre-built high-converting hooks for Business, Comedy, Food, and Tech in Khmer.
- **Ready-to-run Scraper Scripts:** Exportable Python (Playwright) and Node.js scraper scripts for automated background scraping.

### 5. 🤖 Telegram Auto-Responder & Anti-Spam Deflector
- **Personal Account UserBot & Bot API:** Supports replying from personal Telegram accounts (Telethon MTProto) or official Telegram Bots (@BotFather).
- **Intelligent Keyword & Spam Detection:** Intercepts loan scams (កម្ចី/ការប្រាក់), fake crypto/forex, unsolicited links (`t.me/`, `http`), and harassment in real-time.
- **Customizable Khmer Templates:** Pre-set warning templates, strict auto-block deflectors, and human verification (CAPTCHA) quizzes.
- **Live Simulator & Audit Logs:** Interactive chat simulator to test keyword matching, response formatting, and live interception history.
- **Ready-to-run 24/7 Scripts:** Instant copy and download of Python (`telethon`) and Node.js (`telegraf`) scripts for hosting on a VPS or home PC.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion
- **Backend / API:** Express.js, TypeScript (`tsx`)
- **Build Tool:** Vite 8
- **Cloud & Utilities:** AWS SDK for S3 (`@aws-sdk/client-s3`), JSZip

---

## 🚀 Getting Started (ការដំឡើង និងដំណើរការលើកុំព្យូទ័រ)

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```
*(Optional: Add your custom Cloudflare API tokens or TikTok developer keys in `.env` if desired)*

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📤 របៀប Upload Project ទៅកាន់ GitHub (Git Commands)

បើលោកអ្នកទើបតែបង្កើត Repository ថ្មីនៅលើ GitHub (ឧទាហរណ៍៖ `web-suite-pro`)៖

```bash
# 1. Initialize Git (ប្រសិនបើមិនទាន់មាន .git)
git init

# 2. បន្ថែម files ទាំងអស់ចូល staging
git add .

# 3. Commit files ដំបូង
git commit -m "feat: complete Web Suite Pro with Wayback Cloner, Rclone R2, CF Creator, and Live Trends"

# 4. ប្តូរ branch ទៅ main
git branch -M main

# 5. ភ្ជាប់ link ទៅកាន់ GitHub repository របស់អ្នក
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 6. Push ឡើងទៅ GitHub
git push -u origin main
```

---

## 💡 គន្លឹះសម្រាប់ការ Update បន្ត (Workflow)
រាល់ពេលដែលបងចង់បន្ថែមមុខងារថ្មី៖
1. ពិភាក្សានៅទីនេះដើម្បីបន្ថែមមុខងារ ឬកែកូដ
2. បន្ទាប់ពីកូដរួចរាល់ អាច Run `git add .`, `git commit -m "update: ..."` និង `git push` ដើម្បី Sync ទៅ GitHub បានយ៉ាងរហ័ស!

---

## 📄 License
MIT License
