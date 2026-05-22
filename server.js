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

// Serve arquivos estáticos
app.use(express.static(__dirname));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// CONFIGURAÇÃO PUSHINPAY
const PUSHINPAY_API_KEY = '66692|76q48PnH6a7BtX4oxARcWgCWu3QSl149j7qUIc0xf271f2ab';

// Rota para gerar o Pix
app.post('/api/pix', async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ success: false, message: 'Campo obrigatório (amount) ausente.' });
        }

        const valueInCents = Math.round(parseFloat(amount.replace(',', '.')) * 100);
        
        if (valueInCents < 50) {
            return res.status(400).json({ success: false, message: 'O valor mínimo para PIX é de 50 centavos.' });
        }

        const payload = {
            value: valueInCents
        };

        console.log('Enviando requisição para PushinPay com payload:', payload);

        // De acordo com a documentação, o endpoint correto para criar PIX é POST /api/pix
        // O erro "The route api/pix could not be found" sugere que a URL base pode estar errada ou o prefixo duplicado.
        // Vamos tentar a URL de produção exata.
        const response = await axios.post('https://api.pushinpay.com.br/api/pix', payload, {
            headers: {
                'Authorization': `Bearer ${PUSHINPAY_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('Resposta da PushinPay:', response.data);

        if (response.data && response.data.qr_code) {
            return res.json({
                success: true,
                pixCode: response.data.qr_code,
                correlationID: response.data.id
            });
        } else {
            throw new Error('Resposta inválida da PushinPay: qr_code não encontrado');
        }

    } catch (error) {
        // Log extremamente detalhado para entender o que está acontecendo
        const errorData = error.response ? error.response.data : error.message;
        const errorStatus = error.response ? error.response.status : 'N/A';
        
        console.error(`ERRO PUSHINPAY [Status ${errorStatus}]:`, JSON.stringify(errorData));
        
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao processar o pagamento Pix.',
            error: errorData
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
