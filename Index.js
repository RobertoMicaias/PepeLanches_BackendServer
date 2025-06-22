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
app.post('/criar-intent-de-pagamento', async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'O valor (amount) é obrigatório.' });
        }

        const amountInCents = Math.round(Number(amount) * 100);

        // Cria a "Intenção de Pagamento" no Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'brl',
            automatic_payment_methods: { enabled: true }, // Stripe gerencia os métodos
        });

        // Envia de volta APENAS o "client_secret" para o frontend
        res.json({
            clientSecret: paymentIntent.client_secret,
        });

    } catch (error) {
        console.error('Erro ao criar PaymentIntent:', error);
        res.status(500).json({ error: error.message });
    }
});
app.post('/criar-checkout-session', async (req, res) => {
    try {
        const { amount, orderId } = req.body;
        const amountInCents = Math.round(Number(amount) * 100);

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: `Pedido #${orderId} - Pepê Lanches`,
                        },
                        unit_amount: amountInCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Defina URLs de redirecionamento (podem ser qualquer site para este teste)
            success_url: 'https://example.com/success',
            cancel_url: 'https://example.com/cancel',
        });

        // Retorna a URL da página de pagamento do Stripe
        res.json({ url: session.url });

    } catch (error) {
        console.error('Erro ao criar sessão de checkout:', error);
        res.status(500).json({ error: error.message });
    }
});


// 3. Inicia o servidor
app.listen(port, () => {
    console.log(`Backend Pepê Lanches (Stripe) rodando na porta ${port}`);
});