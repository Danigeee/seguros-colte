import { supabase } from '../config/supabase.js';

/**
 * Retorna el siguiente transactionId consecutivo con formato 7 dígitos (ej: "0000001").
 *
 * Requiere en Supabase (correr una sola vez en el SQL editor):
 *
 *   CREATE TABLE IF NOT EXISTS libranza_counters (
 *     id TEXT PRIMARY KEY,
 *     last_value INTEGER NOT NULL DEFAULT 0
 *   );
 *   INSERT INTO libranza_counters (id, last_value)
 *   VALUES ('libranza_global', 0)
 *   ON CONFLICT DO NOTHING;
 *
 *   CREATE OR REPLACE FUNCTION increment_libranza_counter()
 *   RETURNS INTEGER AS $$
 *     UPDATE libranza_counters
 *     SET last_value = last_value + 1
 *     WHERE id = 'libranza_global'
 *     RETURNING last_value;
 *   $$ LANGUAGE sql;
 */
export async function getNextTransactionId(): Promise<string> {
  const { data, error } = await (supabase as any).rpc('increment_libranza_counter');
  if (error) throw new Error(`[TransactionCounter] Error al obtener ID: ${error.message}`);
  return String(data as number).padStart(7, '0');
}
