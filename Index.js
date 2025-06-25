require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripePackage = require('stripe');

// --- Bloco de Diagnóstico (pode manter ou remover) ---
console.log("--- INICIANDO SERVIDOR: DIAGNÓSTICO DE CHAVE STRIPE ---");
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey) {
    const maskedKey = `${stripeKey.substring(0, 8)}...${stripeKey.substring(stripeKey.length - 4)}`;
    console.log("STRIPE_SECRET_KEY encontrada. Usando chave que se parece com:", maskedKey);
} else {
    console.error("ERRO CRÍTICO: A variável de ambiente STRIPE_SECRET_KEY não foi encontrada!");
}
console.log("--- FIM DO BLOCO DE DIAGNÓSTICO ---");

const stripe = stripePackage(stripeKey);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Deixamos o webhook receber o corpo "bruto" da requisição para verificar a assinatura
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Chave secreta do Webhook

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log('--- Webhook do Stripe Verificado com Sucesso! ---');
    } catch (err) {
        console.error(`❌ Erro na verificação da assinatura do Webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Lida com o evento
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntentSucceeded = event.data.object;
            console.log(`✅ Pagamento ${paymentIntentSucceeded.id} foi bem-sucedido!`);
            // LÓGICA DE NEGÓCIO:
            // 1. Busque o pedido no seu banco de dados usando um ID salvo no paymentIntent (ex: metadata.orderId)
            // 2. Atualize o status do pedido para "PAGO".
            // 3. Envie uma notificação para o cliente ou para a cozinha.
            break;
        case 'payment_intent.payment_failed':
            const paymentIntentFailed = event.data.object;
            console.log(`❌ Pagamento ${paymentIntentFailed.id} falhou.`);
            // LÓGICA DE NEGÓCIO:
            // 1. Registre a falha no seu banco de dados.
            // 2. Envie um e-mail/notificação para o cliente informando da falha.
            break;
        default:
            console.log(`Evento não tratado do tipo ${event.type}`);
    }

    // Retorna uma resposta 200 para o Stripe para confirmar o recebimento
    res.json({ received: true });
});

// Agora o express.json() vem DEPOIS do webhook, para não afetar o corpo bruto dele
app.use(express.json());

// --- Suas rotas existentes ---
app.get('/', (req, res) => { /* ... */ });
app.post('/criar-intent-de-pagamento', async (req, res) => { /* ... */ });
app.post('/criar-checkout-session', async (req, res) => { /* ... */ });


app.listen(port, () => {
    console.log(`Backend Pepê Lanches (Stripe) rodando na porta ${port}`);
});