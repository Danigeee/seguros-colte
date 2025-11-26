
# 🏗️ Cemtech AI Multi-Agent System

> **Next-Generation Automated Quoting & Customer Service Engine for WhatsApp.**

This project is a sophisticated **Multi-Agent System** designed for **Ultim Marketing** to automate complex interactions including quoting (Takeoff & Estimating), client management, and customer service through a natural conversational interface on WhatsApp.

---

## 🌟 Key Features

*   **🧠 Multi-Agent Architecture:** Powered by **LangGraph**, the system uses a "Supervisor" agent to intelligently route user requests to specialized agents (Cost Engineer, Customer Service, etc.).
*   **💬 Omnichannel & Multimodal:** Handles **Text**, **Voice Notes** (transcribed via Whisper), and **Images** seamlessly through WhatsApp.
*   **📊 Integrated CRM:** Deep integration with **Supabase** to manage Clients, Projects, and Estimations in real-time.
*   **⚡ Real-time Quoting:** Capable of searching catalogs, calculating costs, and generating draft quotes on the fly.

---

## 🛠️ Technology Stack

*   **Runtime:** Node.js (TypeScript)
*   **Orchestration:** [LangGraph](https://langchain-ai.github.io/langgraph/) (Stateful Multi-Agent Graph)
*   **LLM:** OpenAI (**GPT-4o** for reasoning, **Whisper-1** for audio)
*   **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
*   **Storage:** [Firebase Storage](https://firebase.google.com/) (Media persistence)
*   **Messaging:** WhatsApp Business API (via **Twilio**)

---

## 🧩 System Architecture

The system follows a **Supervisor-Worker** pattern:

1.  **Ingestion:**
    *   User sends a message to WhatsApp.
    *   **Twilio** forwards the webhook to our Express server.
    *   **Media Handler** processes audio/images (upload to Firebase + Transcribe).
    *   Message is saved to **Supabase** history.

2.  **Orchestration (The Brain):**
    *   The **Supervisor Agent** analyzes the conversation history and intent.
    *   It decides whether to reply directly (General Chat) or route to a specialist.

3.  **Specialized Agents:**
    *   👷 **Cost Engineer:** Handles technical quoting tasks.
        *   *Tools:* `lookup_or_create_client`, `manage_quote_context`, `search_and_add_item`.
    *   🤝 **Customer Service:** (In Development) Handles FAQs, order tracking, and company info.

4.  **Execution:**
    *   The selected agent executes tools (DB queries, calculations).
    *   The final response is sent back to the user via Twilio.

---

## 📂 Project Structure

```bash
src/
├── agents/           # Agent Definitions (The "Workers")
│   ├── costEngineer.ts    # Logic for quoting and estimation
│   └── agentState.ts      # Shared state interface for the graph
├── config/           # Configuration & Clients
│   ├── supabase.ts        # Database connection
│   ├── firebase.ts        # Storage connection
│   └── llm.ts             # OpenAI setup
├── functions/        # Core Business Logic
│   └── costFunctions.ts   # Pure functions for calculations
├── routes/           # API Routes
│   └── chatRoutes.ts      # Main entry point (Twilio Webhook)
├── services/         # Data Access Layer (DAL)
│   ├── crmService.ts      # Client management
│   ├── estimationService.ts # Quote management
│   └── chatHistoryService.ts # Message persistence
├── tools/            # LangChain Tools
│   ├── crmTools.ts        # Tools for Client/Quote manipulation
│   ├── costTools.ts       # Tools for Catalog/Pricing
│   └── index.ts           # Tool exports and mapping
├── supervisor.ts     # Main Graph Definition & Routing Logic
└── index.ts          # Server Entry Point
```

---

## 🚀 Installation & Setup

### 1. Prerequisites
*   Node.js (v18+)
*   Supabase Project
*   Firebase Project
*   Twilio Account (WhatsApp Sandbox or Live)
*   OpenAI API Key

### 2. Installation

```bash
git clone <repo-url>
cd multiagent-cemtech
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3031

# --- AI ---
OPENAI_API_KEY="sk-..."

# --- Database (Supabase) ---
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# --- Storage (Firebase) ---
FIREBASE_API_KEY="..."
FIREBASE_AUTH_DOMAIN="..."
FIREBASE_PROJECT_ID="..."
FIREBASE_STORAGE_BUCKET="..."
FIREBASE_MESSAGING_SENDER_ID="..."
FIREBASE_APP_ID="..."

# --- Communication (Twilio) ---
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="whatsapp:+1..."
```

### 4. Firebase Service Account (Required for PDF Uploads)
To enable backend operations like uploading generated PDFs, you must provide a Firebase Service Account Key.

1.  Go to **Firebase Console** > **Project Settings** > **Service Accounts**.
2.  Click **Generate new private key**.
3.  Save the downloaded JSON file as `firebase_test.json` in the **root** of the project.
4.  **Important:** Do not commit this file to Git (it should be in `.gitignore`).

### 5. Running the Server

**Development Mode:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

### 5. Webhook Configuration
Expose your local server using Ngrok:
```bash
ngrok http 3031
```
Set the Twilio Webhook URL to: `https://your-ngrok-url.app/cemtech/receive-message`

---

## 📄 PDF Generation & Delivery

The system can generate a formal estimation PDF and deliver it directly to the client via WhatsApp (media attachment). This involves three components:

### 1. Service Account Requirement
PDF upload uses Firebase Storage through `firebase-admin`. Ensure the service account file `firebase_test.json` exists at the project root (see section 4 above). This file is read in `storageService.ts` to initialize Admin SDK.

### 2. Generation Flow
1. Agent identifies or creates the client (`search_clients` / `lookup_or_create_client`).
2. Agent ensures there is an active estimation (`manage_quote_context`).
3. When user requests the PDF or quote is finalized, the agent calls tool `generate_estimation_pdf`.
4. Tool steps:
     - Fetch estimation + client + items from Supabase.
     - Build PDF via `pdfmake` (`pdfService.generateEstimationPdf`).
     - Upload buffer to Firebase Storage (`storageService.uploadPdfToFirebase`).
     - Update `estimations.pdf_url` and `pdf_updated_at` in Supabase.
     - Send WhatsApp message with the PDF as `mediaUrl` (handled by modified logic in `chatRoutes.ts`).

### 3. Regeneration Logic
If items or totals change after a PDF was generated, the agent prompt instructs it to regenerate to keep the document up to date.

### 4. Key Files
| File | Responsibility |
|------|----------------|
| `src/services/pdfService.ts` | Builds PDF buffer from Supabase data using `pdfmake`. |
| `src/services/storageService.ts` | Uploads PDF to Firebase Storage (public URL). |
| `src/services/whatsappService.ts` | Sends media messages (PDF link as attachment) via Twilio. |
| `src/tools/pdfTools.ts` | LangChain tool `generate_estimation_pdf` orchestrating the entire flow. |
| `src/routes/chatRoutes.ts` | Detects media URLs in agent output and sends them as WhatsApp attachments. |

### 5. Fonts Requirement
Place Roboto fonts under `./fonts/`:
```
fonts/
    Roboto-Regular.ttf
    Roboto-Medium.ttf
    Roboto-Italic.ttf
    Roboto-MediumItalic.ttf
```

### 6. Manual Invocation Example
Inside an internal script or REPL:
```ts
import { generateEstimationPdf } from './src/tools/pdfTools';
await generateEstimationPdf.invoke({ estimation_id: 'UUID-OF-ESTIMATION' });
```

### 7. Troubleshooting
| Issue | Fix |
|-------|-----|
| `storage/missing-dependencies` | Run `npm install @google-cloud/storage`. |
| Fonts not found | Verify `fonts/` directory exists at project root. |
| WhatsApp sends only text | Ensure URL is public and regex in `chatRoutes.ts` matches it. |
| 403 on upload | Check Firebase Storage rules or service account permissions. |

---

## 💬 Example Conversation Flow

Below is a real-world example demonstrating how the contractor uses the system to create quotes for their clients through WhatsApp, from initial contact to PDF generation:

### 📱 Sample Interaction

**Contractor:** Hi, I need to start a new estimate for a client named "Peachtree Builders".

**AI (Cost Engineer):** Could you please provide the email address and phone number for "Peachtree Builders"? This information is necessary to create the client record in our system.

**Contractor:** peachtree@builders.com and the phone number is 4049876543

**AI (Cost Engineer):** I have successfully created a new client record for "Peachtree Builders" and initiated a new draft quote.

The quote ID is **#5** and is currently in draft status.

What items would you like to add to this quote? If you're looking for concrete, please specify the quantity and unit.

**Contractor:** Add 800 SF of 4in Concrete Sidewalk

**AI (Cost Engineer):** I have successfully added **800 SF of 4in Concrete Sidewalk** to the quote.

• **Total Cost**: $10,000

If you need to add more items or review the quote details, please let me know!

**Contractor:** Add 10 hours of Demolition Labor

**AI (Cost Engineer):** I have successfully added **10 hours of Demolition Labor** to the quote.

• **Total Cost for Demolition**: $450

If you need to add more items or review the quote details, please let me know!

**Contractor:** Show me the summary of the quote.

**AI (Cost Engineer):** Here's the summary of the current quote for "Peachtree Builders":

1. **4in Concrete Sidewalk**
   - Quantity: 800 SF
   - Total Cost: $10,000

2. **Demolition Labor**
   - Quantity: 10 hours
   - Total Cost: $450

**Total Estimated Cost**: $10,450

If you need any further modifications or additional items, please let me know!

**Contractor:** Generate the PDF for this quote.

**AI (Cost Engineer):** Perfect. I'm generating the quote in PDF format. I'll send it to you in just a moment...

*(The system generates the PDF, uploads it to Firebase Storage, updates the database, and sends the document as a WhatsApp attachment)*

**Contractor:** *(Receives the PDF attachment with Cemtech logo, itemized breakdown by category, subtotals, and total)*

**AI (Cost Engineer):** I've sent you the formal quote document. The PDF includes all project details for "Peachtree Builders". Is there anything else I can help you with?

**Contractor:** No, that's perfect. Thank you!

**AI (Supervisor):** You're welcome! If you need to adjust the quote or create a new one, feel free to reach out. Have a great day! 🏗️

---

### 🔍 What Happened Behind the Scenes?

1. **Client Recognition:** System searched for "Peachtree Builders", didn't find it, requested contact details
2. **Client Creation:** New record created in `clients` table with provided email and phone
3. **Agent Routing:** Supervisor detected quoting intent → routed to Cost Engineer
4. **Quote Management:** Cost Engineer created new estimation (#5) linked to client in `estimations` table
5. **Catalog Search:** Each item was looked up in the `items` table using fuzzy matching:
   - "4in Concrete Sidewalk" → Found exact match ($12.50/SF)
   - "Demolition Labor" → Found match ($45.00/HR)
6. **Real-time Calculations:** Quantities × unit prices calculated automatically:
   - 800 SF × $12.50 = $10,000
   - 10 HR × $45.00 = $450
   - Total: $10,450
7. **Database Persistence:** All items saved to `estimation_items` table with frozen prices
8. **PDF Generation:**
   * Cost Engineer invoked `generate_estimation_pdf` tool
   * `pdfService` fetched data from Supabase and built PDF with `pdfmake`
   * `storageService` uploaded PDF to Firebase Storage (public URL)
   * Public URL saved to `estimations.pdf_url` and `pdf_updated_at` timestamp updated
9. **WhatsApp Delivery:** Twilio sent the PDF as media attachment to the contractor's WhatsApp
10. **State Management:** `MemorySaver` checkpointer maintained conversation context throughout entire flow

---

## 💾 Database Schema (Supabase)

Key tables required for operation:

*   `chat_history`: Manages session state and human-handoff flags (`chat_on`).
*   `messages`: Stores the full conversation log.
*   `clients`: CRM data for customers.
*   `estimations`: Headers for quotes/estimates.
*   `estimation_items`: Line items for each quote.
*   `items`: Product catalog with pricing.
