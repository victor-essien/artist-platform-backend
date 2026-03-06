import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTicketEmail({
email,
subject,
html,
attachments,

}: {
email:string;
subject: string;
html: string,
attachments: { filename: string; content: Buffer }[];

}) {
 await resend.emails.send({
    from: `${process.env.EMAIL_FROM}`,
    to: email,
    subject,
    html,
    attachments
 })
}