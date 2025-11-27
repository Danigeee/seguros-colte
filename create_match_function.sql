-- Función de búsqueda vectorial para documents_bienestar_plus
-- Ejecuta este código en el SQL Editor de Supabase

-- Primero eliminar la función existente si existe
DROP FUNCTION IF EXISTS match_documents_bienestar_plus(vector, integer, jsonb);

-- Crear la nueva función
CREATE OR REPLACE FUNCTION match_documents_bienestar_plus(
  query_embedding vector(1536),
  match_count int DEFAULT NULL,
  filter jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE(
  id bigint,
  content text,
  metadata jsonb,
  embedding vector(1536),
  similarity float
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
BEGIN
  RETURN query
  SELECT
    documents_bienestar_plus.id,
    documents_bienestar_plus.content,
    documents_bienestar_plus.metadata,
    documents_bienestar_plus.embedding,
    1 - (documents_bienestar_plus.embedding <=> query_embedding) AS similarity
  FROM documents_bienestar_plus
  WHERE documents_bienestar_plus.metadata @> filter
  ORDER BY documents_bienestar_plus.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- También asegurar que RLS esté configurado correctamente
ALTER TABLE documents_bienestar_plus ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si existe para evitar conflictos
DROP POLICY IF EXISTS "Allow service role to select documents_bienestar_plus" ON documents_bienestar_plus;

-- Crear nueva política para permitir SELECT con service role
CREATE POLICY "Allow service role to select documents_bienestar_plus"
ON documents_bienestar_plus
FOR SELECT
TO service_role
USING (true);

-- Comentario de verificación
-- Después de ejecutar, puedes probar con:
-- SELECT * FROM match_documents_bienestar_plus(
--   '[0.1,0.1,0.1,...]'::vector,  -- embedding de prueba
--   5,                            -- límite de resultados
--   '{}'::jsonb                   -- filtro
-- );