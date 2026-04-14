# EduERP Pro — Setup Guide

## Folder structure

```
erp-full/
├── src/                   ← React frontend (original, unchanged)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json           ← frontend deps (react, vite)
├── vite.config.js
└── backend/
    ├── server.js          ← Node.js proxy (keeps API key secret)
    ├── package.json
    └── .env.example       ← copy → .env, add your key
```

---

## One-time setup

### Step 1 — Get an Anthropic API key

Go to https://console.anthropic.com/ → API Keys → Create key.
Copy the key (starts with `sk-ant-…`).

### Step 2 — Install backend dependencies

```bash
cd backend
npm install
```

### Step 3 — Create the backend .env file

```bash
cp .env.example .env
```

Open `backend/.env` and replace the placeholder with your real key:

```
ANTHROPIC_API_KEY=sk-ant-your-real-key-here
```

### Step 4 — Install frontend dependencies

```bash
cd ..          # back to the root erp-full/ folder
npm install
```

---

## Run it (every time)

You need **two terminals** open at the same time.

**Terminal 1 — backend**
```bash
cd backend
npm run dev
```
You should see:
```
✅  Backend running → http://localhost:3001
   API key : sk-ant-api123…
```

**Terminal 2 — frontend**
```bash
npm run dev
```
You should see:
```
  VITE v5.x  ready in 300ms
  ➜  Local: http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

## Test the forms

1. Click **"Request Demo"** in the nav → fill the form → submit  
2. Click **"Start Free Trial"** → complete both steps → submit  
3. Scroll to the bottom Contact section → fill the form → submit  

Each form should show a spinner then a personalised AI-generated confirmation.

---

## How it works

```
Browser  →  POST /api/claude  →  Vite proxy  →  Backend :3001  →  Anthropic API
                                 (dev only)       (adds key)
```

The API key never leaves the server. The browser only ever talks to your own backend.
