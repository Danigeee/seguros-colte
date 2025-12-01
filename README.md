# 🛡️ Seguros Coltefinanciera AI Assistant

> **Asistente Virtual Inteligente para Atención al Cliente y Ventas por WhatsApp.**

Este proyecto es un **Sistema Multi-Agente** sofisticado diseñado para **Coltefinanciera Seguros** para automatizar interacciones complejas, incluyendo identificación de clientes, asesoría de seguros y ventas a través de una interfaz conversacional natural en WhatsApp.

---

## 🌟 Características Clave

*   **🧠 Arquitectura Multi-Agente:** Impulsado por **LangGraph**, el sistema utiliza un agente "Supervisor" (Lucía) para enrutar inteligentemente las solicitudes de los usuarios a agentes especializados (Bienestar Plus, Vida Deudor).
*   **💬 Omnicanal y Multimodal:** Maneja **Texto** y **Notas de Voz** (transcritas vía Whisper) sin problemas a través de WhatsApp.
*   **📊 CRM Integrado:** Integración profunda con **Supabase** para gestionar Clientes (`dentix_clients`) y verificar sus servicios contratados en tiempo real.
*   **⚡ Enrutamiento Inteligente:** Detecta automáticamente el servicio del cliente ("bienestar" o "vidadeudor") para asignar el agente correcto desde el inicio.

---

## 🛠️ Stack Tecnológico

*   **Runtime:** Node.js (TypeScript)
*   **Orquestación:** [LangGraph](https://langchain-ai.github.io/langgraph/) (Grafo Multi-Agente con Estado)
*   **LLM:** OpenAI (**GPT-4o** para razonamiento, **Whisper-1** para audio)
*   **Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL)
*   **Almacenamiento:** [Firebase Storage](https://firebase.google.com/) (Persistencia de medios)
*   **Mensajería:** WhatsApp Business API (vía **Twilio**)

---

## 🧩 Arquitectura del Sistema

El sistema sigue un patrón **Supervisor-Trabajador**:

1.  **Ingesta:**
    *   Usuario envía mensaje a WhatsApp.
    *   **Twilio** reenvía el webhook a nuestro servidor Express.
    *   **Media Handler** procesa audio/imágenes.
    *   Mensaje se guarda en el historial de **Supabase**.

2.  **Identificación y Orquestación:**
    *   **Identify Client:** Busca al cliente por número de teléfono en la tabla `dentix_clients`.
    *   **Supervisor (Lucía):** Analiza el historial y el perfil del cliente.
        *   Si el cliente tiene un servicio asignado (ej. "bienestar"), enruta directamente.
        *   Si es una consulta general, decide según la intención del usuario.

3.  **Agentes Especializados:**
    *   🏥 **Bienestar Plus Advisor:** Especialista en seguros de bienestar, coberturas médicas y beneficios.
    *   💳 **Vida Deudor Advisor:** Especialista en seguros de vida deudor, protección de créditos y saldos.

4.  **Ejecución:**
    *   El agente seleccionado ejecuta herramientas (consultas a BD, envío de información).
    *   La respuesta final se envía al usuario vía Twilio.

---

## 📂 Estructura del Proyecto

```bash
src/
├── agents/           # Definición de Agentes ("Trabajadores")
│   ├── bienestarPlusAdvisor.ts # Lógica para seguro Bienestar Plus
│   ├── vidaDeudorAgent.ts      # Lógica para seguro Vida Deudor
│   ├── identifyClient.ts       # Nodo de identificación de cliente
│   └── agentState.ts           # Interface de estado compartido del grafo
├── config/           # Configuración y Clientes
│   ├── supabase.ts        # Conexión a Base de Datos
│   ├── firebase.ts        # Conexión a Storage
│   └── llm.ts             # Configuración OpenAI
├── functions/        # Lógica de Negocio Core
│   ├── clientFunctions.ts # Funciones de búsqueda de clientes
│   └── ...
├── routes/           # Rutas API
│   └── chatRoutes.ts      # Punto de entrada (Webhook Twilio)
├── services/         # Capa de Acceso a Datos (DAL)
│   ├── crmService.ts      # Gestión de clientes
│   └── chatHistoryService.ts # Persistencia de mensajes
├── tools/            # Herramientas LangChain
│   ├── bienestarTools.ts  # Herramientas específicas de Bienestar
│   ├── vidaDeudorTools.ts # Herramientas específicas de Vida Deudor
│   └── index.ts           # Exportación de herramientas
├── supervisor.ts     # Definición del Grafo Principal y Lógica de Enrutamiento
└── index.ts          # Punto de entrada del Servidor
```

---

## 🚀 Instalación y Configuración

### 1. Prerrequisitos
*   Node.js (v18+)
*   Proyecto Supabase
*   Proyecto Firebase
*   Cuenta Twilio (WhatsApp Sandbox o Live)
*   OpenAI API Key

### 2. Instalación

```bash
git clone <repo-url>
cd seguros-colte
npm install
```

### 3. Variables de Entorno
Crear un archivo `.env` en la raíz:

```env
PORT=3031

# --- AI ---
OPENAI_API_KEY="sk-..."

# --- Database (Supabase) ---
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# --- Storage (Firebase) ---
FIREBASE_API_KEY="..."
# ... (otras credenciales de Firebase)

# --- Communication (Twilio) ---
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="whatsapp:+1..."
```

### 4. Ejecución

**Modo Desarrollo:**
```bash
npm run dev
```

**Build Producción:**
```bash
npm run build
npm start
```

---

## 💬 Ejemplo de Flujo de Conversación

A continuación, un ejemplo de cómo el sistema maneja una interacción:

### 📱 Interacción de Muestra

**Usuario:** Hola

**Sistema (Identificación):** *Detecta número +573001234567 -> Busca en DB -> Encuentra Cliente: "Juan Pérez", Servicio: "Bienestar"*

**Sistema (Supervisor):** *Detecta servicio "Bienestar" -> Enruta a Bienestar Plus Advisor*

**AI (Bienestar Plus Advisor):** ¡Hola Juan! Soy Lucía de Coltefinanciera Seguros. Veo que cuentas con nuestro seguro Bienestar Plus. ¿En qué puedo ayudarte hoy con tu póliza?

**Usuario:** ¿Qué me cubre el seguro si me enfermo?

**AI (Bienestar Plus Advisor):** Con tu seguro Bienestar Plus tienes acceso ilimitado a telemedicina general. Si tienes síntomas leves, puedes consultar con un médico por videollamada sin costo adicional. También cuentas con médico a domicilio por un copago de $25,000. ¿Te gustaría agendar una teleconsulta?

**Usuario:** Sí, por favor.

**AI (Bienestar Plus Advisor):** Perfecto. Para agendar, necesito que... (continúa el proceso de asistencia)

---

## 💾 Esquema de Base de Datos (Supabase)

Tablas clave requeridas:

*   `dentix_clients`: Información de clientes (nombre, teléfono, email, servicio, producto).
*   `chat_history`: Historial de conversaciones.
*   `messages`: Log completo de mensajes.
