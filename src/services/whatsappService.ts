import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const defaultFrom = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';

const client = twilio(accountSid, authToken);

export const whatsappService = {
  async sendMessage(to: string, body: string, mediaUrl?: string) {
    try {
      const fromNumber = defaultFrom?.startsWith('whatsapp:') ? defaultFrom : `whatsapp:${defaultFrom}`;
      const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      console.log(`Sending WhatsApp to ${toNumber} from ${fromNumber}`);

      const messageOptions: any = {
        from: fromNumber,
        to: toNumber,
        body: body
      };

      if (mediaUrl) {
        messageOptions.mediaUrl = [mediaUrl];
      }

      const message = await client.messages.create(messageOptions);
      
      console.log(`WhatsApp sent. SID: ${message.sid}`);
      return message;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }
};
