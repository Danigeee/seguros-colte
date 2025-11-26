import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { setChatHistoryName } from './setChatHistoryName.js';
import { setChatHistoryService } from './setChatHistoryService.js';

dotenv.config();

// Twilio configuration
const MessagingResponse = twilio.twiml.MessagingResponse;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseKey);


// Función para brindar canal de contacto de otros servicios diferentes a servicios contables y de revisoría fiscal ofrecidos por Fenix Medellín
export function contactCustomerService() {
  const customerServiceData = {
    whatsapp: "https://wa.me/573104000000",
    description: "Linea de atención especializada para otros servicios.",
  };

  return JSON.stringify(customerServiceData);
}

export async function getProductInventory(sku: string) {
  console.log('Consultando inventario para SKU:', sku);
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('sku, stock_medellin, stock_la_ceja, price')
      .eq('sku', sku)
      .single();

    if (error) {
      console.error('Error al consultar inventario:', error);
      return JSON.stringify({
        success: false,
        message: 'No se pudo consultar la información del producto',
        error: error.message
      });
    }

    if (!data) {
      return JSON.stringify({
        success: false,
        message: `No se encontró el producto con SKU: ${sku}`,
        data: null
      });
    }

    return JSON.stringify({
      success: true,
      product: {
        sku: data.sku,
        availability: {
          medellin: data.stock_medellin,
          laCeja: data.stock_la_ceja,
          total: data.stock_medellin + data.stock_la_ceja
        },
        price: data.price,
        formattedPrice: `$${data.price.toLocaleString('es-CO')}`
      }
    });
  } catch (error) {
    console.error('Error inesperado:', error);
    return JSON.stringify({
      success: false,
      message: 'Ocurrió un error al procesar la solicitud',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

// Función que envía la url de la cotización al cliente por WhatsApp
export async function sendQuoteToWhatsApp(quoteUrl: string, phoneNumber: string) {
  
  const message = await client.messages.create({
    // body: 'Mensaje con archivo',
    to: `whatsapp:${phoneNumber}`,
    from: 'whatsapp:+573003751567',
    // from: `whatsapp:+5742044644`,
    // from: `whatsapp:+14155238886`,
    mediaUrl: [quoteUrl],
  });
  console.log('Quote file message sent successfully');
}

export async function fetchUserName(firstNumber: string) {
  console.log('fetchUserName:', firstNumber);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', firstNumber)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return "No se encontró el nombre del cliente.";
  }
  
  // Actualizar el nombre del cliente en el historial del chat
  if (data.name) {
    await setChatHistoryName(data.name);
    await setChatHistoryService(data.area);
  }

  console.log('User:', data);

  return JSON.stringify(data);
}

export async function sendEmailNotification(name: string, phone: string, message: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });

  const mailOptions = {
    from: '"¡Producto sin stock!" <grow@ultimmarketing.com>',
    to: 'daniel.a@ultimmarketing.com',
    cc: [],
    subject: 'Fénix - Cliente requiere productos sin stock suficiente',
    text: `¡Cliente requiere productos que no están disponibles en stock! \n\nNombre: ${name} \nCelular: ${phone} \n\nDetalles del requerimiento:\n${message}\n\nPor favor, contacta al cliente lo antes posible para informarle sobre alternativas, tiempos de reposición o continuar con el proceso de compra.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return "Email enviado correctamente.";
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export async function sendSoftwareSpecialistNotification(name: string, phone: string, message: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });

  const mailOptions = {
    from: '"Consulta Software" <grow@ultimmarketing.com>',
    to: 'daniel.a@ultimmarketing.com', // Puedes cambiar este email por el del especialista en software
    cc: [],
    subject: 'Fénix - Cliente consulta sobre productos de software',
    text: `¡Cliente interesado en productos de software! \n\nNombre: ${name} \nCelular: ${phone} \n\nConsulta específica:\n${message}\n\nPor favor, contacta al cliente para brindarle asesoría especializada en software.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Software specialist email sent:', info.response);
    return "Email enviado al especialista en software correctamente.";
  } catch (error) {
    console.error('Error sending software specialist email:', error);
    throw error;
  }
}