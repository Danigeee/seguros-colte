import dotenv from 'dotenv';
import { generatePaymentLinkFlow } from '../src/services/paymentsWayService.js';
import { PaymentFlowRequest } from '../src/types/paymentsWay.js';

dotenv.config();

async function testPaymentFlow() {
  console.log('🚀 Iniciando prueba de flujo de pago...');

  const testData: PaymentFlowRequest = {
    firstname: 'Alejandro',
    lastname: 'Betancur',
    identification: '1143939192',
    email: 'alejandro.b@ultimmarketing.com',
    phone: '3045655669',
    amount: 15000,
    description: 'Prueba de Seguro Bienestar Plus - $15.000 COP',
    clientId: 12, // Usamos un ID de cliente existente o ficticio para la prueba
    totalInstallments: 4
  };

  try {
    console.log('Datos de prueba:', JSON.stringify(testData, null, 2));
    
    const paymentLink = await generatePaymentLinkFlow(testData);
    
    console.log('\n✅ PRUEBA EXITOSA');
    console.log('-------------------');
    console.log(`Link de pago generado: ${paymentLink}`);
    console.log('-------------------');
    console.log('Revisa la tabla "suscripciones" en Supabase para verificar el registro.');

  } catch (error: any) {
    console.error('\n❌ ERROR EN LA PRUEBA');
    console.error('-------------------');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Mensaje:', error.message);
    }
  }
}

testPaymentFlow();
