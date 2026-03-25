import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_BP_EMAIL || '';
// Se reemplazan los caracteres escapados en caso de que la clave privada tenga saltos de línea literales en el .env
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_BP_KEY?.replace(/\\n/g, '\n') || '';
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_BP_ID || '';

// Configuración de autenticación usando las credenciales del JSON
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_CLIENT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

// Instancia del cliente de Google Sheets
const sheets = google.sheets({ version: 'v4', auth });

export const googleSheetsService = {
  /**
   * Agrega una fila con los datos de solicitud Me Fía a Google Sheets
   * @param data Objeto con los datos del cliente provenientes del webhook
   */
  async appendMeFiaData(data: Record<string, any>) {
    try {
      if (!GOOGLE_SHEET_ID) {
        throw new Error("GOOGLE_SHEET_ID no está configurado en el archivo .env");
      }

      // Lógica sencilla para separar nombres y apellidos (requiere que el agente envíe Nombre completo)
      const partesNombre = (data.nombresApellidos || '').trim().split(' ');
      let primerNombre = '';
      let segundoNombre = '';
      let primerApellido = '';
      let segundoApellido = '';

      if (partesNombre.length === 1) {
        primerNombre = partesNombre[0];
      } else if (partesNombre.length === 2) {
        primerNombre = partesNombre[0];
        primerApellido = partesNombre[1];
      } else if (partesNombre.length === 3) {
        primerNombre = partesNombre[0];
        segundoNombre = partesNombre[1];
        primerApellido = partesNombre[2];
      } else if (partesNombre.length >= 4) {
        primerNombre = partesNombre[0];
        segundoNombre = partesNombre[1];
        primerApellido = partesNombre[2];
        segundoApellido = partesNombre.slice(3).join(' ');
      }

      // El orden debe coincidir exactamente con las columnas de tu Google Sheet (De A a X)
      const values = [
        [
          "", // A: Codigo Producto
          new Date().toLocaleDateString('es-CO'), // B: Fecha de Aprobacion
          "", // C: Fin Vigencia
          "", // D: Fecha Utilizacion Credito
          "Bienestar plus protegido", // E: Plan
          data.tipoIdentificacion || "", // F: Tipo Documento Identidad
          data.numeroIdentificacion || "", // G: Numero Documento
          primerApellido, // H: Primer Apellido
          segundoApellido, // I: Segundo Apellido
          primerNombre, // J: Primer Nombre
          segundoNombre, // K: Segundo Nombre
          data.sexo || "", // L: Genero
          data.estadoCivil || "", // M: Estado Civil 
          data.fechaNacimiento || "", // N: Fecha Nacimiento
          "", // O: (Espacio vacío que tenías en tu documento antes del teléfono)
          data.telefono || "", // P: Teléfono Celular
          data.direccionResidencia || "", // Q: Dirección
          "", // R: (Vacío)
          "", // S: (Vacío)
          "", // T: (Vacío)
          data.paisResidencia || "", // U: Nacionalidad
          data.lugarNacimiento || "", // V: Lugar de nacimiento
          data.ciudad || "", // W: Lugar de residencia (Ciudad)
          data.email || "" // X: Email
        ]
      ];

      // Se asume que la hoja de cálculo por defecto se llama "Hoja 1" o similar. 
      // Si la pestaña tiene otro nombre, se debe ajustar el 'range'
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'Producción!A:AN', // Rango aproximado 
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      console.log('Datos guardados exitosamente en Google Sheets:', response.data.updates?.updatedRange);
      return response.data;
    } catch (error) {
      console.error('Error al guardar datos en Google Sheets:', error);
      throw error; // Se relanza el error para que la herramienta principal lo maneje
    }
  }
};
