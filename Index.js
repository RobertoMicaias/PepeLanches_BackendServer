// index.js (VERSÃO DE TESTE COM A ROTA DE INTENT)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripePackage = require('stripe');

// Bloco de Diagnóstico (bom manter por enquanto)
console.log("--- INICIANDO SERVIDOR: DIAGNÓSTICO DE CHAVE STRIPE ---");
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey && stripeKey.startsWith('sk_test_')) {
    console.log("CHAVE STRIPE DE TESTE ENCONTRADA E VÁLIDA.");
} else {
    console.error("!!!!!!!! ERRO CRÍTICO: STRIPE_SECRET_KEY NÃO ENCONTRADA OU É INVÁLIDA !!!!!!!!");
}
const stripe = stripePackage(stripeKey);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('O SERVIDOR DO PEPÊ LANCHES ESTÁ NO AR! (v2)');
});

// <<< ADICIONANDO DE VOLTA A ROTA PRINCIPAL >>>
app.post('/criar-intent-de-pagamento', async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount) {
            return res.status(400).json({ error: 'O valor (amount) é obrigatório.' });
        }
        console.log(`Recebida requisição para criar PaymentIntent com valor: ${amount}`);

        const amountInCents = Math.round(Number(amount) * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'brl',
            automatic_payment_methods: { enabled: true },
        });

        console.log("PaymentIntent criado com sucesso no Stripe.");
        res.json({
            clientSecret: paymentIntent.client_secret,
        });

    } catch (error) {
        console.error('Erro DENTRO da rota /criar-intent-de-pagamento:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Backend Pepê Lanches (Stripe) rodando na porta ${port}`);
});