# Tests para Documentos de Bienestar Plus

Este directorio contiene pruebas para verificar el funcionamiento de la tabla `documents_bienestar_plus` en Supabase.

## Archivos de Test

### 1. `test-bienestar-documents.ts`
Test completo que verifica:
- ✅ Acceso directo a la tabla `documents_bienestar_plus`
- ✅ Función de búsqueda vectorial `match_documents_bienestar_plus`
- ✅ SupabaseVectorStore con LangChain
- ✅ Función principal `searchBienestarDocuments`

### 2. `quick-bienestar-test.ts`
Test rápido que verifica:
- ✅ Si la tabla existe
- ✅ Cantidad de registros
- ✅ Estructura de la tabla
- ✅ Disponibilidad de función vectorial

### 3. `run-bienestar-test.ts`
Ejecutor para el test completo.

## Cómo Ejecutar

### Test Completo
```bash
npm run test:bienestar
```

### Test Rápido
```bash
npm run test:bienestar:quick
```

### Ejecutar directamente con tsx
```bash
npx tsx src/test/quick-bienestar-test.ts
npx tsx src/test/run-bienestar-test.ts
```

## Configuración Requerida

Asegúrate de tener configuradas las siguientes variables de entorno:

```env
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
OPENAI_API_KEY=tu_openai_api_key
```

## Interpretación de Resultados

### ✅ PASS - Todo funciona correctamente
- La tabla existe y es accesible
- La función vectorial está disponible
- Los embeddings se generan correctamente
- Las búsquedas devuelven resultados

### ❌ FAIL - Problemas encontrados
- **Tabla no existe**: Necesitas crear la tabla en Supabase
- **Función no existe**: Necesitas crear la función `match_documents_bienestar_plus`
- **Sin resultados**: La tabla puede estar vacía o sin embeddings
- **Error de configuración**: Verifica las variables de entorno

## Troubleshooting

### Error: Tabla no encontrada
1. Verifica que la tabla `documents_bienestar_plus` existe en Supabase
2. Verifica permisos de acceso con el Service Role Key

### Error: Función vectorial no encontrada
1. Necesitas crear la función SQL en Supabase:
```sql
CREATE OR REPLACE FUNCTION match_documents_bienestar_plus(
  query_embedding vector(1536),
  match_count int DEFAULT null,
  filter jsonb DEFAULT '{}'
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
    id,
    content,
    metadata,
    embedding,
    1 - (documents_bienestar_plus.embedding <=> query_embedding) AS similarity
  FROM documents_bienestar_plus
  WHERE metadata @> filter
  ORDER BY documents_bienestar_plus.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Error: OpenAI API
1. Verifica que `OPENAI_API_KEY` esté configurada
2. Verifica que tengas créditos disponibles en OpenAI

## Estructura Esperada de la Tabla

La tabla `documents_bienestar_plus` debe tener:

```sql
CREATE TABLE documents_bienestar_plus (
  id bigint PRIMARY KEY,
  content text,
  metadata jsonb,
  embedding vector(1536)
);
```

## Datos de Ejemplo

Para poblar la tabla con datos de prueba, puedes insertar:

```sql
INSERT INTO documents_bienestar_plus (content, metadata) VALUES 
('Bienestar Plus es un seguro de cobertura integral familiar con servicios médicos especializados', '{"type": "info", "category": "general"}'),
('Las tarifas del seguro Bienestar Plus son: Plan Básico $45,000/mes, Plan Completo $65,000/mes', '{"type": "pricing", "category": "tarifa"}'),
('La cobertura incluye consultas médicas, exámenes de laboratorio, procedimientos ambulatorios', '{"type": "coverage", "category": "cobertura"}');
```

Luego generar los embeddings con OpenAI API.