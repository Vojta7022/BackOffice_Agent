# RE:Agent — Back Office Operations

AI asistent pro správu realitní kanceláře. Odpovídá na dotazy v přirozeném jazyce, generuje grafy, navrhuje emaily a vytváří reporty nad daty z vaší kanceláře.

---

## Screenshot

> _Přidejte screenshot po prvním spuštění._

---

## Technologie

| Vrstva | Technologie |
|--------|-------------|
| Framework | Next.js 14 (App Router) |
| AI model | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) |
| Grafy | Recharts |
| Stylování | Tailwind CSS v3 + shadcn/ui |
| Stav | Zustand |
| Jazyk | TypeScript (strict) |

---

## Spuštění lokálně

```bash
# 1. Klonování repozitáře
git clone https://github.com/your-username/backoffice-agent.git
cd backoffice-agent

# 2. Instalace závislostí
npm install

# 3. Nastavení prostředí
cp .env.example .env.local
# Otevřete .env.local a doplňte váš Anthropic API klíč:
# ANTHROPIC_API_KEY=sk-ant-...

# 4. Spuštění vývojového serveru
npm run dev
```

Aplikace bude dostupná na [http://localhost:3000](http://localhost:3000).

---

## Nasazení na Vercel

1. Pushněte repozitář na GitHub
2. Importujte projekt na [vercel.com](https://vercel.com)
3. V nastavení projektu přidejte proměnnou prostředí:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** váš klíč z [console.anthropic.com](https://console.anthropic.com)
4. Klikněte na **Deploy**

Soubor `vercel.json` je předkonfigurován — chat API route má `maxDuration: 60` sekund pro delší AI odpovědi.

---

## Co agent umí

- **Dotazy na data** — klienti, leady, nemovitosti, transakce s filtrováním a agregacemi
- **Grafy** — sloupcové, čárové, plošné a koláčové grafy přímo v chatu
- **Reporty** — týdenní/měsíční přehledy pro vedení s klíčovými metrikami
- **Emailové návrhy** — agent napíše email zájemci nebo klientovi, vy ho jen zkopírujete
- **Správa úkolů** — vytvoření úkolu s termínem a prioritou přes přirozený jazyk
- **Monitoring trhu** — nastavení upozornění na nové nabídky v zadané lokalitě a cenové relaci

---

## Architektura

```
src/
├── app/
│   ├── api/              # Next.js API Routes (chat, dashboard, properties, clients, tasks)
│   ├── chat/             # Chat stránka s AI asistentem
│   ├── clients/          # Přehled klientů
│   ├── monitoring/       # Nastavení monitoringu trhu
│   ├── properties/       # Přehled nemovitostí
│   └── tasks/            # Kanban board úkolů
├── components/
│   ├── chat/             # ChatMessages, MessageBubble, InlineChart, InlineTable, …
│   ├── dashboard/        # KPICards, ChartsRow, RecentActivity, QuickActions
│   └── layout/           # Sidebar, Header, MainWrapper
├── data/                 # In-memory seed data (agenti, klienti, nemovitosti, …)
├── lib/
│   ├── agent/            # Orchestrátor, nástroje (tools), handlery
│   ├── database.ts       # Singleton s 20 dotazovacími metodami nad seed daty
│   ├── chat-store.ts     # Zustand store pro chat zprávy
│   └── store.ts          # Zustand store pro sidebar a téma
└── types/                # Sdílené TypeScript typy
```

Agent (`src/lib/agent/orchestrator.ts`) přijme zprávu, v cyklu volá až 14 nástrojů (paralelně přes `Promise.all`), sestaví odpověď a vrátí ji jako `AgentResponse` s textem, grafy, tabulkami a dalšími strukturovanými daty.

---

## Prostředí

| Proměnná | Popis |
|----------|-------|
| `ANTHROPIC_API_KEY` | API klíč z [console.anthropic.com](https://console.anthropic.com) |
