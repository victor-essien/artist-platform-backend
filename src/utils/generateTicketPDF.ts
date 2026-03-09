import PDFDocument from "pdfkit";
import QRCode from "qrcode";

interface TicketData {
  buyerName: string;
  eventName: string;
  eventDate: string;
  ticketCode: string;
  city: string;
//   ticketType: string;
  startTime: string;
}

export async function generateTicketPDF(ticket: TicketData): Promise<Buffer> {
  return new Promise(async (resolve) => {
    const doc = new PDFDocument({
      size: [600, 250],
      margin: 0
    });

    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));

    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    const qr = await QRCode.toDataURL(ticket.ticketCode);
    const qrImage = qr.replace(/^data:image\/png;base64,/, "");

    /** BACKGROUND */
    doc.rect(0, 0, 600, 250).fill("#f4f4f4");

    /** GOLD BANNER (simulate gradient) */
    doc
      .rect(0, 150, 350, 100)
      .fill("#D4A017"); // gold tone

    /** EVENT TITLE */
    doc
      .fillColor("#111")
      .fontSize(18)
      .text(ticket.eventName, 30, 30);

    /** EVENT LOCATION (optional text placeholder) */
    doc
      .fontSize(12)
      .fillColor("#555")
      .text(ticket.city, 30, 60);

    /** DATE */
    doc
      .fontSize(11)
      .fillColor("#333")
      .text("DATE", 30, 90)
      .fontSize(13)
      .text(ticket.eventDate, 30, 110);

    /** TIME placeholder */
    doc
      .fontSize(11)
      .fillColor("#333")
      .text("TIME", 120, 90)
      .fontSize(13)
      .text(ticket.startTime, 120, 110);

    /** BUYER NAME BANNER */
    doc
      .fillColor("#fff")
      .fontSize(22)
      .text(ticket.buyerName.toUpperCase(), 30, 175, {
        width: 300
      });

    /** DIVIDER */
    doc
      .moveTo(350, 0)
      .lineTo(350, 250)
      .dash(5, { space: 5 })
      .strokeColor("#999")
      .stroke();

    /** QR CODE */
    doc.image(Buffer.from(qrImage, "base64"), 400, 40, {
      width: 120
    });

   
    // /** TICKET TYPE */
    // doc
    //   .fillColor("#D4A017")
    //   .fontSize(16)
    //   .text("General Admission", 380, 170);

    /** TICKET CODE */
    // doc
    //   .fillColor("#555")
    //   .fontSize(11)
    //   .text(ticket.ticketCode, 400, 200);

    doc.end();
  });
}