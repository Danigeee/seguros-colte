import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
if (!accountSid || !authToken) {
    console.warn("Advertencia: TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN no están definidos en las variables de entorno.");
}
const twilioClient = twilio(accountSid, authToken);
export default twilioClient;
