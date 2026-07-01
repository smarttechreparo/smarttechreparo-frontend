// URL da sua API gerada pelo Railway (mude para a URL de produção após o deploy)
const API_URL = 'http://localhost:3000/api';

async function enviarChecklist() {
    const formChecklist = document.getElementById('form-checklist');
    const fotoInput = document.getElementById('camera-input'); // <input type="file" accept="image/*" multiple>
    
    // Como vamos enviar ficheiros binários (fotos), precisamos usar obrigatoriamente o FormData
    const formData = new FormData();
    
    // Dados simulados do estado do dispositivo
    const checklistItems = {
        wifi: document.getElementById('chk-wifi').checked,
        touch: document.getElementById('chk-touch').checked,
        bateria: document.getElementById('chk-bateria').checked
    };

    // Adiciona os campos de texto comuns ao FormData
    formData.append('serviceId', document.getElementById('service-id').value);
    formData.append('type', 'entrada');
    formData.append('items', JSON.stringify(checklistItems)); // Convertemos o objeto em string para o Express ler
    formData.append('observations', document.getElementById('obs').value);

    // Adiciona os ficheiros de fotos selecionados ou tiradas na hora pelo telemóvel
    if (fotoInput.files.length > 0) {
        for (let i = 0; i < fotoInput.files.length; i++) {
            formData.append('photos', fotoInput.files[i]); // O nome 'photos' deve bater com o upload.array('photos') do Express
        }
    }

    try {
        document.getElementById('btn-salvar').innerText = 'A enviar...';
        
        // Faz a requisição HTTP real para o servidor do Railway
        const response = await fetch(`${API_URL}/checklist`, {
            method: 'POST',
            body: formData // Nota: Não adicione cabeçalho 'Content-Type', o navegador faz isso automaticamente para FormData
        });

        const resultado = await response.json();

        if (resultado.success) {
            alert('Checklist e fotos guardados com sucesso!');
            formChecklist.reset();
        } else {
            alert('Erro ao guardar: ' + resultado.error);
        }
    } catch (error) {
        console.error('Erro na ligação com o servidor:', error);
        alert('Não foi possível ligar ao servidor back-end.');
    } finally {
        document.getElementById('btn-salvar').innerText = 'Salvar Checklist';
    }
}