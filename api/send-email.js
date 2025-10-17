// /api/send-order-email.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée" });
  }

  try {
    const { clientEmail, clientName, orderId, products, total, address, city, phone } = req.body;

    if (!clientEmail || !clientName || !orderId) {
      return res.status(400).json({ success: false, message: "Données manquantes" });
    }

    const productsList = products
      .map(
        (p) => `<tr>
          <td style="padding:10px;border-bottom:1px solid #ddd;">${p.name}</td>
          <td style="padding:10px;border-bottom:1px solid #ddd;">${p.volume}</td>
          <td style="padding:10px;border-bottom:1px solid #ddd;text-align:center;">${p.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;">${p.price} DT</td>
          <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;">${(p.price*p.quantity).toFixed(3)} DT</td>
        </tr>`
      )
      .join("");

    const emailHTML = `<html><body>
      <h2>Commande #${orderId}</h2>
      <p>Bonjour ${clientName}, merci pour votre achat !</p>
      <table>${productsList}</table>
      <p>Total: ${total} DT</p>
      <p>Adresse: ${address}, ${city}</p>
      <p>Téléphone: ${phone}</p>
    </body></html>`;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"CM Store" <${process.env.EMAIL_USER}>`,
      to: clientEmail,
      subject: `Confirmation de commande #${orderId} - CM Store`,
      html: emailHTML,
    });

    res.status(200).json({ success: true, message: "Email envoyé avec succès", orderId });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
