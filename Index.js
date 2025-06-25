// index.js (VERSÃO DE TESTE MÍNIMA)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripePackage = require('stripe');

console.log("--- INICIANDO TESTE DE INICIALIZAÇÃO v3 ---");

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey && stripeKey.startsWith('sk_test_')) {
    console.log("CHAVE STRIPE DE TESTE ENCONTRADA E VÁLIDA.");
} else {
    console.error("!!!!!!!! ERRO CRÍTICO: STRIPE_SECRET_KEY NÃO FOI ENCONTRADA OU É INVÁLIDA !!!!!!!!");
}

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

app.get('/', (req, res) => {
    res.send('O SERVIDOR MÍNIMO DO PEPÊ LANCHES ESTÁ NO AR!');
});

app.listen(port, () => {
    console.log(`SERVIDOR MÍNIMO RODANDO NA PORTA ${port}`);
});