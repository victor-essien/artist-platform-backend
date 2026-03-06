import { resolve } from 'node:dns';
import PDFDocument from 'pdfkit';
// import { QRCode } from 'qrcode';
import  QRCode  from 'qrcode';


export async function generateTicketPDF(ticket: any) {
    return new Promise<Buffer>(async (resolve) => {
        const doc = new PDFDocument();

        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData)
        })

        // Create the url for the qrcode using the ticketcode and frontend url
        const ticketVerificationUrl = `${process.env.FRONTEND_URL}/tickets/verify/${ticket.ticketCode}`
        
        // Create qrcode
    const qr = await QRCode.toDataURL(ticketVerificationUrl);

    doc.fontSize(20).text("Event Ticket", {align: "center"});

    doc.moveDown();
     const qrImage = qr.replace(/^data:image\/png;base64,/, "");

    doc.image(Buffer.from(qrImage, "base64"), {
      fit: [200, 200],
      align: "center",
    });

    doc.end();

    })
}