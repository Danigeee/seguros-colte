# Documentación del Webhook de Pagos (Payments Way)

Este documento describe el funcionamiento, la estructura y el uso del endpoint de webhook para la integración con la pasarela de pagos **Payments Way**.

## Descripción General

El endpoint `/webhook/payments-way` está diseñado para recibir notificaciones asíncronas sobre el estado de las transacciones procesadas por la pasarela de pagos. Su función principal es registrar estos eventos en la base de datos (Supabase) y vincular automáticamente los pagos con los clientes existentes en el sistema.

## Endpoint

- **URL Relativa:** `/webhook/payments-way`
- **Método HTTP:** `POST`
- **Autenticación:** No requerida (público para la pasarela).

## Flujo de Proceso

1.  **Recepción de Datos:** Se recibe un payload JSON con los detalles de la transacción.
2.  **Validación:** Se verifica que el payload contenga la información mínima necesaria (`idstatus`).
3.  **Normalización:** Se manejan posibles inconsistencias en los nombres de campos (ej. `amount` vs `ammount`).
4.  **Vinculación de Cliente:**
    *   Se busca un cliente existente en la tabla `dentix_clients` usando el correo electrónico (`idperson.email`).
    *   Si no se encuentra por correo, se intenta buscar por número de teléfono (`idperson.phone`).
    *   Si se encuentra, se obtiene su ID para asociarlo al registro del pago.
5.  **Persistencia:** Se inserta un nuevo registro en la tabla `payment_logs` de Supabase con todos los detalles de la transacción y el ID del usuario (si fue encontrado).
6.  **Respuesta:**
    *   Si el estado es **Exitosa (34)**: Se responde con `200 OK`.
    *   Para cualquier otro estado (Rechazada, Pendiente, Fallida): Se responde con `201 Received`.
    *   En caso de error interno o de base de datos: Se responde con `500 Internal Server Error`.

## Estructura del Payload (Request Body)

El webhook espera un objeto JSON con la siguiente estructura:

```json
{
  "id": "string",             // ID único de la transacción en la pasarela
  "externalorder": "string",  // ID de la orden generado por el comercio
  "amount": number,           // Monto de la transacción
  "fullname": "string",       // Nombre del pagador
  "ip": "string",             // Dirección IP del cliente (opcional)
  "idstatus": {
    "id": number,             // ID del estado (ej. 34 = Exitosa)
    "nombre": "string"        // Nombre del estado (ej. "Aprobada")
  },
  "idperson": {
    "email": "string",        // Correo electrónico del pagador
    "phone": "string",        // Teléfono del pagador
    "firstname": "string",    // (Opcional) Nombre
    "lastname": "string",     // (Opcional) Apellido
    "identification": "string"// (Opcional) Documento de identidad
  },
  "paymentmethod": {
    "id": number,             // (Opcional) ID del método de pago
    "nombre": "string"        // Nombre del método (ej. "PSE")
  },
  "additionaldata": any,      // (Opcional) Datos adicionales
  "innerexception": any       // (Opcional) Detalles de errores (ej. en rechazos)
}
```

## Códigos de Estado de la Transacción

Los códigos más comunes manejados por la pasarela son:

| ID | Estado | Descripción | Respuesta del Webhook |
| :--- | :--- | :--- | :--- |
| **34** | **Exitosa** | La transacción fue aprobada. | `200 OK` |
| 1 | Creada | La transacción ha sido iniciada. | `201 Received` |
| 35 | Pendiente | La transacción está en proceso. | `201 Received` |
| 36 | Fallida | La transacción falló. | `201 Received` |
| 38 | Cancelada | La transacción fue cancelada por el usuario. | `201 Received` |

## Base de Datos (Supabase)

Los datos se almacenan en la tabla `payment_logs`.

### Esquema de la Tabla `payment_logs`

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `bigint` | Identificador único del registro (PK). |
| `created_at` | `timestamp` | Fecha y hora de registro. |
| `order_id` | `text` | ID de la orden externa (`externalorder`). |
| `transaction_id` | `text` | ID de la transacción de la pasarela (`id`). |
| `amount` | `numeric` | Monto de la transacción. |
| `status_id` | `integer` | ID del estado de la transacción. |
| `status_name` | `text` | Nombre del estado. |
| `payer_email` | `text` | Email del pagador. |
| `payer_phone` | `text` | Teléfono del pagador. |
| `payer_name` | `text` | Nombre completo del pagador. |
| `payment_method` | `text` | Método de pago utilizado. |
| `user_id` | `bigint` | ID del cliente vinculado en `dentix_clients` (FK). |
| `raw_response` | `jsonb` | Payload JSON completo recibido (para auditoría). |

## Pruebas

Para probar el webhook localmente, se puede utilizar el script incluido en el proyecto:

```bash
npx tsx src/test/test-payment-webhook.ts
```

Este script simula una petición `POST` al endpoint local con datos de prueba. Asegúrate de que el servidor esté corriendo (`npm run dev`) antes de ejecutar la prueba.
