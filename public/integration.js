// Este arquivo substitui a lógica de busca do PIX para apontar para o nosso backend
// Sem alterar o index.html original, apenas carregando este script depois.

(function() {
    console.log("Integração PushinPay carregada.");

    // Sobrescrever a função fetchPixCode que existe no index.html
    window.fetchPixCode = async function(payerName, cpf, phone) {
        try {
            // subtotalValue é uma variável global definida no index.html original
            const amount = window.subtotalValue || 0;
            
            const response = await fetch('/api/pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payer_name: payerName,
                    payer_cpf: cpf,
                    payer_phone: phone,
                    amount: amount
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                // O checkout original espera o código PIX (copia e cola)
                return data.pixCode;
            } else {
                console.error("Erro na API:", data.message);
                return null;
            }
        } catch (err) {
            console.error("Erro na requisição:", err);
            return null;
        }
    };
})();
