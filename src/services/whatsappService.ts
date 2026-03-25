import twilioClient from '../config/twilioConfig.js';

const defaultFrom = "whatsapp:+5742044840";
//const defaultFrom = "whatsapp:+14155238886";

const client = twilioClient;

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
