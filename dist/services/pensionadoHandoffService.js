import twilioClient from '../config/twilioConfig.js';
import { supabase } from '../config/supabase.js';
export async function processPensionadoHandoff(payload) {
    const { telefono, nombre } = payload;
    // Normalizar teléfono (mismo patrón que mefiaService.ts)
    let phoneDigits = telefono.replace(/\D/g, '');
    if (!phoneDigits.startsWith('57') && phoneDigits.length === 10) {
        phoneDigits = `57${phoneDigits}`;
    }
    const formattedPhone = `+${phoneDigits}`;
    console.log(`[PensionadoHandoff] Procesando handoff para ${formattedPhone}, nombre: ${nombre || 'no provisto'}`);
    // Intentar actualizar registro existente primero (sin tocar messages ni otros campos)
    const updateFields = { origin: 'elevenlabs_pensionado' };
    if (nombre)
        updateFields.client_name = nombre;
    const { data: updated, error: updateError } = await supabase
        .from('chat_history')
        .update(updateFields)
        .eq('client_number', formattedPhone)
        .select('id');
    if (updateError) {
        console.error('[PensionadoHandoff] Error actualizando chat_history:', updateError);
        throw new Error('No se pudo registrar el origen del cliente.');
    }
    // Si no existía el registro, crearlo
    if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase
            .from('chat_history')
            .insert({
            client_number: formattedPhone,
            client_name: nombre || 'Pensionado',
            agent_name: 'Lucía - Coltefinanciera Seguros',
            messages: [],
            chat_on: false,
            chat_status: 'open',
            origin: 'elevenlabs_pensionado'
        });
        if (insertError) {
            console.error('[PensionadoHandoff] Error insertando en chat_history:', insertError);
            throw new Error('No se pudo crear el registro del cliente.');
        }
        console.log(`[PensionadoHandoff] Nuevo registro creado para ${formattedPhone}`);
    }
    else {
        console.log(`[PensionadoHandoff] Registro existente actualizado para ${formattedPhone}`);
    }
    // Enviar template de WhatsApp
    const templateSid = process.env.PENSIONADO_TEMPLATE_SID;
    if (!templateSid) {
        console.warn('[PensionadoHandoff] PENSIONADO_TEMPLATE_SID no configurado — omitiendo envío de template.');
        return;
    }
    const contentVariables = {};
    if (nombre)
        contentVariables['1'] = nombre;
    const message = await twilioClient.messages.create({
        from: 'whatsapp:+5742044840',
        to: `whatsapp:${formattedPhone}`,
        contentSid: templateSid,
        ...(nombre ? { contentVariables: JSON.stringify(contentVariables) } : {})
    });
    console.log(`[PensionadoHandoff] Template enviado a ${formattedPhone}. SID: ${message.sid}`);
}
