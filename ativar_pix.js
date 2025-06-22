// ativar_pix.js
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function ativarPix() {
    try {
        console.log('Buscando as informações da sua conta Stripe...');

        // Primeiro, buscamos o ID da sua conta principal.
        const account = await stripe.accounts.retrieve();
        console.log(`ID da Conta encontrado: ${account.id}`);

        console.log('Tentando solicitar a capacidade de pagamento com PIX...');

        // Agora, tentamos atualizar a conta para solicitar a capacidade 'pix_payments'
        const updatedAccount = await stripe.accounts.update(
            account.id,
            {
                capabilities: {
                    pix_payments: { requested: true },
                },
            }
        );

        console.log('--- Resposta da API ---');
        console.log('Status da capacidade PIX:', updatedAccount.capabilities.pix_payments);
        console.log('-------------------------');
        console.log("SUCESSO! Pedido de ativação enviado.");
        console.log("Verifique seu painel do Stripe novamente em Configurações > Meios de Pagamento para ver se o PIX apareceu para ser ativado.");

    } catch (error) {
        console.error('DEU RUIM! Erro ao tentar ativar a capacidade PIX:');
        console.error(`Mensagem: ${error.message}`);
        console.error("Isso provavelmente confirma que há uma restrição na sua conta que impede a ativação do PIX.");
    }
}

ativarPix();