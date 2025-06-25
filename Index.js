require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripePackage = require('stripe');

console.log("--- INICIANDO SERVIDOR: DIAGNÓSTICO DE CHAVE STRIPE ---");

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (stripeKey) {

    const maskedKey = `${stripeKey.substring(0, 8)}...${stripeKey.substring(stripeKey.length - 4)}`;

    console.log("Variável STRIPE_SECRET_KEY encontrada. Usando chave que se parece com:", maskedKey);

} else {

    console.error("!!!!!!!! ERRO CRÍTICO: A variável de ambiente STRIPE_SECRET_KEY não foi encontrada (está undefined)! !!!!!!!!");

}

console.log("--- FIM DO BLOCO DE DIAGNÓSTICO ---");



const stripe = stripePackage(stripeKey);



const app = express();

const port = process.env.PORT || 3000;



app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {

    res.send('Servidor do Pepê Lanches com Stripe está no ar!');

});


app.post('/criar-intent-cartao', async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'O valor (amount) é obrigatório.' });
        }

        const amountInCents = Math.round(Number(amount) * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'brl',
            payment_method_types: ['card'], // <- AQUI está o segredo
        });

        res.json({ clientSecret: paymentIntent.client_secret });

    } catch (error) {
        console.error('Erro ao criar PaymentIntent para cartão:', error);
        res.status(500).json({ success: false, error: error.message });
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

            success_url: 'https://example.com/success',

            cancel_url: 'https://example.com/cancel',

        });



        res.json({ url: session.url });

    } catch (error) {

        console.error('Erro ao criar sessão de checkout:', error);

        res.status(500).json({ success: false, error: error.message });

    }

});
app.post('/criar-intent-pix', async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'O valor (amount) é obrigatório.' });
        }

        const amountInCents = Math.round(Number(amount) * 100);

        // Cria a PaymentIntent com suporte explícito ao PIX
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'brl',
            payment_method_types: ['pix'],
        });

        // Recupera a intent expandindo o QR Code
        const retrievedIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, {
            expand: ['next_action.pix_display_qr_code'],
        });

        const qrCodeData = retrievedIntent?.next_action?.pix_display_qr_code?.data;

        if (!qrCodeData) {
            return res.status(500).json({ error: 'Não foi possível gerar o QR Code do PIX.' });
        }

        res.json({
            clientSecret: retrievedIntent.client_secret,
            qrCodeData,
        });

    } catch (error) {
        console.error('Erro ao criar PaymentIntent PIX:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
app.post('/criar-intent-googlepay', async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'O valor (amount) é obrigatório.' });
        }

        const amountInCents = Math.round(Number(amount) * 100);

        // Modificação importante para Google Pay via WebView:
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'brl',
            payment_method_types: ['card', 'google_pay'], // Habilita explicitamente
            capture_method: 'automatic' // Importante para fluxo WebView
        });

        // Retorna tanto o client_secret quanto a URL formatada pronta para WebView
        res.json({
            clientSecret: paymentIntent.client_secret,
            checkoutUrl: `https://checkout.stripe.com/pay/${paymentIntent.client_secret}?payment_method_types=google_pay`
        });

    } catch (error) {
        console.error('Erro ao criar PaymentIntent para Google Pay:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});





app.listen(port, () => {

    console.log(`Backend Pepê Lanches (Stripe) rodando na porta ${port}`);

});