export function ticketEmailTemplate(
buyerName: string,
eventName: string,
eventImage: string
) {
 return  `
  <div style="background:#0b0b0b;color:white;padding:20px;font-family:sans-serif">
  
  <h2>Thank you for your purchase! Your ticket(s) are ready.</h2>

  <p>Hello ${buyerName},</p>

  <img 
    src="${eventImage}" 
    style="width:100%;border-radius:10px"
  />

  <h3>${eventName}</h3>

  <p>Your ticket PDF is attached to this email.</p>

  <p>Please bring the QR code to the event.</p>

  </div>
  `;
}