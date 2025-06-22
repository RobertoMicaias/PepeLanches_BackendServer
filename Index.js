// index.js (Versão com Stripe)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
// 1. Importa e inicializa o Stripe com a chave secreta
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de teste para saber se o servidor está no ar
app.get('/', (req, res) => {
    res.send('Servidor do Pepê Lanches com Stripe está no ar!');
});

// 2. Nova rota para criar um pagamento com Stripe
app.post('/criar-pagamento-stripe', async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        if (!amount || !orderId) {
            return res.status(400).json({ error: 'Valor (amount) e ID do pedido (orderId) são obrigatórios.' });
        }

        console.log(`Recebida requisição para criar pagamento de R$${amount} para o pedido ${orderId}`);

        // IMPORTANTE: A API do Stripe trabalha com os menores valores da moeda (centavos).
        // Precisamos converter R$ 10.50 para 1050.
        const amountInCents = Math.round(Number(amount) * 100);

        // Cria uma "Intenção de Pagamento"
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'brl', // Moeda: Real Brasileiro
            payment_method: 'pm_card_visa', // Um ID de método de pagamento de teste para um cartão Visa que sempre aprova
            confirm: true, // Tenta confirmar o pagamento imediatamente
            description: `Pedido #${orderId} - Pepê Lanches`,
            automatic_payment_methods: { // Necessário para a confirmação
                enabled: true,
                allow_redirects: 'never'
            },
        });

        console.log('PaymentIntent criado com sucesso:', paymentIntent.id);

        // Retorna uma resposta de sucesso para o app
        res.json({
            success: true,
            paymentId: paymentIntent.id,
            status: paymentIntent.status // Deve ser "succeeded"
        });

    } catch (error) {
        console.error('Erro ao criar pagamento no Stripe:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// 3. Inicia o servidor
app.listen(port, () => {
    console.log(`Backend Pepê Lanches (Stripe) rodando na porta ${port}`);
});