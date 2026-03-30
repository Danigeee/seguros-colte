# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start dev server with hot reload (tsx + nodemon)

# Build & Production
npm run build         # Compile TypeScript to dist/
npm start             # Run compiled output (dist/index.js)

# Testing
npm test                    # Run main agent test (src/test-agents.ts)
npm run test:bienestar       # Full Bienestar Plus flow test
npm run test:bienestar:quick # Quick Bienestar Plus test
npm run test:client          # Client identification test
npm run test:payment         # Payment tools test
npm run test:mcp             # MCP adapter test
npm run test:logs            # Logs test

# Process Management (Production)
# App runs under PM2 (ecosystem.config.cjs), 1280MB memory limit
```

Server runs on port **3033**.

## Architecture

This is a **multi-agent WhatsApp chatbot** for Coltefinanciera insurance sales, built with LangGraph's supervisor-worker pattern.

### Request Flow

```
WhatsApp message → Twilio webhook (POST /seguros-colte/receive-message)
  → Express (chatRoutes.ts)
  → identifyClient node (Supabase phone lookup)
  → Supervisor agent (Lucía) decides routing
  → Specialist agent executes tools
  → Response sent via Twilio WhatsApp API
```

### Agent Graph (`src/supervisor.ts`)

The LangGraph state machine routes messages from the supervisor to one of six specialist agents:

| Node name | Agent file | Insurance type |
|-----------|-----------|----------------|
| `bienestar_plus_advisor` | `agents/bienestarPlusAdvisor.ts` | Health/benefits |
| `vida_deudor_advisor` | `agents/vidaDeudorAgent.ts` | Debt protection |
| `mascotas_advisor` | `agents/mascotasAdvisor.ts` | Pet insurance |
| `soat_advisor` | `agents/soatAdvisor.ts` | Mandatory vehicle |
| `seguro_autos_advisor` | `agents/seguroAutosAdvisor.ts` | Full auto |
| `dentix_advisor` | `agents/dentixAdvisor.ts` | Dental |

Shared agent state interface is defined in `agents/agentState.ts`.

### Layer Structure

- **`src/agents/`** — LangGraph node definitions (one per insurance product + supervisor + client identification)
- **`src/tools/`** — LangChain-compatible tools callable by agents (one file per product + shared/CRM tools)
- **`src/functions/`** — Business logic called by tools (DB queries, RAG retrievers, calculations)
- **`src/services/`** — External API integrations (Twilio, Supabase, Firebase, PaymentsWay, SendGrid, ElevenLabs, Google Sheets/Calendar)
- **`src/routes/`** — Express route handlers (chat, payments, MEFiA platform)
- **`src/config/`** — Client initialization for all external services
- **`src/utils/`** — Media handling (audio/image), PDF generation, quote creation

### LLM Configuration (`src/config/llm.ts`)

Uses `ChatOpenAI` with model `gpt-4.1-mini-2025-04-14`. Audio transcription uses OpenAI Whisper (`whisper-1`). Conversation memory uses LangGraph's `MemorySaver`.

### Key External Services

| Service | Purpose |
|---------|---------|
| **Supabase** | Primary database (client records, chat history) |
| **Twilio** | WhatsApp send/receive |
| **Firebase Storage** | File/media storage |
| **PaymentsWay** | Payment link generation and processing |
| **SendGrid** | Email delivery |
| **ElevenLabs** | Text-to-speech for voice responses |
| **Google Sheets** | Bienestar Plus data integration |
| **Google Calendar** | Appointment scheduling |

### API Routes

- `POST /seguros-colte/receive-message` — Twilio webhook (main entry point)
- `GET /seguros-colte/health` — Health check
- `GET /seguros-colte/chat-dashboard` — Chat dashboard
- Payment and MEFiA routes (`src/routes/paymentRoutes.ts`, `src/routes/mefiaRoutes.ts`)

## Environment Variables

All credentials are loaded from `.env`. Required variables:
- `OPENAI_API_KEY`
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
- `ELEVENLABS_API_KEY`
- Firebase: `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, and related vars
- `PAYMENTS_WAY_TOKEN`, `PAYMENTS_WAY_API_URL`
- Google Sheets: `GOOGLE_SHEET_BP_ID`, `GOOGLE_CLIENT_BP_EMAIL`, `GOOGLE_PRIVATE_BP_KEY`
- Google Calendar: `GOOGLE_CALENDAR_CLIENT_EMAIL`, `GOOGLE_CALENDAR_PRIVATE_KEY`, `GOOGLE_CALENDAR_CALENDAR_ID`
