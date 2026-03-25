import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

// @ts-ignore
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function inspect() {
    try {
         const sid = 'HX5755ee032cc78fab1940d6c71c3111a8';
         console.log(`Fetching Template ${sid}...`);
         // @ts-ignore
         const result = await client.content.v1.contents(sid).fetch();
         console.log(JSON.stringify(result, null, 2));
    } catch(e) { console.error(e); }
}
inspect();
