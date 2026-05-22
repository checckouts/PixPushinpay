const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));

const PUSHINPAY_API_URL = 'https://api.pushinpay.com.br/api/pix/cash-in';
const PUSHINPAY_TOKEN = process.env.PUSHINPAY_TOKEN;

app.post('/api/pix', async (req, res) => {
    try {
        const { amount, payer_name, payer_cpf, payer_phone } = req.body;

        // Validar campos básicos
        if (!amount || !payer_name || !payer_cpf) {
            return res.status(400).json({ success: false, message: 'Campos obrigatórios ausentes.' });
        }

        // O valor na documentação deve ser em centavos
        const valueInCents = Math.round(parseFloat(amount) * 100);

        const response = await axios.post(PUSHINPAY_API_URL, {
            value: valueInCents,
            // Opcional: webhook_url: process.env.WEBHOOK_URL
        }, {
            headers: {
                'Authorization': `Bearer ${PUSHINPAY_TOKEN}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.qr_code) {
            return res.json({
                success: true,
                pixCode: response.data.qr_code,
                qrCodeBase64: response.data.qr_code_base64,
                paymentId: response.data.id
            });
        } else {
            throw new Error('Resposta inválida da API PushinPay');
        }

    } catch (error) {
        console.error('Erro ao criar PIX:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao processar pagamento PIX.',
            details: error.response ? error.response.data : error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
