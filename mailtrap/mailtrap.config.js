/*import {MailtrapClient} from "mailtrap";*/
import dotenv from "dotenv";
import { Resend } from 'resend';

dotenv.config();


/*export const mailtrapClient = new MailtrapClient({
  endpoint: process.env.MAILTRAP_ENDPOINT, 
  token: process.env.MAILTRAP_TOKEN,
});*/

/*export const sender = {
  email: "hello@demomailtrap.co",
  name: "Tico",
};*/


export const resend = new Resend(process.env.RESEND_API_KEY);
export const sender = 'Tico <onboarding@resend.dev>';