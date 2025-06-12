// index.js (Versão Corrigida)

// 1. Importa os pacotes que instalamos
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// MUDANÇA AQUI: Importamos MercadoPagoConfig e Payment do SDK
const { MercadoPagoConfig, Payment } = require('mercadopago');

// 2. Configura o CLIENTE do Mercado Pago com sua chave secreta
// MUDANÇA AQUI: Criamos um 'client' em vez de usar 'configure'
const client = new MercadoPagoConfig({
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

// 3. Inicializa o servidor Express
const app = express();
const port = process.env.PORT || 3000;

// 4. Configura middlewares do Express
app.use(cors());
app.use(express.json());

// 5. Define a rota principal para criar a cobrança PIX
app.post('/criar-cobranca-pix', async (req, res) => {
    console.log('Recebida requisição para criar cobrança PIX...');

    const { amount, orderId, payerEmail } = req.body; // Adicionei payerEmail

    if (!amount || !orderId) {
        return res.status(400).json({ error: 'Valor (amount) e ID do pedido (orderId) são obrigatórios.' });
    }

    const paymentData = {
        transaction_amount: Number(amount), // Garante que é um número
        description: `Pedido #${orderId} - Pepê Lanches`,
        payment_method_id: 'pix',
        payer: {
            email: payerEmail || 'TESTUSER1493145163@testuser.com', // Usa o email do app ou um padrão
        },
        notification_url: 'https://SEU-DOMINIO.com/webhook-mercadopago' // URL para receber notificação de pagamento
    };

    try {
        // MUDANÇA AQUI: Criamos uma instância de Payment e chamamos o método create
        const payment = new Payment(client);
        const result = await payment.create({ body: paymentData });

        const pixData = result.point_of_interaction.transaction_data;

        console.log(`Cobrança PIX criada com sucesso! ID do Pagamento: ${result.id}`);

        // Retorna os dados do PIX para o seu aplicativo React Native
        res.json({
            paymentId: result.id,
            qrCodeString: pixData.qr_code, // O "Copia e Cola"
            qrCodeBase64: pixData.qr_code_base64, // A imagem do QR Code
        });

    } catch (error) {
        console.error('Erro ao criar cobrança PIX:', error);
        res.status(500).json({ error: 'Falha ao criar a cobrança PIX.' });
    }
});

// 6. Inicia o servidor
app.listen(port, () => {
    console.log(`Backend Pepê Lanches rodando em http://localhost:${port}`);
});