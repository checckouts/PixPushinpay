const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '.')));

// Rota principal para carregar o seu checkout
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PUSHINPAY_API_URL = 'https://api.pushinpay.com.br/api';
const PUSHINPAY_API_KEY = process.env.PUSHINPAY_API_KEY;

// Rota para gerar o Pix (chamada pelo seu index.html )
app.post('/api/pix', async (req, res) => {
    try {
        const { payer_name, payer_cpf, payer_phone, amount } = req.body;

        if (!amount) {
            return res.status(400).json({ success: false, message: 'Campo obrigatório (amount) ausente.' });
        }

        const valueInCents = Math.round(parseFloat(amount.replace(',', '.')) * 100);
        
        // PushinPay requires value to be at least 50 cents
        if (valueInCents < 50) {
            return res.status(400).json({ success: false, message: 'O valor mínimo para PIX é de 50 centavos.' });
        }

        const payload = {
            value: valueInCents,
            // webhook_url: 'SUA_URL_DE_WEBHOOK_AQUI' // Opcional: Adicione se tiver um webhook
        };

        const response = await axios.post(`${PUSHINPAY_API_URL}/pix`, payload, {
            headers: {
                'Authorization': `Bearer ${PUSHINPAY_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (response.data && response.data.qr_code) {
            return res.json({
                success: true,
                pixCode: response.data.qr_code,
                correlationID: response.data.id // Usando o ID da PushinPay como correlationID
            });
        } else {
            throw new Error('Resposta inválida da PushinPay');
        }

    } catch (error) {
        console.error('Erro ao gerar PIX:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao processar o pagamento Pix.',
            error: error.response ? error.response.data : error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
