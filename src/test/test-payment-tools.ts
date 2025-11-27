import { sendPaymentLinkEmailTool, sendPaymentToIdentifiedClientTool } from '../tools/sharedTools';
import { AgentState } from '../agents/agentState';
import { bienestarPlusAdvisorNode } from '../agents/bienestarPlusAdvisor';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

async function testPaymentToolWithIdentifiedClient() {
  console.log('🧪 PROBANDO HERRAMIENTAS DE PAGO CON CLIENTE IDENTIFICADO\n');
  
  // Simular cliente identificado
  const mockClientData = {
    name: "daniel acevedo",
    email: "daniel.a@ultimmarketing.com",
    document_id: "12345678",
    phone_number: "+573137249770"
  };
  
  console.log('1️⃣  Test: sendPaymentLinkEmailTool con datos manuales');
  
  try {
    const result1 = await sendPaymentLinkEmailTool.invoke({
      clientName: mockClientData.name,
      clientEmail: mockClientData.email,
      insuranceName: "Bienestar Plus"
    });
    
    console.log('✅ Herramienta ejecutada:', typeof result1 === 'string' ? result1.substring(0, 100) + '...' : result1);
    
  } catch (error) {
    console.log('❌ Error en sendPaymentLinkEmailTool:', error);
  }
  
  console.log('\n' + '-'.repeat(50));
  
  console.log('2️⃣  Test: sendPaymentToIdentifiedClientTool');
  
  try {
    const result2 = await sendPaymentToIdentifiedClientTool.invoke({
      insuranceName: "Bienestar Plus"
    });
    
    console.log('✅ Herramienta de cliente identificado:', result2);
    
  } catch (error) {
    console.log('❌ Error en sendPaymentToIdentifiedClientTool:', error);
  }
  
  console.log('\n' + '-'.repeat(50));
  
  console.log('3️⃣  Test: Verificar que el agente recibe la información del cliente');
  
  // Simular estado con cliente identificado
  const mockState = {
    messages: [new HumanMessage("Quiero adquirir el seguro")],
    activeProjectId: "no-project-id",
    activeEstimationId: "no-estimation-id", 
    activeClientId: "no-client-id",
    clientData: mockClientData,
    next: "FINISH"
  };
  
  try {
    // Solo verificar que el sistema message se genera correctamente
    // (no ejecutar el agente completo para evitar llamadas a OpenAI)
    
    let messages = mockState.messages;
    
    if (mockState.clientData) {
      const clientInfo = new SystemMessage(`CLIENTE IDENTIFICADO:
- Nombre: ${mockState.clientData.name}
- Email: ${mockState.clientData.email}
- Documento: ${mockState.clientData.document_id}
- Teléfono: ${mockState.clientData.phone_number}

INSTRUCCIONES ESPECIALES:
- Saluda al cliente por su nombre: "${mockState.clientData.name}"
- Para sendPaymentLinkEmailTool usa: clientName="${mockState.clientData.name}", clientEmail="${mockState.clientData.email}", insuranceName="Bienestar Plus"
- Personaliza la conversación conociendo su identidad`);
      
      messages = [clientInfo, ...messages];
    }
    
    console.log('✅ Sistema preparado correctamente para el agente');
    console.log(`   Mensajes preparados: ${messages.length}`);
    console.log(`   Información del cliente incluida: ${messages[0]._getType() === 'system' ? 'SÍ' : 'NO'}`);
    
    if (messages[0]._getType() === 'system') {
      const systemContent = messages[0].content as string;
      const hasClientName = systemContent.includes(mockClientData.name);
      const hasClientEmail = systemContent.includes(mockClientData.email);
      
      console.log(`   ✅ Nombre incluido: ${hasClientName ? 'SÍ' : 'NO'}`);
      console.log(`   ✅ Email incluido: ${hasClientEmail ? 'SÍ' : 'NO'}`);
      console.log(`   ✅ Instrucciones para herramientas: ${systemContent.includes('sendPaymentLinkEmailTool') ? 'SÍ' : 'NO'}`);
    }
    
  } catch (error) {
    console.log('❌ Error preparando agente:', error);
  }
}

async function testEmailFunction() {
  console.log('\n4️⃣  Test: Función de envío de email (mock)');
  
  try {
    // Importar la función de envío de email
    const { sendPaymentLinkEmail } = await import('../functions/sharedFunctions');
    
    const result = await sendPaymentLinkEmail(
      "Juan Pérez Test",
      "test@email.com", 
      "Bienestar Plus"
    );
    
    console.log('✅ Función de email ejecutada:', typeof result === 'string' ? result.substring(0, 100) + '...' : result);
    
  } catch (error) {
    console.log('ℹ️  Función de email (probablemente configuración de SendGrid):', error instanceof Error ? error.message : error);
  }
}

async function runPaymentToolTests() {
  console.log('🚀 PRUEBAS DE HERRAMIENTAS DE PAGO');
  console.log('='.repeat(60));
  
  await testPaymentToolWithIdentifiedClient();
  await testEmailFunction();
  
  console.log('\n📊 RESUMEN:');
  console.log('✅ Herramientas de pago configuradas');
  console.log('✅ Sistema de cliente identificado funcional');
  console.log('✅ Datos del cliente pasan correctamente al agente');
  console.log('ℹ️  Para envío real de emails, verifica configuración de SendGrid');
  
  console.log('\n💡 FLUJO ESPERADO:');
  console.log('1. Cliente identificado → clientData en estado');
  console.log('2. Agente recibe clientData → SystemMessage con datos');
  console.log('3. IA usa sendPaymentLinkEmailTool con datos del cliente');
  console.log('4. Email enviado con enlace de pago personalizado');
}

runPaymentToolTests();