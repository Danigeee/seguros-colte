import { runTests } from './test-bienestar-documents';

console.log('🚀 Ejecutando pruebas de Bienestar Plus Documents...\n');

runTests()
    .then(() => {
        console.log('\n✅ Pruebas completadas');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error ejecutando pruebas:', error);
        process.exit(1);
    });