/**
 * inspect-pdf-fields.mjs
 *
 * Genera una copia diagnóstica de un PDF:
 *  - Cada TextField muestra su propio nombre como valor
 *  - Todos los CheckBox quedan marcados
 *
 * Uso:
 *   node scripts/inspect-pdf-fields.mjs docs/casur/libranza_template.pdf
 *   node scripts/inspect-pdf-fields.mjs "docs/casur/30032026_FVC01-022026-V2 (1).pdf"
 *
 * El archivo de salida se guarda como <nombre>__DIAGNOSTICO.pdf en la misma carpeta.
 */

import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

const [,, inputFile] = process.argv;
if (!inputFile) {
  console.error('Uso: node scripts/inspect-pdf-fields.mjs <ruta-al-pdf>');
  process.exit(1);
}

const bytes = fs.readFileSync(inputFile);
const doc   = await PDFDocument.load(bytes);
const form  = doc.getForm();
const fields = form.getFields();

console.log(`\n📄  ${inputFile}`);
console.log(`    ${fields.length} campo(s) encontrado(s)\n`);

for (const field of fields) {
  const name = field.getName();
  const type = field.constructor.name;
  try {
    if (type === 'PDFTextField') {
      field.setText(name);           // muestra su propio nombre
      console.log(`  TextField  | ${name}`);
    } else if (type === 'PDFCheckBox') {
      field.check();                 // marca todos
      console.log(`  CheckBox   | ${name}  ✓`);
    } else if (type === 'PDFDropdown') {
      const opts = field.getOptions();
      if (opts.length) field.select(opts[0]);
      console.log(`  Dropdown   | ${name}  → "${opts[0] ?? ''}"`);
    } else {
      console.log(`  ${type.padEnd(12)}| ${name}`);
    }
  } catch (e) {
    console.warn(`  ⚠️  Error en ${name}: ${e.message}`);
  }
}

const outDir  = path.dirname(inputFile);
const outName = path.basename(inputFile, '.pdf') + '__DIAGNOSTICO.pdf';
const outPath = path.join(outDir, outName);
fs.writeFileSync(outPath, await doc.save());
console.log(`\n✅  PDF diagnóstico guardado en:\n    ${outPath}\n`);
