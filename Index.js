// index.js (Versão com Stripe e Diagnóstico)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Vamos importar as ferramentas do Stripe, mas inicializar depois do nosso teste.
const { MercadoPagoConfig, Payment } = require('mercadopago'); // Pode remover se não for usar mais
const stripePackage = require('stripe');

// --- INÍCIO DO BLOCO DE DIAGNÓSTICO ---
console.log("--- INICIANDO SERVIDOR: DIAGNÓSTICO DE CHAVE STRIPE ---");
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (stripeKey) {
    // Mostra apenas os primeiros 8 e os últimos 4 caracteres para segurança
    const maskedKey = `${stripeKey.substring(0, 8)}...${stripeKey.substring(stripeKey.length - 4)}`;
    console.log("Variável STRIPE_SECRET_KEY encontrada. Usando chave que se parece com:", maskedKey);
} else {
    // Este erro é CRÍTICO. Se ele aparecer no log da Azure, o problema é 100% a variável de ambiente.
    console.error("!!!!!!!! ERRO CRÍTICO: A variável de ambiente STRIPE_SECRET_KEY não foi encontrada (está undefined)! !!!!!!!!");
}
console.log("--- FIM DO BLOCO DE DIAGNÓSTICO ---");
// --- FIM DO BLOCO DE DIAGNÓSTICO ---


// Inicializa o Stripe com a chave que acabamos de verificar
const stripe = stripePackage(stripeKey);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de teste para saber se o servidor está no ar
app.get('/', (req, res) => {
    res.send('Servidor do Pepê Lanches com Stripe está no ar!');
});

// Rota para criar uma "Intenção de Pagamento" (usada pelo app)
app.post('/criar-intent-de-pagamento', async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount) {
            return res.status(400).json({ error: 'O valor (amount) é obrigatório.' });
        }
        const amountInCents = Math.round(Number(amount) * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'brl',
            automatic_payment_methods: { enabled: true },
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Erro ao criar PaymentIntent:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota para criar uma "Sessão de Checkout" (usada para o teste do link)
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
            success_url: 'https://example.com/success',
            cancel_url: 'https://example.com/cancel',
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Erro ao criar sessão de checkout:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// Inicia o servidor
app.listen(port, () => {
    console.log(`Backend Pepê Lanches (Stripe) rodando na porta ${port}`);
});