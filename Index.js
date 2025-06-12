require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/criar-cobranca-pix', async (req, res) => {
    console.log('Recebida requisição para criar cobrança PIX...');
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
        return res.status(400).json({ error: 'Valor (amount) e ID do pedido (orderId) são obrigatórios.' });
    }

    const paymentData = {
        transaction_amount: Number(amount),
        description: `Pedido #${orderId} - Pepê Lanches`,
        payment_method_id: 'pix',
        payer: {
            email: 'TESTUSER1493145163@testuser.com' // Seu comprador de teste
        },
        notification_url: 'https://pepe-lanches-backend-eehrcbd6f2dta2cw.brazilsouth-01.azurewebsites.net/webhook-mercadopago' // Exemplo com sua URL
    };

    try {
        const payment = new Payment(client);
        const result = await payment.create({ body: paymentData });
        const pixData = result.point_of_interaction.transaction_data;
        console.log(`Cobrança PIX criada com sucesso! ID do Pagamento: ${result.id}`);
        res.json({
            paymentId: result.id,
            qrCodeString: pixData.qr_code,
            qrCodeBase64: pixData.qr_code_base64,
        });
    } catch (error) {
        console.error('Erro ao criar cobrança PIX:', error?.cause ?? error);
        res.status(500).json({ error: 'Falha ao criar a cobrança PIX.' });
    }
});

app.post('/webhook-mercadopago', (req, res) => {
    console.log('--- Webhook do Mercado Pago Recebido! ---');
    console.log('Body:', req.body);
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Backend Pepê Lanches rodando na porta ${port}`);
});
