// Copie le contenu de server.js mais modifie la dernière partie:

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

// Servir les fichiers statiques
app.use(express.static('public'));

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Route POST pour envoyer l'email
app.post('/api/send-order-email', async (req, res) => {
    try {
        const { 
            clientEmail, 
            clientName, 
            orderId, 
            products, 
            total, 
            address, 
            city, 
            phone 
        } = req.body;

        if (!clientEmail || !clientName || !orderId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Données manquantes' 
            });
        }

        const productsList = products
            .map(p => `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${p.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${p.volume}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${p.quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${p.price} DT</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${(p.price * p.quantity).toFixed(3)} DT</td>
                </tr>
            `)
            .join('');

        const emailHTML = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #d4a5a5; padding-bottom: 20px; }
                    .header h1 { color: #c48b8b; margin: 0; }
                    .order-id { background: #fef9f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4a5a5; }
                    .order-id p { margin: 5px 0; font-size: 14px; }
                    .order-id .id { font-size: 18px; font-weight: bold; color: #c48b8b; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #f0ddd6; color: #c48b8b; padding: 12px; text-align: left; font-weight: bold; }
                    .total-row { background: #fef9f5; font-weight: bold; color: #c48b8b; }
                    .total-row td { padding: 12px; border-top: 2px solid #d4a5a5; }
                    .delivery-info { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .delivery-info h3 { color: #c48b8b; margin-top: 0; }
                    .delivery-info p { margin: 8px 0; font-size: 14px; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✨ CM STORE</h1>
                        <p style="color: #999; margin: 0;">Confirmation de Commande</p>
                    </div>
                    <p>Bonjour <strong>${clientName}</strong>,</p>
                    <p>Merci pour votre achat! Votre commande a été confirmée et est en cours de traitement.</p>
                    <div class="order-id">
                        <p>📦 Numéro de commande:</p>
                        <p class="id">#${orderId}</p>
                        <p>Vous serez recontacté très bientôt sur le numéro: <strong>${phone}</strong></p>
                    </div>
                    <h3 style="color: #c48b8b;">📋 Récapitulatif de votre commande:</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Volume</th>
                                <th>Qté</th>
                                <th>Prix</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productsList}
                            <tr class="total-row">
                                <td colspan="4" style="text-align: right;">Total:</td>
                                <td style="text-align: right;">${total} DT</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="delivery-info">
                        <h3>📍 Informations de Livraison</h3>
                        <p><strong>Adresse:</strong> ${address}</p>
                        <p><strong>Ville:</strong> ${city}</p>
                        <p><strong>Téléphone:</strong> ${phone}</p>
                    </div>
                    <div style="background: #f0ddd6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #c48b8b; font-weight: bold;">⏱️ Notre équipe vous recontactera dans les 24-48 heures.</p>
                    </div>
                    <div class="footer">
                        <p>CM STORE - Boutique de Cosmétiques Premium</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"CM Store" <${process.env.EMAIL_USER}>`,
            to: clientEmail,
            subject: `Confirmation de votre commande #${orderId} - CM Store`,
            html: emailHTML
        };

        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            message: 'Email envoyé avec succès',
            orderId: orderId
        });

    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur: ' + error.message
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Pour développement local uniquement
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ Serveur sur http://localhost:${PORT}`);
    });
}

module.exports = app;