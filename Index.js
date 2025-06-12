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

app.post('/criar-cobranca-cartao', async (req, res) => {
    console.log('Recebida requisição para criar cobrança com Cartão de Teste...');

    const { amount, orderId, payerEmail } = req.body;

    // Este é um token de teste fornecido pela documentação do Mercado Pago
    // que representa um cartão Mastercard aprovado.
    const test_card_token = "ff8080814c11e237014c1ff593b57b4d";

    const paymentData = {
        transaction_amount: Number(amount),
        token: test_card_token, // <<< Usamos o token do cartão de teste aqui
        description: `Pedido com Cartão #${orderId} - Pepê Lanches`,
        installments: 1, // Número de parcelas
        payment_method_id: 'master', // ID do método de pagamento (mastercard)
        payer: {
            email: payerEmail || 'test_user_1694739413@testuser.com', // Seu comprador de teste
            // Para pagamentos com cartão, a identificação do payer é ainda mais importante
            identification: {
                type: 'CPF',
                number: '29167896006' // Use um CPF de teste válido
            }
        },
        external_reference: orderId,
    };

    try {
        const payment = new Payment(client);
        const result = await payment.create({ body: paymentData });

        console.log('Pagamento com cartão processado com sucesso!', result.body);

        // Retorna o resultado para o app
        res.json({
            status: result.body.status,
            status_detail: result.body.status_detail,
            id: result.body.id,
        });

    } catch (error) {
        console.error('Erro ao criar cobrança com cartão:', error?.cause ?? error);
        res.status(500).json({ error: 'Falha ao criar a cobrança com cartão.' });
    }
});

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
            email: 'test_user_1694739413@testuser.com',// Seu comprador de teste
            first_name:'Test',
            last_name:'Test',
            identification: {
                type: 'CPF',
                number: '29167896006' // Apenas os números, sem pontos ou traços
            }
        },

        external_reference: orderId,
        notification_url: 'https://pepe-lanches-backend-eehrcbd6f2dta2cw.brazilsouth-01.azurewebsites.net/webhook-mercadopago'
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