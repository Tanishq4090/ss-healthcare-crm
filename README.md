# SS Health Care CRM

Internal CRM & Operations System for SS Health Care — built with React, Vite, TypeScript, Supabase, and TailwindCSS.

---

## 🚀 Getting Started (Mac, Windows & Linux)

### 1. Clone the repo

```bash
git clone https://github.com/Tanishq4090/ss-healthcare-crm.git
cd ss-healthcare-crm
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials. The app **will not start** without these.

> Ask the project owner for the actual `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values.

### 3. Install dependencies

```bash
npm install
```

> **Apple Silicon (M1/M2/M3)?** If you hit native module errors:
> ```bash
> npm install --legacy-peer-deps
> ```

### 4. Run the dev server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

### 5. Login

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `password123` |

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server (port 5173) |
| `npm run dev:public` | Start public-facing site (port 5174) |
| `npm run build` | Production build |
| `npm run build:os` | Build internal admin OS |
| `npm run build:public` | Build public patient-facing site |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

---

## 🗂 Phase 1 Features

- Admin login & access control
- Dashboard with analytics
- Call leads management
- CRM pipeline
- Staff assignment
- Staff ID card verification
- WhatsApp prefilled/logged messages
- HR management
- Attendance tracking
- Billing
- SS Health Care branding

> **Phase 2** (coming): Callyzer integration & Meta WhatsApp Business API

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite 7, TailwindCSS 3
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage)
- **UI Components:** Radix UI, shadcn/ui
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Animations:** Framer Motion

---

## 🌐 Live Deployment

Deployed on Vercel. Contact the project owner for the live URL.

---

## ⚙️ Environment Notes

- `.env` is **gitignored** — never committed. Use `.env.example` as a template.
- The `kimi-plugin-inspect-react` Vite plugin is Windows-only and is **automatically skipped** on macOS/Linux — no manual changes needed.
