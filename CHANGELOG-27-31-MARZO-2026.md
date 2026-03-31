# Changelog — 27 al 31 de Marzo 2026

Registro de todos los cambios realizados al proyecto **seguros-colte** durante esta semana.

---

## Commit: `96cf51c` — Lunes 30 de Marzo 2026
**Mensaje:** `send pdf me fia`

---

### Archivos Nuevos Creados

#### `src/tools/andesTools.ts`
Módulo completo de herramientas LangChain para integración con el servicio SOAP de Andes SCD (firma electrónica). Incluye:
- `verificar_estado_andes` — Verifica disponibilidad del servicio Andes vía backend.
- `solicitar_certificado` — Solicita el certificado de firma y envía el OTP al cliente por email.
- `firmar_documento` — Firma el documento electrónicamente usando el código OTP del cliente. Resuelve automáticamente el Base64 del PDF desde el store servidor-side.
- `descargar_certificado` — Descarga el certificado firmado y lo envía al cliente por correo (Resend) y por WhatsApp.
- Helper `fetchConTimeout` para evitar cuelgues indefinidos al llamar al backend de Andes (timeout: 10 segundos).

#### `src/tools/generarPdfBase64Tool.ts`
Herramienta LangChain para generar el PDF `"SOLICITUD ASISTENCIA BIENESTAR PLUS PROTEGIDO"` con los datos del cliente diligenciados, destinada exclusivamente al flujo de **descuento por pensión**. Características:
- Acepta los 12 datos obligatorios del cliente (nombres, identificación, fecha de nacimiento, dirección, etc.).
- Llena los campos del formulario PDF con `pdf-lib`.
- Guarda el Base64 del PDF en un store servidor-side (`pdfBase64Store`) para evitar inflar el contexto del LLM.
- Retorna una clave corta (`pdfKey`) que el agente usa en `firmar_documento`.
- Guarda los datos también en Google Sheets.

#### `CLAUDE.md`
Documentación del proyecto para Claude Code. Incluye arquitectura del sistema, flujo de peticiones, tabla de agentes, estructura de capas, configuración de LLM, servicios externos y variables de entorno requeridas.

#### `babel.json`
Configuración de Babel agregada al proyecto.

---

### Archivos Modificados

#### `src/agents/bienestarPlusAdvisor.ts`
Se añadió soporte para el nuevo flujo de pago **"Descuento por Pensión"**:

- **Nuevas reglas de máxima prioridad (#1 y #2)** al inicio del prompt:
  - `[DOCUMENTO_PDF_RECIBIDO]`: Cuando el cliente devuelve el PDF firmado, el agente responde con un mensaje de confirmación y **no vuelve a generar ni enviar el PDF**.
  - **Firma con OTP**: Si el último mensaje del cliente es un código numérico de 6-8 dígitos y ya se ejecutó `solicitar_certificado`, el agente ejecuta directamente `firmar_documento` sin llamar ninguna otra herramienta antes.

- **Flujo de Descuento por Pensión** (nuevo bloque en el prompt):
  1. Recopilar los 12 datos del cliente.
  2. Ejecutar `generarPdfBase64Tool`.
  3. Ejecutar `verificar_estado_andes`.
  4. Ejecutar `solicitar_certificado` con `notificacion: 1` (OTP por email).
  5. Esperar el código OTP del cliente.
  6. Ejecutar `firmar_documento` con el OTP y número de identificación.
  7. Ejecutar `descargar_certificado` para enviar el documento firmado.

- **Herramientas disponibles ampliadas**: Se agregaron `andesTools` y `generarPdfBase64Tool` al array `tools` del agente.

- **Opción de pensión en el flujo de confirmación**: El mensaje "¿Quieres activar tu Bienestar Plus Protegido?" ahora pregunta también si el cliente es pensionado para dirigirlo al flujo correcto.

**Cambios no commiteados (pendientes):**
- Refinamiento del flujo de confirmación: el agente primero pregunta "¿Eres pensionado(a)?" antes de mostrar las opciones de pago. Si es pensionado, va directo al flujo de descuento; si no, ofrece solo enlace web o Me Fía.

---

#### `src/functions/sharedFunctions.ts`
Dos nuevas funciones añadidas al final del archivo para el flujo de notificación de documentos firmados:

- **`saveDocumentChannel(clientPhone, templateSidOrChannel)`**: Guarda en memoria (Map) el canal de contacto usado para enviarle el documento al cliente. Permite recuperar ese canal cuando el cliente devuelva el PDF firmado.

- **`notifySignedDocumentReceived(clientName, clientPhone)`**: Envía una notificación por email a `daniel@ultimmarketing.com` cuando un usuario devuelve un documento PDF firmado por WhatsApp. Usa **Resend** (`notification@ultim.pro`). Incluye:
  - Deduplicación de 5 minutos para evitar envíos múltiples por el mismo cliente.
  - Recuperación del canal de contacto original desde el store en memoria.
  - Consulta al historial de chat en Supabase para obtener el nombre del cliente si no está disponible.

- **`TEMPLATE_SID_CHANNEL_MAP`**: Mapa de SIDs de plantilla Twilio a descripciones de canal para incluir en el email de notificación.

*Nota: También hubo cambios de espaciado (whitespace) en el HTML del email de `notifySupervisorPaymentLink` — sin impacto funcional.*

---

#### `src/routes/chatRoutes.ts`
Lógica de detección de documentos firmados añadida en dos puntos del webhook:

1. **Modo atención humana (`chat_on`)**: Si se recibe un archivo que no es imagen, se llama `notifySignedDocumentReceived` de forma asíncrona (no bloquea la respuesta).

2. **Modo IA**: Si `messageType === 'document'`:
   - Llama `notifySignedDocumentReceived` asíncronamente.
   - Descarga el PDF desde Firebase, lo convierte a Base64 y lo envía como adjunto por email a `danielmoyemanizales@gmail.com` vía Resend (from: `notificaciones@asistenciacoltefinanciera.com`).
   - Sobrescribe el mensaje del usuario a `[DOCUMENTO_PDF_RECIBIDO] El cliente acaba de enviar un documento PDF firmado...` para que el agente responda correctamente sin regenerar el PDF.

---

#### `src/services/mefiaService.ts`
Después de enviar la plantilla de WhatsApp con el documento Me Fía al cliente, ahora se llama `saveDocumentChannel` para registrar el canal de contacto (`HX5755ee032cc78fab1940d6c71c3111a8` — plantilla Me Fía). Esto permite identificar el canal cuando el cliente devuelva el documento firmado.

---

#### `src/services/whatsappService.ts`
Cambio de número de Twilio:
- Número de producción `+5742044840` comentado.
- Número de sandbox `+14155238886` activado.

*(Cambio temporal para pruebas.)*

---

#### `src/tools/procesarPagoMeFiaTool.ts`
Cambios menores (no funcionales según historial).

#### `src/test-payment-flow.ts`
Ajuste menor en el archivo de pruebas de PaymentsWay.

---

## Cambios Sin Commitear (al 31 de Marzo 2026)

**Archivo:** `src/agents/bienestarPlusAdvisor.ts`

Refinamiento del flujo de ventas — 11 líneas modificadas:
- La pregunta de confirmación de compra ahora es más directa: "¿Quieres activar tu Bienestar Plus Protegido?"
- Se agregó un paso intermedio: "¿Eres pensionado(a)?" para segmentar el flujo de pago desde el inicio.
- Si el cliente es pensionado → flujo de descuento por pensión directamente.
- Si el cliente no es pensionado → se ofrece solo enlace de pago o Me Fía (nunca se menciona el descuento por pensión a no pensionados).
- Se actualizaron las reglas del bloque `**REGLAS DE VENTA ESTRICTAS**` para reflejar la misma lógica de segmentación.

---

## Resumen de Nuevas Funcionalidades

| Funcionalidad | Estado |
|---|---|
| Flujo de pago por descuento de pensión (Bienestar Plus) | ✅ Commiteado |
| Firma electrónica con Andes SCD (OTP por email) | ✅ Commiteado |
| Generación de PDF en Base64 para firma electrónica | ✅ Commiteado |
| Notificación al supervisor cuando cliente devuelve PDF firmado (Resend) | ✅ Commiteado |
| Envío de copia del PDF firmado a danielmoyemanizales@gmail.com | ✅ Commiteado |
| Detección automática de documentos firmados en webhook | ✅ Commiteado |
| Segmentación pensionado/no pensionado en flujo de ventas | ⏳ Sin commitear |

## Problemas Conocidos (sin resolver al 31 de Marzo)

- **SendGrid 401 Unauthorized**: `notifySupervisorPaymentLink` falla al enviar notificación al supervisor porque la API key de SendGrid en `.env` está inválida o expirada. El error se captura y no interrumpe el flujo — el link de pago sí se genera correctamente.
- **Error en `suscripciones`**: El insert en Supabase dentro de `generatePaymentLinkFlow` falla silenciosamente. El link de pago sí se genera, pero el registro de suscripción no queda guardado.
- **Investigación en curso**: Se está analizando por qué los emails de link de pago de PaymentsWay llegan correctamente en pruebas directas pero presentan inconsistencias en el flujo del agente.
