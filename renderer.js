// Adicione esta linha no topo do seu arquivo renderer.js
const API_URL = 'https://smarttechreparo-backend-production.up.railway.app/api';
// ============ VARIÁVEIS GLOBAIS ==========
let currentSale = { items: [], clientId: null, total: 0, discount: 0, subtotal: 0, labor: 0 };
let currentServiceParts = [];
let systemSettings = {};
let lastSaleNumber = 0;
let lastServiceNumber = 0;

// Cache de dados
const dataCache = new Map();

// Variáveis de pagamento
let currentPaymentMode = 'vista';
let currentPaymentMethod = 'dinheiro';
let currentInstallments = 1;
let currentFinancedMethod = 'credito_prazo';

// Configurações de desconto
const discountConfig = { pix: 7, debito: 5, credito_vista: 5, dinheiro: 0, credito_prazo: 0, boleto: 0 };
let autoDiscountEnabled = false;

// Variáveis de Compra (NFe)
let currentPurchaseItems = [];

// Variáveis Financeiras
let financialOverviewChart = null;
let expensesCategoryChart = null;

// Flag para evitar duplicação de vendas
window.isProcessingSale = false;

// ============ MÁSCARAS DE INPUT ==========
function formatarCNPJ() {
    const inputs = document.querySelectorAll('#supplier-document, #client-document');
    inputs.forEach(input => {
        if (!input) return;
        
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        newInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 14) value = value.slice(0, 14);
            
            if (value.length <= 11) {
                // Formatar como CPF: 000.000.000-00
                if (value.length > 9) {
                    value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
                } else if (value.length > 6) {
                    value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
                } else if (value.length > 3) {
                    value = value.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
                }
            } else {
                // Formatar como CNPJ: 00.000.000/0000-00
                if (value.length > 12) {
                    value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
                } else if (value.length > 8) {
                    value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})$/, '$1.$2.$3/$4');
                } else if (value.length > 5) {
                    value = value.replace(/^(\d{2})(\d{3})(\d{1,3})$/, '$1.$2.$3');
                } else if (value.length > 2) {
                    value = value.replace(/^(\d{2})(\d{1,3})$/, '$1.$2');
                }
            }
            
            e.target.value = value;
        });
    });
    console.log('✅ Máscara CPF/CNPJ aplicada (detecção automática)');
}

function formatarTelefone() {
    const inputs = document.querySelectorAll('#client-phone, #supplier-phone');
    inputs.forEach(input => {
        if (!input) return;
        
        // Remover listener antigo
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        newInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            // Limita a 11 dígitos
            if (value.length > 11) value = value.slice(0, 11);
            
            // Aplica a máscara (XX) XXXXX-XXXX
            if (value.length === 0) {
                e.target.value = '';
            } else if (value.length <= 2) {
                e.target.value = `(${value}`;
            } else if (value.length <= 7) {
                e.target.value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
            } else {
                e.target.value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
            }
        });
        
        // Se já tem valor, formata
        if (newInput.value) {
            let value = newInput.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            // Dispara evento para aplicar máscara
            const event = new Event('input', { bubbles: true });
            newInput.dispatchEvent(event);
        }
    });
    console.log('✅ Máscara Telefone aplicada - Formato (XX) XXXXX-XXXX');
}

function formatarCEP() {
    const input = document.getElementById('client-cep');
    if (!input) return;
    
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    
    newInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        if (value.length > 5) {
            value = value.replace(/^(\d{5})(\d{3})$/, '$1-$2');
        }
        e.target.value = value;
    });
    console.log('✅ Máscara CEP aplicada');
}

// ============ FUNÇÃO AUXILIAR PARA FORMATAR TELEFONE ==========
function formatarTelefoneAPI(numero) {
    if (!numero) return '';
    
    // Remove tudo que não for dígito
    let num = numero.toString().replace(/\D/g, '');
    
    console.log('🔢 Formatando telefone:', numero, '-> apenas dígitos:', num);
    
    // Se tiver código do país (55), remove
    if (num.startsWith('55') && num.length > 11) {
        num = num.substring(2);
    }
    
    // Se o número começar com 0, remove
    if (num.startsWith('0') && num.length > 10) {
        num = num.substring(1);
    }
    
    // Limita a 11 dígitos (DDD + 9 dígitos para celular)
    if (num.length > 11) {
        num = num.substring(0, 11);
    }
    
    // Formata conforme o tamanho
    if (num.length === 11) {
        // Celular com 9 dígitos: (XX) XXXXX-XXXX
        const formatado = `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`;
        console.log('📞 Formatado (11 dígitos):', formatado);
        return formatado;
    } else if (num.length === 10) {
        // Telefone fixo: (XX) XXXX-XXXX
        const formatado = `(${num.substring(0, 2)}) ${num.substring(2, 6)}-${num.substring(6)}`;
        console.log('📞 Formatado (10 dígitos):', formatado);
        return formatado;
    } else if (num.length >= 8) {
        // Retorna só o número se não tiver DDD
        console.log('📞 Retornando sem DDD:', num);
        return num;
    }
    
    console.log('📞 Número muito curto, retornando original:', numero);
    return numero;
}
 
// Função para extrair telefone de vários campos possíveis
function extrairTelefone(data) {
    console.log('🔍 Extraindo telefone dos dados:', JSON.stringify(data));
    
    // Lista de campos possíveis onde o telefone pode estar (em ordem de prioridade)
    const possiveisCampos = [
        // Telefone completo
        data.telefone1,
        data.telefone_1,
        data.telefone,
        data.telefone_principal,
        data.contato_telefone,
        // Combinações de DDD + número
        data.ddd_telefone_1 && data.telefone_1 ? `${data.ddd_telefone_1}${data.telefone_1}` : null,
        data.ddd1 && data.telefone1 ? `${data.ddd1}${data.telefone1}` : null,
        // Fax como último recurso
        data.ddd_fax && data.fax ? `${data.ddd_fax}${data.fax}` : null
    ];
    
    console.log('📋 Campos de telefone encontrados:', possiveisCampos.filter(c => c));
    
    // Procura o primeiro telefone válido (pelo menos 10 dígitos)
    for (const campo of possiveisCampos) {
        if (campo) {
            const digitos = campo.toString().replace(/\D/g, '');
            console.log(`  Verificando: "${campo}" -> ${digitos.length} dígitos`);
            
            // Aceita números com 10 ou 11 dígitos (fixo ou celular)
            if (digitos.length >= 10 && digitos.length <= 11) {
                const formatado = formatarTelefoneAPI(campo);
                console.log('✅ Telefone encontrado e formatado:', formatado);
                return formatado;
            }
        }
    }
    
    console.log('❌ Nenhum telefone válido encontrado');
    return '';
}

// ============ BUSCA DE CNPJ ==========
async function buscarCNPJ() {
    console.log('🔍 Configurando busca de CNPJ...');
    
    setTimeout(() => {
        const cnpjInput = document.getElementById('supplier-document');
        if (!cnpjInput) {
            console.warn('⚠️ Campo supplier-document não encontrado');
            return;
        }
        
        // Verificar se o botão já existe
        const existingBtn = document.getElementById('btn-buscar-cnpj');
        if (existingBtn) {
            console.log('✅ Botão de busca CNPJ já existe');
            return;
        }
        
        // Criar botão de busca
        const searchBtn = document.createElement('button');
        searchBtn.type = 'button';
        searchBtn.id = 'btn-buscar-cnpj';
        searchBtn.className = 'btn-secondary';
        searchBtn.innerHTML = '<i class="fas fa-search"></i> Buscar CNPJ';
        searchBtn.style.cssText = `
            margin-left: 10px;
            padding: 8px 15px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 13px;
        `;
        
        searchBtn.onmouseover = () => searchBtn.style.background = '#0056b3';
        searchBtn.onmouseout = () => searchBtn.style.background = '#007bff';
        
        cnpjInput.parentNode.appendChild(searchBtn);
        
        searchBtn.addEventListener('click', async () => {
            await executarBuscaCNPJ();
        });
        
        cnpjInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await executarBuscaCNPJ();
            }
        });
        
        console.log('✅ Botão de busca CNPJ configurado');
    }, 500);
}

async function executarBuscaCNPJ() {
    const cnpjInput = document.getElementById('supplier-document');
    if (!cnpjInput) {
        showNotification('Campo CNPJ não encontrado', 'error');
        return;
    }
    
    let cnpj = cnpjInput.value.replace(/\D/g, '');
    
    if (!cnpj) {
        showNotification('Digite um CNPJ para buscar', 'warning');
        return;
    }
    
    if (cnpj.length !== 14) {
        showNotification('CNPJ deve ter 14 dígitos', 'warning');
        return;
    }
    
    console.log('🔍 Buscando CNPJ:', cnpj);
    
    const searchBtn = document.getElementById('btn-buscar-cnpj');
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
    }
    
    showNotification('🔍 Buscando CNPJ...', 'info');
    
    const apis = [
        {
            name: 'Brasil API',
            url: `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
            parser: (data) => ({
                name: data.razao_social || data.nome_fantasia || '',
                fantasy: data.nome_fantasia || '',
                email: data.email || '',
                phone: extrairTelefone({
                    telefone_1: data.telefone_1,
                    telefone1: data.telefone1,
                    ddd_telefone_1: data.ddd_telefone_1,
                    ddd_fax: data.ddd_fax,
                    fax: data.fax
                }),
                address: data.logradouro ? `${data.logradouro}, ${data.numero || 'S/N'}`.trim() : '',
                complement: data.complemento || '',
                district: data.bairro || '',
                cep: data.cep || '',
                city: data.municipio || '',
                state: data.uf || '',
                cnae: data.cnae_fiscal_descricao || '',
                opening: data.data_inicio_atividade || ''
            })
        },
        {
            name: 'ReceitaWS',
            url: `https://receitaws.com.br/v1/cnpj/${cnpj}`,
            parser: (data) => ({
                name: data.nome || data.fantasia || '',
                fantasy: data.fantasia || '',
                email: data.email || '',
                phone: extrairTelefone({
                    telefone: data.telefone,
                    telefone1: data.telefone1,
                    ddd_telefone_1: data.ddd_telefone_1,
                    ddd_fax: data.ddd_fax,
                    fax: data.fax
                }),
                address: data.logradouro ? `${data.logradouro}, ${data.numero || 'S/N'}`.trim() : '',
                complement: data.complemento || '',
                district: data.bairro || '',
                cep: data.cep || '',
                city: data.municipio || '',
                state: data.uf || '',
                cnae: data.atividade_principal?.[0]?.text || '',
                opening: data.abertura || ''
            })
        },
        {
            name: 'CNPJ.ws',
            url: `https://api.cnpj.ws/v1/cnpj/${cnpj}`,
            parser: (data) => {
                const estabelecimento = data.estabelecimento || {};
                return {
                    name: data.razao_social || estabelecimento.nome_fantasia || '',
                    fantasy: data.nome_fantasia || estabelecimento.nome_fantasia || '',
                    email: data.email || estabelecimento.email || '',
                    phone: extrairTelefone({
                        telefone1: data.telefone1 || estabelecimento.telefone1,
                        telefone_1: data.telefone_1 || estabelecimento.telefone_1,
                        telefone: data.telefone,
                        ddd_telefone_1: data.ddd_telefone_1 || estabelecimento.ddd1,
                        ddd_fax: data.ddd_fax,
                        fax: data.fax
                    }),
                    address: estabelecimento.logradouro ? 
                        `${estabelecimento.logradouro}, ${estabelecimento.numero || 'S/N'}`.trim() : 
                        (data.logradouro ? `${data.logradouro}, ${data.numero || 'S/N'}`.trim() : ''),
                    complement: data.complemento || estabelecimento.complemento || '',
                    district: data.bairro || estabelecimento.bairro || '',
                    cep: data.cep || estabelecimento.cep || '',
                    city: data.municipio || estabelecimento.cidade?.nome || '',
                    state: data.uf || estabelecimento.estado?.sigla || '',
                    cnae: '',
                    opening: data.abertura || data.data_inicio_atividade || estabelecimento.data_inicio_atividade || ''
                };
            }
        }
    ];
    
    let encontrou = false;
    
    for (const api of apis) {
        try {
            console.log(`🔍 Tentando ${api.name}...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(api.url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.warn(`⚠️ ${api.name} retornou status ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            console.log(`📦 Dados brutos ${api.name}:`, data);
            
            if (data.status === 'ERROR' || data.message || data.error) {
                console.warn(`⚠️ ${api.name} retornou erro:`, data.message || data.error);
                continue;
            }
            
            const companyData = api.parser(data);
            
            if (!companyData.name) {
                console.warn(`⚠️ ${api.name} não retornou nome da empresa`);
                continue;
            }
            
            console.log(`✅ Dados encontrados via ${api.name}:`, companyData);
            
            // Preencher os campos do formulário
            document.getElementById('supplier-name').value = companyData.name || '';
            document.getElementById('supplier-contact').value = companyData.fantasy || companyData.name || '';
            document.getElementById('supplier-email').value = companyData.email || '';
            
            // CORREÇÃO: Telefone - definir valor puro e aplicar máscara
            const telefoneFormatado = companyData.phone || '';
            console.log('📞 Telefone recebido da API:', telefoneFormatado);
            
            const phoneInput = document.getElementById('supplier-phone');
            if (phoneInput) {
                if (telefoneFormatado) {
                    // Pega apenas os dígitos
                    const digitos = telefoneFormatado.replace(/\D/g, '');
                    console.log('📞 Dígitos puros:', digitos);
                    
                    // Define o valor com dígitos puros
                    phoneInput.value = digitos;
                    
                    // Dispara o evento input para a máscara formatar
                    const event = new Event('input', { 
                        bubbles: true, 
                        cancelable: true 
                    });
                    phoneInput.dispatchEvent(event);
                    
                    console.log('📞 Telefone após máscara:', phoneInput.value);
                } else {
                    phoneInput.value = '';
                }
            }
            
            document.getElementById('supplier-address').value = companyData.address || '';
            document.getElementById('supplier-city').value = companyData.city || '';
            document.getElementById('supplier-state').value = companyData.state || '';
            
            // Preencher observações com CNAE e data de abertura
            const notesField = document.getElementById('supplier-notes');
            if (notesField) {
                let notes = notesField.value || '';
                if (companyData.cnae) {
                    notes += (notes ? '\n' : '') + `CNAE: ${companyData.cnae}`;
                }
                if (companyData.opening) {
                    notes += (notes ? '\n' : '') + `Abertura: ${companyData.opening}`;
                }
                notesField.value = notes;
            }
            
            showNotification(`✅ CNPJ encontrado via ${api.name}! Dados preenchidos.`, 'success');
            encontrou = true;
            break;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`⚠️ Timeout na ${api.name}`);
            } else {
                console.warn(`⚠️ Erro na ${api.name}:`, error.message);
            }
            continue;
        }
    }
    
    // Reabilitar botão
    if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<i class="fas fa-search"></i> Buscar CNPJ';
    }
    
    if (!encontrou) {
        showNotification('❌ CNPJ não encontrado em nenhuma base. Verifique o número.', 'error');
        
        // Perguntar se deseja buscar manualmente
        setTimeout(() => {
            const manualSearch = confirm(
                'CNPJ não encontrado nas bases online.\n\n' +
                'Deseja abrir o site da Receita Federal para consulta manual?\n\n' +
                'Depois você pode preencher os dados manualmente.'
            );
            
            if (manualSearch) {
                window.open(`https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp?cnpj=${cnpj}`, '_blank');
            }
        }, 500);
    }
}

// ============ API FALLBACK (LocalStorage) ==========
(function setupAPI() {
    if (!window.electronAPI) {
        console.warn('⚠️ electronAPI não encontrada, criando fallback com localStorage');
        window.electronAPI = {};
    }
    
    const memoryDB = {
        purchases: [],
        expenses: [],
        
        init() {
            try {
                const savedPurchases = localStorage.getItem('smarttech_purchases');
                const savedExpenses = localStorage.getItem('smarttech_expenses');
                if (savedPurchases) this.purchases = JSON.parse(savedPurchases);
                if (savedExpenses) this.expenses = JSON.parse(savedExpenses);
                console.log('📦 StorageDB (fallback) inicializado');
            } catch (e) {
                console.error('Erro ao carregar localStorage:', e);
                this.purchases = [];
                this.expenses = [];
            }
        },
        
        savePurchases() {
            try {
                localStorage.setItem('smarttech_purchases', JSON.stringify(this.purchases));
            } catch (e) {
                console.error('Erro ao salvar compras:', e);
            }
        },
        
        saveExpenses() {
            try {
                localStorage.setItem('smarttech_expenses', JSON.stringify(this.expenses));
            } catch (e) {
                console.error('Erro ao salvar despesas:', e);
            }
        }
    };
    
    memoryDB.init();
    
    if (!window.electronAPI.getPurchases) {
        window.electronAPI.getPurchases = async () => memoryDB.purchases;
    }
    
    if (!window.electronAPI.savePurchase) {
        window.electronAPI.savePurchase = async (purchase) => {
            try {
                if (!purchase.id) {
                    purchase.id = 'purchase_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                }
                purchase.createdAt = purchase.createdAt || new Date().toISOString();
                purchase.updatedAt = new Date().toISOString();
                
                const index = memoryDB.purchases.findIndex(p => p.id === purchase.id);
                if (index >= 0) {
                    memoryDB.purchases[index] = purchase;
                } else {
                    memoryDB.purchases.push(purchase);
                }
                memoryDB.savePurchases();
                return { success: true, data: purchase };
            } catch (error) {
                return { success: false, error: error.message };
            }
        };
    }
    
    if (!window.electronAPI.deletePurchase) {
        window.electronAPI.deletePurchase = async (id) => {
            try {
                memoryDB.purchases = memoryDB.purchases.filter(p => p.id !== id);
                memoryDB.savePurchases();
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        };
    }
    
    if (!window.electronAPI.getExpenses) {
        window.electronAPI.getExpenses = async () => memoryDB.expenses;
    }
    
    if (!window.electronAPI.saveExpense) {
        window.electronAPI.saveExpense = async (expense) => {
            try {
                if (!expense.id) {
                    expense.id = 'expense_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                }
                expense.createdAt = expense.createdAt || new Date().toISOString();
                expense.updatedAt = new Date().toISOString();
                
                const index = memoryDB.expenses.findIndex(e => e.id === expense.id);
                if (index >= 0) {
                    memoryDB.expenses[index] = expense;
                } else {
                    memoryDB.expenses.push(expense);
                }
                memoryDB.saveExpenses();
                return { success: true, data: expense };
            } catch (error) {
                return { success: false, error: error.message };
            }
        };
    }
    
    if (!window.electronAPI.deleteExpense) {
        window.electronAPI.deleteExpense = async (id) => {
            try {
                memoryDB.expenses = memoryDB.expenses.filter(e => e.id !== id);
                memoryDB.saveExpenses();
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        };
    }
    
    if (!window.electronAPI.registerStockMovement) {
        window.electronAPI.registerStockMovement = async (movement) => {
            console.log('📦 registerStockMovement (fallback):', movement);
            return { success: true };
        };
    }
    
    console.log('✅ API configurada com sucesso!');
})();

// ============ FUNÇÕES AUXILIARES ==========
function escapeHtml(str) { 
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'); 
}

function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const div = document.createElement('div');
    div.className = `notification notification-${type}`;
    div.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

function confirmAction(message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '10000';
    
    const modalHtml = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h3><i class="fas fa-exclamation-triangle" style="color:#ffc107;"></i> Confirmar</h3>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="text-align:center; margin-bottom:20px;">${message}</p>
            </div>
            <div class="modal-footer" style="justify-content:center;">
                <button class="btn-secondary" id="cancelConfirmBtn">Cancelar</button>
                <button class="btn-danger" id="confirmActionBtn">Confirmar</button>
            </div>
        </div>
    `;
    
    overlay.innerHTML = modalHtml;
    document.body.appendChild(overlay);
    
    overlay.querySelector('#cancelConfirmBtn').onclick = () => overlay.remove();
    overlay.querySelector('#confirmActionBtn').onclick = () => {
        overlay.remove();
        if (typeof callback === 'function') callback();
    };
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function showGenericModal(title, bodyHtml, buttons = []) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `<div class="modal-header"><h3>${title}</h3><button class="close-modal" onclick="this.closest('.modal-overlay').remove()">&times;</button></div><div class="modal-body">${bodyHtml}</div><div class="modal-footer"></div>`;
    const footer = content.querySelector('.modal-footer');
    if (buttons.length === 0) {
        buttons = [{ label: 'Fechar', className: 'btn-secondary', onClick: () => closeModal() }];
    }
    buttons.forEach(btn => {
        const b = document.createElement('button');
        b.className = btn.className || 'btn-secondary';
        b.innerHTML = btn.label;
        b.onclick = () => { if (btn.onClick) btn.onClick(); };
        footer.appendChild(b);
    });
    overlay.appendChild(content);
    document.body.appendChild(overlay);
}

function closeModal() { 
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
}

function updateClock() {
    const now = new Date();
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('pt-BR');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('pt-BR');
}

function updateSystemStatus() {
    const statusEl = document.getElementById('system-status');
    const memEl = document.getElementById('memory-usage');
    const sysDateEl = document.getElementById('system-date');
    const memFooter = document.getElementById('memory-footer');
    
    if (statusEl) statusEl.textContent = 'Online';
    if (sysDateEl) sysDateEl.textContent = new Date().toLocaleDateString('pt-BR');
    
    const memUsage = Math.round(Math.random() * 50 + 50);
    if (memEl) memEl.textContent = memUsage + ' MB';
    if (memFooter) memFooter.textContent = `Memória: ${memUsage} MB`;
    
    const storageUsage = document.getElementById('storage-usage');
    if (storageUsage) {
        storageUsage.textContent = `Armazenamento: ${Math.round(Math.random() * 10 + 5)} MB`;
    }
}

function getServiceStatusName(status) {
    const s = { 
        orcamento:'Orçamento', 
        em_andamento:'Em Andamento', 
        aguardando_peca:'Aguardando Peça', 
        finalizado:'Finalizado', 
        entregue:'Entregue', 
        cancelado:'Cancelado', 
        convertido:'Convertido'
    };
    return s[status] || status;
}

// ============ CACHE DE DADOS ==========
async function getCachedData(key, fetchFunction) {
    if (dataCache.has(key)) {
        const { data, timestamp } = dataCache.get(key);
        if (Date.now() - timestamp < 300000) {
            return data;
        }
    }
    const data = await fetchFunction();
    dataCache.set(key, { data, timestamp: Date.now() });
    return data;
}

// ============ INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Iniciando Smart Tech Reparo...');
        
        formatarCNPJ();
        formatarTelefone();
        formatarCEP();
        buscarCNPJ();
        
        await loadSettings();
        updateClock();
        setInterval(updateClock, 1000);
        updateSystemStatus();
        showTab('dashboard');
        setupEventListeners();
        setupKeyboardShortcuts();
        setupAutoBackup();
        await loadDashboard();
        await checkPendingPayments();
        showNotification('Sistema conectado e pronto!', 'success');
        
        console.log('✅ Sistema inicializado com sucesso!');
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showNotification('Erro ao iniciar o sistema', 'error');
    }
});

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            showTab('sales');
            startNewSale();
        }
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const activeTab = document.querySelector('.tab-content.active')?.id;
            const searchMap = {
                'clients': 'client-search',
                'suppliers': 'supplier-search',
                'parts': 'part-search',
                'sales-history': 'sales-history-search',
                'services': 'service-search',
                'purchases': 'purchase-search',
                'financial': 'expense-search'
            };
            const searchId = searchMap[activeTab];
            if (searchId) {
                const searchInput = document.getElementById(searchId);
                if (searchInput) {
                    searchInput.focus();
                    showNotification(`Buscando em ${activeTab}...`, 'info');
                }
            }
        }
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            showTab('dashboard');
        }
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    console.log('✅ Atalhos de teclado configurados');
}

function setupAutoBackup() {
    setInterval(async () => {
        try {
            if (window.electronAPI.backupDatabase) {
                await window.electronAPI.backupDatabase();
                console.log('💾 Backup automático realizado em:', new Date().toLocaleString());
            }
        } catch (error) {
            console.error('Erro no backup automático:', error);
        }
    }, 3600000);
}

async function checkPendingPayments() {
    try {
        const sales = await window.electronAPI.getSales();
        const pending = sales.filter(s => s.paymentStatus === 'pending');
        const overdue = pending.filter(s => {
            const dueDate = new Date(s.date);
            dueDate.setDate(dueDate.getDate() + (systemSettings.dueDays || 30));
            return dueDate < new Date();
        });
        
        if (overdue.length > 0) {
            showNotification(`⚠️ Existem ${overdue.length} pagamentos atrasados!`, 'warning');
        }
    } catch (error) {
        console.error('Erro ao verificar pagamentos:', error);
    }
}

function setupEventListeners() {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', (e) => showTab(e.target.closest('.tab-button').dataset.tab));
    });

    const formConfigs = [
        { id: 'client-form', handler: saveClient },
        { id: 'supplier-form', handler: saveSupplier },
        { id: 'part-form', handler: savePart },
        { id: 'service-form', handler: saveService },
        { id: 'sale-form', handler: finalizeSale },
        { id: 'stock-form', handler: saveStockMovement },
        { id: 'settings-form', handler: saveSettings },
        { id: 'password-form', handler: changePassword }
    ];
    
    formConfigs.forEach(config => {
        const form = document.getElementById(config.id);
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await config.handler(e);
                return false;
            });
        }
    });

    const searchConfigs = [
        { id: 'purchase-search', handler: (val) => loadPurchasesTable(val) },
        { id: 'expense-search', handler: (val) => loadExpensesTable(val) },
        { id: 'client-search', handler: (val) => loadClients(val) },
        { id: 'supplier-search', handler: (val) => loadSuppliers(val) },
        { id: 'part-search', handler: (val) => loadParts(val) },
        { id: 'service-search', handler: (val) => loadServices(val) },
        { id: 'sales-history-search', handler: (val) => loadSales(val) }
    ];
    
    searchConfigs.forEach(config => {
        const el = document.getElementById(config.id);
        if (el) {
            el.removeEventListener('input', (e) => config.handler(e.target.value));
            el.addEventListener('input', (e) => config.handler(e.target.value));
        }
    });

    const cepInput = document.getElementById('client-cep');
    if (cepInput) {
        cepInput.addEventListener('blur', async function(e) {
            const cep = e.target.value.replace(/\D/g, '');
            if (cep.length === 8) {
                try {
                    showNotification('Buscando CEP...', 'info');
                    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await response.json();
                    if (!data.erro) {
                        document.getElementById('client-address').value = data.logradouro || '';
                        document.getElementById('client-district').value = data.bairro || '';
                        document.getElementById('client-city').value = data.localidade || '';
                        document.getElementById('client-state').value = data.uf || '';
                        showNotification('CEP preenchido automaticamente!', 'success');
                    } else {
                        showNotification('CEP não encontrado', 'warning');
                    }
                } catch (error) {
                    console.error('Erro ao buscar CEP:', error);
                    showNotification('Erro ao buscar CEP', 'error');
                }
            }
        });
    }

    const salePart = document.getElementById('sale-part');
    const saleQty = document.getElementById('sale-quantity');
    const salePrice = document.getElementById('sale-price');
    const saleLabor = document.getElementById('sale-labor');
    
    if (salePart) salePart.addEventListener('change', updateSalePartPrice);
    if (saleQty) saleQty.addEventListener('input', updateSaleItem);
    if (salePrice) salePrice.addEventListener('input', updateSaleItem);
    if (saleLabor) saleLabor.addEventListener('input', updateSaleTotal);
    
    const servicePart = document.getElementById('service-part');
    const serviceQty = document.getElementById('service-part-quantity');
    const servicePrice = document.getElementById('service-part-price');
    const serviceValue = document.getElementById('service-value');
    
    if (servicePart) servicePart.addEventListener('change', updateServicePartPrice);
    if (serviceQty) serviceQty.addEventListener('input', updateServicePartSubtotal);
    if (servicePrice) servicePrice.addEventListener('input', updateServicePartSubtotal);
    if (serviceValue) serviceValue.addEventListener('input', recalcServiceTotal);

    const purchaseItemQty = document.getElementById('purchase-item-qty');
    const purchaseItemPrice = document.getElementById('purchase-item-price');
    const purchaseItemIpi = document.getElementById('purchase-item-ipi');
    const purchaseItemBonus = document.getElementById('purchase-item-bonus');
    
    if (purchaseItemQty) purchaseItemQty.addEventListener('input', () => calculatePurchaseTotals());
    if (purchaseItemPrice) purchaseItemPrice.addEventListener('input', () => calculatePurchaseTotals());
    if (purchaseItemIpi) purchaseItemIpi.addEventListener('input', () => calculatePurchaseTotals());
    if (purchaseItemBonus) {
        purchaseItemBonus.addEventListener('change', function() {
            const priceInput = document.getElementById('purchase-item-price');
            if (priceInput) {
                if (this.checked) {
                    priceInput.value = '0.00';
                    priceInput.readOnly = true;
                } else {
                    priceInput.readOnly = false;
                }
            }
            calculatePurchaseTotals();
        });
    }
    
    ['purchase-freight', 'purchase-insurance', 'purchase-discount', 'purchase-other-expenses'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculatePurchaseTotals);
    });

    console.log('✅ Event listeners configurados');
}

function showTab(tabId) {
    console.log('Mudando para aba:', tabId);
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.display = 'block';
    }
    
    const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    setTimeout(async () => {
        if (tabId === 'dashboard') await loadDashboard();
        else if (tabId === 'clients') { await loadClients(); hideClientForm(); }
        else if (tabId === 'suppliers') { await loadSuppliers(); hideSupplierForm(); }
        else if (tabId === 'parts') { await loadParts(); hidePartForm(); }
        else if (tabId === 'stock') await loadStock();
        else if (tabId === 'sales') { 
            await loadSales(); 
            await loadSaleClients(); 
            await loadSaleParts(); 
        }
        else if (tabId === 'services') { await loadServices(); hideServiceForm(); }
        else if (tabId === 'sales-history') await loadSales('');
        else if (tabId === 'settings') await loadSettings();
        else if (tabId === 'purchases') { await loadPurchases(); }
        else if (tabId === 'financial') { await loadFinancialData(); }
    }, 50);
}

// ============ DASHBOARD ==========
async function loadDashboard() {
    try {
        const stats = await window.electronAPI.getStats();
        document.getElementById('total-clients').textContent = stats.totalClients || 0;
        document.getElementById('total-suppliers').textContent = stats.totalSuppliers || 0;
        document.getElementById('total-parts').textContent = stats.totalParts || 0;
        document.getElementById('low-stock').textContent = stats.lowStock || 0;
        document.getElementById('today-sales').textContent = stats.todaySales || 0;
        document.getElementById('revenue-today').textContent = `R$ ${(stats.revenueToday || 0).toFixed(2)}`;
        document.getElementById('pending-services').textContent = stats.pendingServices || 0;
        document.getElementById('overdue-payments').textContent = stats.overduePayments || 0;
        await loadRecentActivity();
        console.log('✅ Dashboard carregado');
    } catch (error) { 
        console.error('Erro ao carregar dashboard:', error); 
    }
}

async function loadRecentActivity() {
    try {
        const history = await window.electronAPI.getHistory();
        const clients = await window.electronAPI.getClients();
        const suppliers = await window.electronAPI.getSuppliers();
        
        const list = document.getElementById('activity-list');
        if (!list) return;
        
        if (!history || !history.length) { 
            list.innerHTML = '<div class="no-activity">Nenhuma atividade recente</div>'; 
            return; 
        }
        
        list.innerHTML = history.slice(-20).reverse().map(item => {
            const time = item.date ? new Date(item.date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit'}) : '--:--';
            const icon = item.type === 'entrada' ? '📥' : 
                        item.type === 'saida' ? '📤' : 
                        item.type === 'venda' ? '💰' : 
                        item.type === 'pagamento' ? '💳' : '📋';
            
            // 🔧 CORREÇÃO: Usar snake_case (client_id, supplier_id)
            let personName = 'Sistema';
            
            if (item.client_id) {
                const client = clients.find(c => c.id === item.client_id);
                if (client) personName = client.name;
            } else if (item.supplier_id) {
                const supplier = suppliers.find(s => s.id === item.supplier_id);
                if (supplier) personName = supplier.name;
            }
            
            const descricao = item.reason || `${icon} ${item.quantity || 1}x ${item.part_name || 'Item'} (${personName})`;
            
            return `
                <div class="activity-item">
                    <div class="activity-time">${time}</div>
                    <div class="activity-desc">${descricao}</div>
                </div>
            `;
        }).join('');
        
    } catch (error) { 
        console.error('Erro ao carregar atividades:', error); 
    }
}

// ============ CONFIGURAÇÕES ==========
async function loadSettings() {
    try {
        const sets = await window.electronAPI.getSettings();
        systemSettings = sets || {};
        document.getElementById('company-name').value = sets.companyName || 'Smart Tech Reparo';
        document.getElementById('pix-discount').value = sets.pixDiscount || 7;
        document.getElementById('debit-discount').value = sets.debitDiscount || 5;
        document.getElementById('credit-increase').value = sets.creditIncrease || 0;
        document.getElementById('due-days').value = sets.dueDays || 30;
        document.getElementById('interest-after4').value = sets.interestAfter4Percent || 2;
        
        discountConfig.pix = sets.pixDiscount || 7;
        discountConfig.debito = sets.debitDiscount || 5;
        discountConfig.credito_vista = sets.debitDiscount || 5;
        
        console.log('✅ Configurações carregadas');
    } catch (error) { 
        console.error('Erro ao carregar configurações:', error); 
    }
}

async function saveSettings(e) {
    e.preventDefault();
    const data = {
        companyName: document.getElementById('company-name').value,
        pixDiscount: parseFloat(document.getElementById('pix-discount').value) || 0,
        debitDiscount: parseFloat(document.getElementById('debit-discount').value) || 0,
        creditIncrease: parseFloat(document.getElementById('credit-increase').value) || 0,
        dueDays: parseInt(document.getElementById('due-days').value) || 30,
        interestAfter4Percent: parseFloat(document.getElementById('interest-after4').value) || 0
    };
    try {
        const result = await window.electronAPI.saveSettings(data);
        if (result.success) { 
            showNotification('Configurações salvas!', 'success'); 
            systemSettings = data;
            discountConfig.pix = data.pixDiscount;
            discountConfig.debito = data.debitDiscount;
            discountConfig.credito_vista = data.debitDiscount;
        } else { 
            showNotification('Erro ao salvar', 'error'); 
        }
    } catch (error) { 
        console.error(error); 
        showNotification('Erro ao salvar', 'error'); 
    }
}

async function changePassword(e) {
    e.preventDefault();
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    
    if (!current || !newPass || !confirm) {
        showNotification('Preencha todos os campos', 'warning');
        return;
    }
    if (newPass !== confirm) {
        showNotification('As senhas não coincidem', 'error');
        return;
    }
    
    try {
        const storedPass = await window.electronAPI.getPassword();
        if (current !== storedPass) {
            showNotification('Senha atual incorreta', 'error');
            return;
        }
        await window.electronAPI.updatePassword(newPass);
        showNotification('Senha alterada com sucesso!', 'success');
        document.getElementById('password-form').reset();
    } catch (error) {
        showNotification('Erro ao alterar senha', 'error');
    }
}

async function backupDatabase() {
    try {
        showNotification('Realizando backup...', 'info');
        const result = await window.electronAPI.backupDatabase();
        if (result.success) showNotification('Backup realizado com sucesso!', 'success');
        else showNotification('Erro ao fazer backup', 'error');
    } catch (e) { 
        showNotification('Erro ao fazer backup', 'error'); 
    }
}

async function restoreDatabase() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const result = await window.electronAPI.restoreDatabase(data);
            if (result.success) {
                showNotification('Banco restaurado! Reiniciando...', 'success');
                dataCache.clear();
                setTimeout(() => location.reload(), 2000);
            } else {
                showNotification('Erro ao restaurar', 'error');
            }
        } catch (error) {
            showNotification('Arquivo inválido', 'error');
        }
    };
    input.click();
}

async function resetDatabase() {
    confirmAction('⚠️ ATENÇÃO! Isso apagará TODOS os dados do sistema. Tem certeza?', () => {
        confirmAction('⚠️ CONFIRMAÇÃO FINAL: Todos os dados serão perdidos!', async () => {
            try {
                showNotification('Resetando banco de dados...', 'info');
                const result = await window.electronAPI.resetDatabase();
                if (result.success) {
                    showNotification('Banco de dados resetado! Reiniciando...', 'success');
                    dataCache.clear();
                    setTimeout(() => location.reload(), 2000);
                } else {
                    showNotification('Erro ao resetar', 'error');
                }
            } catch (e) { 
                console.error(e);
                showNotification('Erro ao resetar', 'error'); 
            }
        });
    });
}

// ============ EXPORTAÇÃO ==========
function exportToExcel(data, filename) {
    const csv = data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showNotification(`${filename} exportado com sucesso!`, 'success');
}

async function exportClients() {
    const clients = await window.electronAPI.getClients();
    const data = clients.map(c => [
        c.name || '', c.phone || '', c.email || '', c.document || '', 
        c.city || '', c.state || '', 
        c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
    ]);
    data.unshift(['Nome', 'Telefone', 'Email', 'CPF/CNPJ', 'Cidade', 'Estado', 'Cadastro']);
    exportToExcel(data, 'clientes');
}

async function exportSales() {
    const sales = await window.electronAPI.getSales();
    const clients = await window.electronAPI.getClients();
    const data = sales.map(s => {
        const client = clients.find(c => c.id === s.clientId);
        return [
            s.saleNumber || '-', 
            s.date ? new Date(s.date).toLocaleDateString() : '-', 
            client?.name || '-',
            s.items?.length || 0, 
            (s.total || 0).toFixed(2), 
            s.paymentDescription || '-', 
            s.paymentStatus || '-'
        ];
    });
    data.unshift(['Nº Venda', 'Data', 'Cliente', 'Itens', 'Total', 'Pagamento', 'Status']);
    exportToExcel(data, 'vendas');
}

// ============ PAGAMENTOS ==========
function toggleAutoDiscount() {
    autoDiscountEnabled = document.getElementById('apply-auto-discount')?.checked || false;
    updateSaleTotal();
    const infoDiv = document.getElementById('discount-info');
    if (infoDiv) {
        infoDiv.style.background = autoDiscountEnabled ? '#c8e6c9' : '#e8f5e9';
        infoDiv.innerHTML = autoDiscountEnabled ? 
            'Desconto automático ATIVADO! PIX: 7% | Débito: 5% | Crédito à vista: 5%' : 
            'PIX: 7% | Débito: 5% | Crédito à vista: 5%';
    }
}

function updatePaymentUI() {
    document.querySelectorAll('.pay-mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.pay-mode-btn[data-mode="${currentPaymentMode}"]`)?.classList.add('active');
    
    const vistaPanel = document.getElementById('vista-panel');
    if (vistaPanel) vistaPanel.style.display = currentPaymentMode === 'vista' ? 'block' : 'none';
    
    const prazoPanel = document.getElementById('prazo-panel');
    if (prazoPanel) prazoPanel.style.display = currentPaymentMode === 'prazo' ? 'block' : 'none';
    
    updateInterestDisplay();
}

function setPaymentMode(mode) { 
    currentPaymentMode = mode; 
    updatePaymentUI(); 
    updateSaleTotal(); 
}

function setVistaMethod(method) { 
    currentPaymentMethod = method; 
    document.querySelectorAll('[data-vista-method]').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-vista-method="${method}"]`)?.classList.add('active');
    updateSaleTotal(); 
}

function setFinancedMethod(method) { 
    currentFinancedMethod = method; 
    document.querySelectorAll('[data-fin-method]').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`[data-fin-method="${method}"]`).forEach(el => el.classList.add('active'));
    updateSaleTotal(); 
}

function updateInstallments() { 
    const select = document.getElementById('installments-select');
    if (select) currentInstallments = parseInt(select.value) || 1;
    updateInterestDisplay(); 
    updateSaleTotal(); 
}

function updateInterestDisplay() {
    const interestRate = systemSettings?.interestAfter4Percent || 2;
    const extra = Math.max(0, currentInstallments - 4);
    const span = document.getElementById('interest-display');
    if (span) {
        if (currentFinancedMethod === 'credito_prazo') {
            span.innerHTML = ' (sem juros - operadora do cartão)';
        } else if (extra > 0) {
            span.innerHTML = ` (+${extra * interestRate}% juros)`;
        } else {
            span.innerHTML = ' (sem juros)';
        }
    }
}

// ============ CLIENTES ==========
async function loadClients(search = '') {
    try {
        const clients = await getCachedData('clients', () => window.electronAPI.getClients());
        const tbody = document.querySelector('#clients-table tbody');
        if (!tbody) return;
        const filtered = search ? clients.filter(c => 
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search) ||
            c.email?.toLowerCase().includes(search.toLowerCase()) ||
            c.document?.includes(search.replace(/\D/g, ''))
        ) : clients;
        
        if (!filtered.length) { 
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">Nenhum cliente cadastrado</td></tr>'; 
            return; 
        }
        
        tbody.innerHTML = filtered.map(c => {
            let docFormatted = '';
            let docType = '';
            
            if (c.document) {
                const docNumbers = c.document.replace(/\D/g, '');
                
                if (docNumbers.length === 11) {
                    docFormatted = docNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                    docType = 'CPF';
                } else if (docNumbers.length === 14) {
                    docFormatted = docNumbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                    docType = 'CNPJ';
                } else {
                    docFormatted = c.document;
                    docType = 'Doc';
                }
            } else {
                docFormatted = '-';
                docType = '';
            }
            
            const name = escapeHtml(c.name || '');
            const phone = escapeHtml(c.phone || '');
            const email = escapeHtml(c.email || '');
            const city = escapeHtml(c.city || '-');
            
            const dateValue = c.createdAt || c.created_at;
            const date = dateValue ? new Date(dateValue).toLocaleDateString('pt-BR') : '-';
            
            return `
            <tr>
                <td>
                    <div style="font-weight: 500;">${name}</div>
                    ${docFormatted !== '-' ? `<div style="font-size: 11px; color: #6c757d;">${docType}: ${escapeHtml(docFormatted)}</div>` : ''}
                </td>
                <td>${phone}</td>
                <td>${email}</td>
                <td>${city}</td>
                <td>${date}</td>
                <td class="actions">
                    <button class="btn-view" onclick="viewClient('${c.id}')" title="Visualizar cliente"><i class="fas fa-eye"></i></button>
                    <button class="btn-edit" onclick="editClient('${c.id}')" title="Editar cliente"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteClient('${c.id}')" title="Excluir cliente"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) { 
        console.error('Erro ao carregar clientes:', error); 
        showNotification('Erro ao carregar clientes', 'error');
    }
}

async function viewClient(id) {
    try {
        const clients = await window.electronAPI.getClients();
        const c = clients.find(x => x.id === id);
        if (!c) { showNotification('Cliente não encontrado', 'error'); return; }
        
        let docDisplay = c.document || '-';
        if (docDisplay && docDisplay.length === 11) {
            docDisplay = docDisplay.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (docDisplay && docDisplay.length === 14) {
            docDisplay = docDisplay.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        
        const docLabel = (c.document || '').length === 11 ? 'CPF' : 
                        (c.document || '').length === 14 ? 'CNPJ' : 'CPF/CNPJ';
        
        const body = `<div style="line-height:2;">
            <strong>Nome:</strong> ${escapeHtml(c.name)}<br>
            <strong>Telefone:</strong> ${escapeHtml(c.phone)}<br>
            <strong>Email:</strong> ${escapeHtml(c.email || '-')}<br>
            <strong>${docLabel}:</strong> ${escapeHtml(docDisplay)}<br>
            <strong>Endereço:</strong> ${escapeHtml(c.address || '')}, ${escapeHtml(c.number || '')} ${escapeHtml(c.complement || '')}<br>
            <strong>Bairro:</strong> ${escapeHtml(c.district || '-')}<br>
            <strong>Cidade/UF:</strong> ${escapeHtml(c.city || '-')}/${escapeHtml(c.state || '-')}<br>
            <strong>CEP:</strong> ${escapeHtml(c.cep || '-')}
        </div>`;
        
        showGenericModal('Detalhes do Cliente', body, [
            { label: 'Fechar', className: 'btn-secondary', onClick: () => closeModal() }
        ]);
    } catch (e) { console.error(e); }
}

async function saveClient(e) {
    e.preventDefault();
    const data = {
        id: document.getElementById('client-id').value || null,
        name: document.getElementById('client-name').value,
        phone: document.getElementById('client-phone').value,
        email: document.getElementById('client-email').value,
        document: document.getElementById('client-document').value,
        cep: document.getElementById('client-cep').value,
        address: document.getElementById('client-address').value,
        number: document.getElementById('client-number').value,
        complement: document.getElementById('client-complement').value,
        district: document.getElementById('client-district').value,
        city: document.getElementById('client-city').value,
        state: document.getElementById('client-state').value
    };
    if (!data.name || !data.phone) { 
        showNotification('Nome e Telefone são obrigatórios', 'error'); 
        return; 
    }
    try {
        const result = await window.electronAPI.saveClient(data);
        if (result.success) {
            showNotification('Cliente salvo com sucesso!', 'success');
            hideClientForm();
            document.getElementById('client-form').reset();
            dataCache.delete('clients');
            await loadClients();
            await loadDashboard();
        } else { 
            showNotification('Erro ao salvar cliente', 'error'); 
        }
    } catch (error) { 
        console.error(error); 
        showNotification('Erro ao salvar cliente', 'error'); 
    }
}

function showClientForm(id = null) {
    const fc = document.getElementById('client-form-container');
    if (!fc) return;
    fc.classList.remove('hidden');
    if (id) {
        window.electronAPI.getClients().then(clients => {
            const c = clients.find(x => x.id === id);
            if (c) {
                document.getElementById('client-id').value = c.id;
                document.getElementById('client-name').value = c.name || '';
                document.getElementById('client-phone').value = c.phone || '';
                document.getElementById('client-email').value = c.email || '';
                document.getElementById('client-document').value = c.document || '';
                document.getElementById('client-cep').value = c.cep || '';
                document.getElementById('client-address').value = c.address || '';
                document.getElementById('client-number').value = c.number || '';
                document.getElementById('client-complement').value = c.complement || '';
                document.getElementById('client-district').value = c.district || '';
                document.getElementById('client-city').value = c.city || '';
                document.getElementById('client-state').value = c.state || '';
            }
        });
    } else { 
        document.getElementById('client-form').reset(); 
        document.getElementById('client-id').value = ''; 
    }
}

function hideClientForm() { 
    document.getElementById('client-form-container')?.classList.add('hidden'); 
}

function editClient(id) { 
    showClientForm(id); 
}

async function deleteClient(id) {
    confirmAction('Tem certeza que deseja excluir este cliente?', async () => {
        try {
            const result = await window.electronAPI.deleteClient(id);
            if (result.success) { 
                showNotification('Cliente excluído com sucesso!', 'success'); 
                dataCache.delete('clients');
                await loadClients(); 
                await loadDashboard(); 
            } else { 
                showNotification('Erro ao excluir cliente', 'error'); 
            }
        } catch (error) { 
            console.error(error); 
            showNotification('Erro ao excluir cliente', 'error'); 
        }
    });
}

// ============ FORNECEDORES ==========
async function loadSuppliers(search = '') {
    try {
        console.log('📋 Carregando fornecedores...');
        const suppliers = await getCachedData('suppliers', () => window.electronAPI.getSuppliers());
        console.log('✅ Fornecedores carregados:', suppliers.length);
        
        const tbody = document.getElementById('suppliers-table-body');
        if (!tbody) {
            console.error('❌ Tbody de fornecedores não encontrado');
            return;
        }
        
        const filtered = search ? suppliers.filter(s => s.name?.toLowerCase().includes(search.toLowerCase())) : suppliers;
        if (!filtered.length) { 
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhum fornecedor cadastrado</td></tr>'; 
            return; 
        }
        
        tbody.innerHTML = filtered.map(s => {
            let documentDisplay = s.document || '-';
            if (documentDisplay && documentDisplay.length === 14) {
                documentDisplay = documentDisplay.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
            }
            
            return `
            <tr>
                <td>${s.name || '-'}</td>
                <td>${s.contact || '-'}</td>
                <td>${s.phone || '-'}</td>
                <td>${s.email || '-'}</td>
                <td>${s.category || '-'}</td>
                <td>${s.city || '-'}</td>
                <td class="actions">
                    <button class="btn-view" onclick="viewSupplier('${s.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-edit" onclick="editSupplier('${s.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteSupplier('${s.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `}).join('');
    } catch (error) { 
        console.error('❌ Erro ao carregar fornecedores:', error); 
    }
}

async function saveSupplier(e) {
    e.preventDefault();
    console.log('💾 Iniciando salvamento de fornecedor...');
    
    try {
        const name = document.getElementById('supplier-name')?.value?.trim() || '';
        const contact = document.getElementById('supplier-contact')?.value?.trim() || '';
        
        // Pega o telefone e mantém APENAS os dígitos para salvar
        let phone = document.getElementById('supplier-phone')?.value?.trim() || '';
        // Salva apenas os números (sem máscara)
        const phoneDigits = phone.replace(/\D/g, '');
        
        const email = document.getElementById('supplier-email')?.value?.trim() || '';
        let documentValue = document.getElementById('supplier-document')?.value || '';
        const category = document.getElementById('supplier-category')?.value || '';
        const address = document.getElementById('supplier-address')?.value?.trim() || '';
        const city = document.getElementById('supplier-city')?.value?.trim() || '';
        const state = document.getElementById('supplier-state')?.value?.trim()?.toUpperCase() || '';
        const notes = document.getElementById('supplier-notes')?.value?.trim() || '';
        const id = document.getElementById('supplier-id')?.value || null;
        
        if (!name) { 
            showNotification('❌ Nome da empresa é obrigatório', 'error'); 
            return; 
        }
        
        const cleanDocument = documentValue.replace(/\D/g, '');
        
        const data = {
            id: id,
            name: name,
            contact: contact,
            phone: phone,
            email: email,
            document: cleanDocument,
            category: category,
            address: address,
            city: city,
            state: state,
            notes: notes
        };
        
        console.log('📄 Dados do fornecedor:', data);
        
        const result = await window.electronAPI.saveSupplier(data);
        
        if (result && result.success) {
            showNotification('✅ Fornecedor salvo com sucesso!', 'success');
            hideSupplierForm();
            dataCache.delete('suppliers');
            await loadSuppliers();
            await loadDashboard();
            document.getElementById('supplier-form')?.reset();
            document.getElementById('supplier-id').value = '';
            console.log('🎉 Fornecedor salvo com sucesso!');
        } else {
            const errorMsg = result?.error || 'Erro desconhecido ao salvar';
            console.error('❌ Erro ao salvar fornecedor:', errorMsg);
            showNotification('❌ Erro ao salvar fornecedor: ' + errorMsg, 'error');
        }
    } catch (error) {
        console.error('❌ Exceção ao salvar fornecedor:', error);
        showNotification('❌ Erro ao salvar fornecedor: ' + error.message, 'error');
    }
}

function showSupplierForm(id = null) {
    console.log('📝 Abrindo formulário de fornecedor, ID:', id);
    
    const fc = document.getElementById('supplier-form-container');
    if (!fc) {
        console.error('❌ Container do formulário não encontrado');
        return;
    }
    
    fc.classList.remove('hidden');
    
    if (id) {
        window.electronAPI.getSuppliers().then(suppliers => {
            const s = suppliers.find(x => x.id === id);
            if (s) {
                console.log('✏️ Editando fornecedor:', s.name);
                
                document.getElementById('supplier-id').value = s.id || '';
                document.getElementById('supplier-name').value = s.name || '';
                document.getElementById('supplier-contact').value = s.contact || '';
                
                // CORREÇÃO: Telefone - aplicar máscara ao carregar
                const phoneInput = document.getElementById('supplier-phone');
                if (phoneInput) {
                    if (s.phone) {
                        // Pega apenas os dígitos
                        const digitos = s.phone.replace(/\D/g, '');
                        console.log('📞 Carregando telefone do fornecedor:', s.phone, '-> dígitos:', digitos);
                        
                        // Define o valor com dígitos puros
                        phoneInput.value = digitos;
                        
                        // Dispara o evento input para aplicar a máscara
                        const event = new Event('input', { 
                            bubbles: true, 
                            cancelable: true 
                        });
                        phoneInput.dispatchEvent(event);
                        
                        console.log('📞 Telefone após máscara:', phoneInput.value);
                    } else {
                        phoneInput.value = '';
                    }
                }
                
                document.getElementById('supplier-email').value = s.email || '';
                
                // Formatar CNPJ para exibição
                let documentValue = s.document || '';
                if (documentValue && documentValue.length === 14) {
                    documentValue = documentValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                }
                document.getElementById('supplier-document').value = documentValue;
                
                document.getElementById('supplier-category').value = s.category || '';
                document.getElementById('supplier-address').value = s.address || '';
                document.getElementById('supplier-city').value = s.city || '';
                document.getElementById('supplier-state').value = s.state || '';
                document.getElementById('supplier-notes').value = s.notes || '';
            }
        }).catch(error => {
            console.error('❌ Erro ao buscar fornecedor:', error);
            showNotification('Erro ao carregar dados do fornecedor', 'error');
        });
    } else {
        console.log('➕ Novo fornecedor');
        document.getElementById('supplier-form')?.reset();
        document.getElementById('supplier-id').value = '';
    }
}

function hideSupplierForm() { 
    console.log('🙈 Escondendo formulário de fornecedor');
    document.getElementById('supplier-form-container')?.classList.add('hidden'); 
}

function editSupplier(id) { 
    console.log('✏️ Editando fornecedor:', id);
    showSupplierForm(id); 
}

async function deleteSupplier(id) {
    console.log('🗑️ Tentando excluir fornecedor:', id);
    
    confirmAction('Tem certeza que deseja excluir este fornecedor?', async () => {
        try {
            const result = await window.electronAPI.deleteSupplier(id);
            if (result && result.success) { 
                showNotification('✅ Fornecedor excluído com sucesso!', 'success'); 
                dataCache.delete('suppliers');
                await loadSuppliers(); 
                await loadDashboard(); 
                console.log('🎉 Fornecedor excluído!');
            } else { 
                const errorMsg = result?.error || 'Erro desconhecido';
                showNotification('❌ Erro ao excluir fornecedor: ' + errorMsg, 'error'); 
            }
        } catch (error) { 
            console.error('❌ Erro ao excluir fornecedor:', error);
            showNotification('❌ Erro ao excluir fornecedor', 'error');
        }
    });
}

async function viewSupplier(id) {
    try {
        const suppliers = await window.electronAPI.getSuppliers();
        const s = suppliers.find(x => x.id === id);
        if (!s) { 
            showNotification('Fornecedor não encontrado', 'error'); 
            return; 
        }
        
        let documentDisplay = s.document || '-';
        if (documentDisplay && documentDisplay.length === 14) {
            documentDisplay = documentDisplay.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        
        const body = `<div style="line-height:2;">
            <strong>Empresa:</strong> ${s.name || '-'}<br>
            <strong>Contato:</strong> ${s.contact || '-'}<br>
            <strong>Telefone:</strong> ${s.phone || '-'}<br>
            <strong>Email:</strong> ${s.email || '-'}<br>
            <strong>CNPJ:</strong> ${documentDisplay}<br>
            <strong>Categoria:</strong> ${s.category || '-'}<br>
            <strong>Endereço:</strong> ${s.address || '-'}<br>
            <strong>Cidade/UF:</strong> ${s.city || '-'}/${s.state || '-'}<br>
            <strong>Observações:</strong> ${s.notes || '-'}
        </div>`;
        
        showGenericModal('Detalhes do Fornecedor', body, [
            { label: 'Fechar', className: 'btn-secondary', onClick: () => closeModal() }
        ]);
    } catch (e) { 
        console.error('Erro ao visualizar fornecedor:', e); 
    }
}

// ============ PEÇAS ==========
async function loadParts(search = '') {
    try {
        const parts = await getCachedData('parts', () => window.electronAPI.getParts());
        const suppliers = await getCachedData('suppliers', () => window.electronAPI.getSuppliers());
        const tbody = document.getElementById('parts-table-body');
        if (!tbody) return;
        
        const filtered = parts.filter(p => p?.name?.toLowerCase().includes((search || '').toLowerCase()));
        
        if (!filtered.length) { 
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">Nenhuma peça cadastrada</td></tr>'; 
            return; 
        }
        
        tbody.innerHTML = filtered.map(p => {
            // 🔧 CORREÇÃO: Buscar fornecedor por supplier_id (snake_case)
            const supplier = suppliers.find(s => s.id === p.supplier_id);
            const supplierName = supplier ? supplier.name : '-';
            
            console.log('Peça:', p.name, '| supplier_id:', p.supplier_id, '| Fornecedor:', supplierName);
            
            return `<tr>
                <td style="max-width:200px;">${escapeHtml(p.name || '-')}</td>
                <td>${escapeHtml(p.code || '-')}</td>
                <td>${escapeHtml(p.category || '-')}</td>
                <td>${escapeHtml(supplierName)}</td>
                <td class="text-center">${p.quantity || 0}</td>
                <td class="text-center">R$ ${(p.cost || 0).toFixed(2)}</td>
                <td class="text-center">R$ ${(p.price || 0).toFixed(2)}</td>
                <td class="actions">
                    <button class="btn-edit" onclick="editPart('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deletePart('${p.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (error) { 
        console.error('Erro ao carregar peças:', error); 
        showNotification('Erro ao carregar peças', 'error'); 
    }
}

async function savePart(e) {
    e.preventDefault();
    
    const supplierSelect = document.getElementById('part-supplier');
    const supplierId = supplierSelect?.value || null;
    
    console.log('💾 Salvando peça - Fornecedor selecionado:', supplierId);
    
    const data = {
        id: document.getElementById('part-id').value || null,
        name: document.getElementById('part-name').value,
        code: document.getElementById('part-code').value,
        category: document.getElementById('part-category').value,
        supplierId: supplierId,  // ✅ Enviar como supplierId
        quantity: parseInt(document.getElementById('part-quantity').value) || 0,
        minQuantity: parseInt(document.getElementById('part-min-quantity').value) || 5,
        cost: parseFloat(document.getElementById('part-cost').value) || 0,
        price: parseFloat(document.getElementById('part-price').value) || 0,
        description: document.getElementById('part-description').value,
        ncm: document.getElementById('part-ncm')?.value || '',
        cfop: document.getElementById('part-cfop')?.value || '5405'
    };
    
    if (!data.name) { 
        showNotification('Nome da peça é obrigatório', 'error'); 
        return; 
    }
    
    console.log('📤 Enviando dados da peça:', {
        nome: data.name,
        supplierId: data.supplierId,
        quantidade: data.quantity,
        custo: data.cost,
        preco: data.price
    });
    
    try {
        const result = await window.electronAPI.savePart(data);
        if (result.success) {
            showNotification('Peça salva com sucesso!', 'success');
            hidePartForm();
            dataCache.delete('parts');
            await loadParts();
            await loadDashboard();
            await loadStock();
        } else { 
            showNotification('Erro ao salvar peça: ' + (result.error || 'Erro desconhecido'), 'error'); 
        }
    } catch (error) { 
        console.error('❌ Erro:', error); 
        showNotification('Erro ao salvar peça', 'error'); 
    }
}

async function showPartForm(id = null) {
    const fc = document.getElementById('part-form-container');
    if (!fc) return;
    fc.classList.remove('hidden');
    
    try {
        const suppliers = await window.electronAPI.getSuppliers();
        const sel = document.getElementById('part-supplier');
        if (sel) {
            sel.innerHTML = '<option value="">Selecione um fornecedor...</option>' + 
                suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
        
        if (id) {
            const parts = await window.electronAPI.getParts();
            const p = parts.find(x => x.id === id);
            if (p) {
                document.getElementById('part-id').value = p.id;
                document.getElementById('part-name').value = p.name || '';
                document.getElementById('part-code').value = p.code || '';
                document.getElementById('part-category').value = p.category || '';
                
                // ✅ CORREÇÃO: Selecionar o fornecedor correto
                if (sel && p.supplier_id) {
                    sel.value = p.supplier_id;
                    console.log('✏️ Fornecedor selecionado:', p.supplier_id);
                }
                
                document.getElementById('part-quantity').value = p.quantity || 0;
                document.getElementById('part-min-quantity').value = p.minQuantity || 5;
                document.getElementById('part-cost').value = p.cost || '';
                document.getElementById('part-price').value = p.price || '';
                document.getElementById('part-description').value = p.description || '';
                document.getElementById('part-ncm').value = p.ncm || '';
                document.getElementById('part-cfop').value = p.cfop || '5405';
            }
        } else { 
            document.getElementById('part-form').reset(); 
            document.getElementById('part-id').value = '';
            document.getElementById('part-cfop').value = '5405';
        }
    } catch (error) { 
        console.error('Erro ao carregar formulário de peça:', error); 
    }
}

function hidePartForm() { 
    document.getElementById('part-form-container')?.classList.add('hidden'); 
}

function editPart(id) { 
    showPartForm(id); 
}

async function deletePart(id) {
    confirmAction('Tem certeza que deseja excluir esta peça?', async () => {
        try {
            showNotification('Excluindo peça...', 'info');
            const result = await window.electronAPI.deletePart(id);
            
            if (result.success) { 
                showNotification(result.message || 'Peça excluída com sucesso!', 'success'); 
                dataCache.delete('parts');
                await loadParts(); 
                await loadDashboard(); 
                await loadStock(); 
            } else { 
                showNotification(result.error || 'Erro ao excluir peça', 'error'); 
            }
        } catch (error) { 
            console.error('Erro ao excluir:', error);
            showNotification('Erro ao excluir peça', 'error'); 
        }
    });
}

// ============ ESTOQUE ==========
async function loadStock() {
    try {
        const parts = await window.electronAPI.getParts();
        const suppliers = await window.electronAPI.getSuppliers();
        const tbody = document.getElementById('stock-table-body');
        const low = parts.filter(p => p.quantity < (p.minQuantity || 5));
        document.getElementById('low-stock-count').textContent = low.length;
        const lowList = document.getElementById('low-stock-list');
        if (lowList) {
            lowList.innerHTML = low.length ? 
                low.map(p => `<div class="warning-item"><strong>${p.name}</strong> - Atual: ${p.quantity} | Mínimo: ${p.minQuantity || 5}</div>`).join('') : 
                '<div class="no-data">Todos os itens estão com estoque adequado</div>';
        }
        
        const partSel = document.getElementById('movement-part');
        if (partSel) {
            partSel.innerHTML = '<option value="">Selecione uma peça...</option>' + 
                parts.map(p => `<option value="${p.id}">${p.name} (Estoque: ${p.quantity})</option>`).join('');
        }
        
        const clients = await window.electronAPI.getClients();
        const clientSel = document.getElementById('movement-client');
        if (clientSel) {
            clientSel.innerHTML = '<option value="">Selecione um cliente...</option>' + 
                clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
        
        const supplierSel = document.getElementById('movement-supplier');
        if (supplierSel) {
            supplierSel.innerHTML = '<option value="">Selecione um fornecedor...</option>' + 
                suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
        
        if (!tbody) return;
        if (!parts.length) { 
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">Nenhuma peça em estoque</td></tr>'; 
            return; 
        }
        tbody.innerHTML = parts.map(p => {
            const status = p.quantity <= 0 ? 'Esgotado' : 
                          (p.quantity < (p.minQuantity || 5) ? 'Baixo' : 'OK');
            const badgeClass = p.quantity <= 0 ? 'badge-danger' : 
                              (p.quantity < (p.minQuantity || 5) ? 'badge-warning' : 'badge-success');
            return `<tr>
                <td>${p.name}</td>
                <td>${p.category || '-'}</td>
                <td>${suppliers.find(s => s.id === p.supplierId)?.name || '-'}</td>
                <td class="text-center">${p.quantity || 0}</td>
                <td class="text-center">-</td>
                <td class="text-center"><span class="badge ${badgeClass}">${status}</span></td>
            </tr>`;
        }).join('');
    } catch (error) { 
        console.error(error); 
    }
}

async function saveStockMovement(e) {
    e.preventDefault();
    const data = {
        type: document.getElementById('movement-type').value,
        partId: document.getElementById('movement-part').value,
        quantity: parseInt(document.getElementById('movement-quantity').value) || 0,
        clientId: document.getElementById('movement-client').value || null,
        supplierId: document.getElementById('movement-supplier').value || null,
        reason: document.getElementById('movement-notes').value
    };
    if (!data.partId || data.quantity <= 0) { 
        showNotification('Selecione uma peça e informe uma quantidade válida', 'error'); 
        return; 
    }
    try {
        const res = await window.electronAPI.registerStockMovement(data);
        if (res.success) {
            showNotification('Movimentação registrada com sucesso!', 'success');
            document.getElementById('stock-form').reset();
            await loadStock();
            await loadParts();
            await loadDashboard();
            await loadRecentActivity();
        } else { 
            showNotification(res.error || 'Erro ao registrar movimentação', 'error'); 
        }
    } catch (error) { 
        console.error(error); 
        showNotification('Erro ao registrar movimentação', 'error'); 
    }
}

function showStockMovementForm() { 
    showTab('stock'); 
}

// ============ FUNÇÕES DE VENDA ==========

function calculateFinalTotal() {
    const subtotal = currentSale.items.reduce((s, i) => s + (i.subtotal || 0), 0);
    const labor = parseFloat(document.getElementById('sale-labor')?.value) || 0;
    let autoDiscount = 0;
    
    if (autoDiscountEnabled && currentPaymentMode === 'vista') {
        autoDiscount = (subtotal + labor) * (discountConfig[currentPaymentMethod] || 0) / 100;
    }
    
    let total = subtotal + labor - autoDiscount;
    
    if (currentPaymentMode === 'prazo' && currentFinancedMethod === 'boleto') {
        const extra = Math.max(0, currentInstallments - 4);
        const interestRate = systemSettings?.interestAfter4Percent || 2;
        total = total * (1 + (extra * interestRate) / 100);
    }
    
    return { subtotal, labor, autoDiscount, total };
}

function updateSaleTotal() {
    const { subtotal, labor, autoDiscount, total } = calculateFinalTotal();
    currentSale.subtotal = subtotal;
    currentSale.labor = labor;
    currentSale.discount = autoDiscount;
    currentSale.total = total;
    
    const subtotalDisplay = document.getElementById('sale-subtotal-display');
    if (subtotalDisplay) subtotalDisplay.textContent = `R$ ${subtotal.toFixed(2)}`;
    const totalDisplay = document.getElementById('sale-total-display');
    if (totalDisplay) totalDisplay.textContent = `R$ ${total.toFixed(2)}`;
    
    const discountSpan = document.getElementById('applied-discount-info');
    if (discountSpan) {
        discountSpan.innerHTML = autoDiscount > 0 ? 
            `<span style="color:#28a745;">Desconto automático aplicado: R$ ${autoDiscount.toFixed(2)}</span>` : '';
    }
    
    let desc = '';
    if (currentPaymentMode === 'vista') {
        const methods = { pix:'PIX', dinheiro:'Dinheiro', debito:'Débito', credito_vista:'Crédito à vista' };
        desc = `${methods[currentPaymentMethod] || currentPaymentMethod} (à vista) - Total: R$ ${total.toFixed(2)}`;
        if (autoDiscount > 0) {
            desc += ` (com desconto de R$ ${autoDiscount.toFixed(2)})`;
        }
    } else if (currentPaymentMode === 'prazo') {
        const installmentValue = total / currentInstallments;
        
        if (currentFinancedMethod === 'credito_prazo') {
            desc = `💳 Cartão de Crédito - ${currentInstallments}x de R$ ${installmentValue.toFixed(2)} - Total: R$ ${total.toFixed(2)}`;
        } else if (currentFinancedMethod === 'boleto') {
            desc = `📄 Boleto - ${currentInstallments}x de R$ ${installmentValue.toFixed(2)} - Total: R$ ${total.toFixed(2)}`;
        } else {
            desc = `A prazo - ${currentInstallments}x de R$ ${installmentValue.toFixed(2)} - Total: R$ ${total.toFixed(2)}`;
        }
    }
    
    const paymentDesc = document.getElementById('payment-description');
    if (paymentDesc) paymentDesc.textContent = desc;
}

function clearSaleForm() {
    currentSale = { items: [], total: 0, subtotal: 0, discount: 0, labor: 0, clientId: null };
    currentPaymentMode = 'vista';
    currentPaymentMethod = 'dinheiro';
    currentInstallments = 1;
    currentFinancedMethod = 'credito_prazo';
    document.getElementById('sale-form')?.reset();
    const saleClient = document.getElementById('sale-client');
    if (saleClient) saleClient.value = '';
    const salePart = document.getElementById('sale-part');
    if (salePart) salePart.value = '';
    const saleLabor = document.getElementById('sale-labor');
    if (saleLabor) saleLabor.value = '0';
    const saleNotes = document.getElementById('sale-notes');
    if (saleNotes) saleNotes.value = '';
    const saleQuantity = document.getElementById('sale-quantity');
    if (saleQuantity) saleQuantity.value = '1';
    const salePrice = document.getElementById('sale-price');
    if (salePrice) salePrice.value = '';
    const subtotalDisplay = document.getElementById('sale-subtotal-display');
    if (subtotalDisplay) subtotalDisplay.textContent = 'R$ 0.00';
    const totalDisplay = document.getElementById('sale-total-display');
    if (totalDisplay) totalDisplay.textContent = 'R$ 0.00';
    const paymentDesc = document.getElementById('payment-description');
    if (paymentDesc) paymentDesc.textContent = 'À vista - Total: R$ 0.00';
    const itemSubtotal = document.getElementById('sale-item-subtotal');
    if (itemSubtotal) itemSubtotal.textContent = 'R$ 0.00';
    updateSaleItemsTable();
    updatePaymentUI();
}

function showSaleForm() {
    const container = document.getElementById('sale-form-container');
    const newBtn = document.getElementById('new-sale-btn');
    const backBtn = document.getElementById('back-to-sales-btn');
    
    if (container) {
        container.style.display = 'block';
        container.classList.remove('hidden');
    }
    
    if (newBtn) newBtn.style.display = 'none';
    if (backBtn) backBtn.style.display = 'inline-flex';
    
    updatePaymentUI();
    setTimeout(() => updateSaleTotal(), 100);
}

function hideSaleForm() {
    const container = document.getElementById('sale-form-container');
    const newBtn = document.getElementById('new-sale-btn');
    const backBtn = document.getElementById('back-to-sales-btn');
    
    if (container) {
        container.style.display = 'none';
        container.classList.add('hidden');
    }
    
    if (newBtn) newBtn.style.display = 'inline-flex';
    if (backBtn) backBtn.style.display = 'none';
    
    clearSaleForm();
}

function startNewSale() { 
    clearSaleForm(); 
    showSaleForm(); 
    setTimeout(() => {
        updateSaleTotal();
        loadSaleClients();
        loadSaleParts();
    }, 100); 
    showNotification('Nova venda iniciada', 'info'); 
}

async function loadSaleClients() {
    try {
        const clients = await window.electronAPI.getClients();
        const sel = document.getElementById('sale-client');
        if (sel) {
            sel.innerHTML = '<option value="">Selecione um cliente...</option>' + 
                clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
    } catch (e) { console.error(e); }
}

async function loadSaleParts() {
    try {
        const parts = await window.electronAPI.getParts();
        const sel = document.getElementById('sale-part');
        if (sel) {
            sel.innerHTML = '<option value="">Selecione uma peça...</option>' + 
                parts.filter(p => p.quantity > 0).map(p => 
                    `<option value="${p.id}" data-price="${p.price || 0}">${p.name} (Estoque: ${p.quantity}) - R$ ${(p.price || 0).toFixed(2)}</option>`
                ).join('');
        }
    } catch (e) { console.error(e); }
}

function updateSalePartPrice() {
    const sel = document.getElementById('sale-part');
    const opt = sel?.options[sel.selectedIndex];
    if (opt?.dataset.price) {
        const priceInput = document.getElementById('sale-price');
        if (priceInput) priceInput.value = opt.dataset.price;
    }
    updateSaleItem();
}

function updateSaleItem() { 
    const price = parseFloat(document.getElementById('sale-price').value) || 0; 
    const qty = parseFloat(document.getElementById('sale-quantity').value) || 0; 
    const subtotal = document.getElementById('sale-item-subtotal');
    if (subtotal) subtotal.textContent = `R$ ${(price * qty).toFixed(2)}`; 
}

function updateSaleItemsTable() {
    const tbody = document.getElementById('sale-items-body');
    if (!tbody) return;
    if (!currentSale.items.length) { 
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">Nenhum item adicionado</td></tr>'; 
        return; 
    }
    tbody.innerHTML = currentSale.items.map((item, idx) => `
        <tr>
            <td>${item.name}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-center">R$ ${item.price.toFixed(2)}</td>
            <td class="text-center">R$ ${item.subtotal.toFixed(2)}</td>
            <td class="text-center">
                <button onclick="removeSaleItem(${idx})" class="btn-delete btn-small"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function removeSaleItem(idx) { 
    currentSale.items.splice(idx, 1); 
    updateSaleItemsTable(); 
    updateSaleTotal(); 
}

async function addSaleItem() {
    const partId = document.getElementById('sale-part').value;
    if (!partId) { 
        showNotification('Selecione uma peça', 'error'); 
        return; 
    }
    const quantity = parseFloat(document.getElementById('sale-quantity').value) || 1;
    const price = parseFloat(document.getElementById('sale-price').value) || 0;
    if (quantity <= 0 || price <= 0) { 
        showNotification('Quantidade e preço devem ser maiores que zero', 'error'); 
        return; 
    }
    try {
        const parts = await window.electronAPI.getParts();
        const part = parts.find(p => p.id === partId);
        if (!part) { 
            showNotification('Peça não encontrada', 'error'); 
            return; 
        }
        if (part.quantity < quantity) { 
            showNotification(`Estoque insuficiente! Disponível: ${part.quantity}`, 'error'); 
            return; 
        }
        currentSale.items.push({ 
            partId, 
            name: part.name, 
            quantity, 
            price, 
            subtotal: price * quantity 
        });
        updateSaleItemsTable();
        updateSaleTotal();
        document.getElementById('sale-part').value = '';
        document.getElementById('sale-quantity').value = '1';
        document.getElementById('sale-price').value = '';
        document.getElementById('sale-item-subtotal').textContent = 'R$ 0.00';
        showNotification('Item adicionado!', 'success');
    } catch (e) { 
        console.error(e); 
        showNotification('Erro ao adicionar item', 'error'); 
    }
}

function cancelSale() { 
    if (currentSale.items.length > 0) {
        confirmAction('Cancelar esta venda? Todos os itens serão perdidos.', () => {
            hideSaleForm();
            showNotification('Venda cancelada', 'warning');
        });
    } else {
        hideSaleForm();
    }
}

async function loadSales(search = '') {
    try {
        const sales = await window.electronAPI.getSales();
        const clients = await window.electronAPI.getClients();
        const tbody = document.getElementById('sales-history-body');
        if (!tbody) return;
        
        console.log('📊 Carregando vendas...');
        console.log('  Vendas:', sales?.length || 0);
        console.log('  Clientes:', clients?.length || 0);
        
        let filtered = sales || [];
        if (search) {
            const term = search.toLowerCase();
            filtered = filtered.filter(s => {
                const client = clients.find(c => c.id === s.client_id);
                return (String(s.sale_number).includes(term)) ||
                       (client?.name?.toLowerCase().includes(term)) ||
                       (s.items?.some(i => (i.name || '').toLowerCase().includes(term)));
            });
        }
        
        if (!filtered.length) { 
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">Nenhuma venda registrada</td></tr>'; 
            return; 
        }
        
        tbody.innerHTML = filtered
            .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
            .map(s => {
                // 🔧 CORREÇÃO: Buscar cliente pelo client_id (não clientId)
                const client = clients.find(c => c.id === s.client_id);
                const clientName = client ? client.name : (s.client_id ? 'Cliente #' + (s.client_id).substring(0, 6) : 'Consumidor Final');
                
                console.log('  Venda #' + s.sale_number + ' | client_id:', s.client_id, '| Cliente:', clientName);
                
                // 🔧 CORREÇÃO: Status do pagamento
                const paymentStatus = (s.payment_status || 'pending').toLowerCase();
                let statusClass = 'badge-warning';
                let statusLabel = 'Pendente';
                
                if (paymentStatus === 'paid') {
                    statusClass = 'badge-success';
                    statusLabel = 'Pago';
                }
                
                // 🔧 CORREÇÃO: Data
                const saleDate = s.date || s.created_at;
                const formattedDate = saleDate ? new Date(saleDate).toLocaleDateString('pt-BR') : '-';
                
                // 🔧 CORREÇÃO: Pagamento
                const paymentDesc = s.payment_description || '-';
                
                return `<tr>
                    <td class="text-center fw-bold">#${s.sale_number}</td>
                    <td>${formattedDate}</td>
                    <td>${escapeHtml(clientName)}</td>
                    <td class="text-center">${s.items?.length || 0}</td>
                    <td class="text-center fw-bold">R$ ${(s.total || 0).toFixed(2)}</td>
                    <td>${escapeHtml(paymentDesc)}</td>
                    <td class="text-center"><span class="badge ${statusClass}">${statusLabel}</span></td>
                    <td class="actions">
                        <button class="btn-view" onclick="viewSale('${s.id}')"><i class="fas fa-eye"></i></button>
                        <button class="btn-edit" onclick="editSale('${s.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-print" onclick="printSale('${s.id}')"><i class="fas fa-print"></i></button>
                        <button class="btn-delete" onclick="showDeleteConfirmationModal('${s.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            }).join('');
            
        console.log('✅ Tabela de vendas atualizada');
    } catch (error) { 
        console.error('❌ Erro ao carregar vendas:', error);
    }
}

async function finalizeSale(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.isProcessingSale) {
        console.warn('⚠️ Venda já está sendo processada...');
        return false;
    }
    
    window.isProcessingSale = true;
    
    const submitBtn = document.querySelector('#sale-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    }
    
    try {
        const clientSelect = document.getElementById('sale-client');
        const clientId = clientSelect?.value || null;
        
        if (!currentSale.items || currentSale.items.length === 0) { 
            showNotification('Adicione pelo menos um item à venda', 'error'); 
            window.isProcessingSale = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Finalizar Venda';
            }
            return false;
        }
        
        // Buscar nome do cliente
        let clientName = '';
        if (clientId) {
            try {
                const clients = await window.electronAPI.getClients();
                const client = clients.find(c => c.id === clientId);
                clientName = client ? client.name : '';
            } catch (e) {
                console.error('Erro ao buscar cliente:', e);
            }
        }
        
        const itemsSubtotal = currentSale.items.reduce((s, i) => s + (i.subtotal || 0), 0);
        const labor = parseFloat(document.getElementById('sale-labor')?.value) || 0;
        let discount = 0;
        
        if (autoDiscountEnabled && currentPaymentMode === 'vista') {
            discount = (itemsSubtotal + labor) * (discountConfig[currentPaymentMethod] || 0) / 100;
        }
        
        let total = itemsSubtotal + labor - discount;
        
        // Juros para boleto parcelado acima de 4x
        if (currentPaymentMode === 'prazo' && currentFinancedMethod === 'boleto') {
            const extra = Math.max(0, currentInstallments - 4);
            const interestRate = systemSettings?.interestAfter4Percent || 2;
            total = total * (1 + (extra * interestRate) / 100);
        }
        
        currentSale.subtotal = itemsSubtotal;
        currentSale.labor = labor;
        currentSale.discount = discount;
        currentSale.total = total;
        currentSale.clientId = clientId;
        
        // Determinar status do pagamento
        let initialStatus = 'pending';
        
        if (currentPaymentMode === 'vista') {
            // PIX, Dinheiro, Débito, Crédito à vista = PAGO
            initialStatus = 'paid';
        } else if (currentPaymentMode === 'prazo' && currentFinancedMethod === 'credito_prazo') {
            // Cartão de crédito = PAGO (quem parcela é o cliente com o banco)
            initialStatus = 'paid';
        } else if (currentPaymentMode === 'prazo' && currentFinancedMethod === 'boleto') {
            // Boleto = PENDENTE
            initialStatus = 'pending';
        }
        
        console.log('📊 Status definido:', initialStatus, '| Modo:', currentPaymentMode, '| Método:', currentFinancedMethod || currentPaymentMethod);
        
        // Montar descrição do pagamento
        let paymentDescription = '';
        const methods = { 
            pix: 'PIX', 
            dinheiro: 'Dinheiro', 
            debito: 'Débito', 
            credito_vista: 'Crédito à vista',
            credito_prazo: 'Cartão de Crédito',
            boleto: 'Boleto'
        };
        
        if (currentPaymentMode === 'vista') {
            const methodName = methods[currentPaymentMethod] || currentPaymentMethod;
            paymentDescription = `${methodName} (à vista) - Total: R$ ${total.toFixed(2)}`;
            if (discount > 0) {
                paymentDescription += ` (Desconto: R$ ${discount.toFixed(2)})`;
            }
        } else if (currentPaymentMode === 'prazo') {
            const installmentValue = total / currentInstallments;
            const methodName = methods[currentFinancedMethod] || currentFinancedMethod;
            paymentDescription = `${methodName} - ${currentInstallments}x de R$ ${installmentValue.toFixed(2)} - Total: R$ ${total.toFixed(2)}`;
        }
        
        const saleData = {
            clientId: clientId,
            items: currentSale.items.map(item => ({
                partId: item.partId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal
            })),
            labor: labor,
            subtotal: itemsSubtotal,
            discount: discount,
            total: total,
            paymentMode: currentPaymentMode,
            paymentMethod: currentPaymentMode === 'vista' ? currentPaymentMethod : currentFinancedMethod,
            paymentDescription: paymentDescription,
            installments: currentPaymentMode !== 'vista' ? currentInstallments : 1,
            financedMethod: currentPaymentMode !== 'vista' ? currentFinancedMethod : null,
            notes: document.getElementById('sale-notes')?.value || '',
            paymentStatus: initialStatus,
            clientName: clientName  // ✅ Enviar nome do cliente
        };
        
        console.log('📊 DADOS ENVIADOS:', {
            clientId: saleData.clientId,
            clientName: saleData.clientName,
            paymentStatus: saleData.paymentStatus,
            paymentDescription: saleData.paymentDescription,
            total: saleData.total
        });
        
        const result = await window.electronAPI.saveSale(saleData);
        
        if (result && result.success) {
            let message = `✅ Venda finalizada!`;
            if (initialStatus === 'paid') {
                message += ' 💰 PAGO!';
            } else {
                message += ' 📄 Aguardando pagamento.';
            }
            message += ` Total: R$ ${total.toFixed(2)}`;
            showNotification(message, 'success');
            
            hideSaleForm();
            clearSaleForm();
            
            dataCache.delete('sales');
            dataCache.delete('parts');
            await Promise.all([
                loadSales(), 
                loadDashboard(), 
                loadParts(), 
                loadStock(), 
                loadRecentActivity()
            ]);
        } else { 
            showNotification(result?.error || 'Erro ao finalizar venda', 'error'); 
        }
        
    } catch (error) { 
        console.error('❌ Erro ao finalizar venda:', error); 
        showNotification('Erro ao finalizar venda: ' + error.message, 'error'); 
    } finally {
        window.isProcessingSale = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Finalizar Venda';
        }
    }
    
    return false;
}

async function viewSale(id) {
    try {
        const sales = await window.electronAPI.getSales();
        const sale = sales.find(s => s.id === id);
        if (!sale) { showNotification('Venda não encontrada', 'error'); return; }
        
        const clients = await window.electronAPI.getClients();
        
        // 🔧 CORREÇÃO: Buscar pelo client_id
        const client = clients.find(c => c.id === sale.client_id);
        const clientName = client ? client.name : 'Consumidor Final';
        
        const itemsHtml = sale.items && sale.items.length > 0 ? `
            <table class="compact-table">
                <thead><tr><th>Item</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr></thead>
                <tbody>${sale.items.map(i => `
                    <tr>
                        <td>${escapeHtml(i.name || 'Item')}</td>
                        <td class="text-center">${i.quantity}</td>
                        <td class="text-center">R$ ${(i.price || 0).toFixed(2)}</td>
                        <td class="text-center">R$ ${(i.subtotal || 0).toFixed(2)}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        ` : '<p>Nenhum item registrado</p>';
        
        // 🔧 CORREÇÃO: Status
        const isPaid = sale.payment_status === 'paid';
        const statusLabel = isPaid ? 
            '<span class="badge badge-success">PAGO</span>' : 
            '<span class="badge badge-warning">PENDENTE</span>';
        
        // 🔧 CORREÇÃO: Descrição do pagamento
        const paymentDesc = sale.payment_description || '-';
        
        const body = `
            <div style="line-height:2.2;">
                <strong>Nº Venda:</strong> #${sale.sale_number}<br>
                <strong>Cliente:</strong> ${escapeHtml(clientName)}<br>
                <strong>Data:</strong> ${sale.date ? new Date(sale.date).toLocaleString('pt-BR') : '-'}<br>
                <strong>Pagamento:</strong> ${escapeHtml(paymentDesc)}<br>
                <strong>Status:</strong> ${statusLabel}<br>
                <strong>Mão de obra:</strong> R$ ${(sale.labor || 0).toFixed(2)}<br>
                <strong>Desconto:</strong> R$ ${(sale.discount || 0).toFixed(2)}<br>
                <div style="margin-top:15px;"><strong>Itens:</strong></div>
                ${itemsHtml}
                <div style="margin-top:15px;text-align:right;font-size:18px;">
                    <strong>Total: R$ ${(sale.total || 0).toFixed(2)}</strong>
                </div>
            </div>
        `;
        
        showGenericModal(`Venda #${sale.sale_number}`, body, [
            { label: 'Editar', className: 'btn-primary', onClick: () => { closeModal(); editSale(id); } },
            { label: 'Imprimir', className: 'btn-success', onClick: () => { closeModal(); printSale(id); } },
            { label: 'Fechar', className: 'btn-secondary', onClick: () => closeModal() }
        ]);
    } catch (error) { 
        console.error(error); 
        showNotification('Erro ao visualizar venda', 'error'); 
    }
}

async function editSale(saleId) {
    try {
        const sales = await window.electronAPI.getSales();
        const sale = sales.find(s => s.id === saleId);
        if (!sale) { showNotification('Venda não encontrada', 'error'); return; }
        const clients = await window.electronAPI.getClients();
        const parts = await window.electronAPI.getParts();
        let editItems = sale.items ? [...sale.items] : [];
        
        const renderItems = () => {
            const container = document.getElementById('edit-items-list');
            if (!container) return;
            if (!editItems.length) { container.innerHTML = '<div style="text-align:center;padding:20px;">Nenhum item</div>'; return; }
            container.innerHTML = editItems.map((item, idx) => `
                <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;padding:10px;background:#f8f9fa;border-radius:5px;">
                    <div style="flex:2;"><strong>${escapeHtml(item.name)}</strong></div>
                    <div style="flex:1;"><input type="number" class="edit-qty" value="${item.quantity}" min="1" style="width:70px;padding:5px;" data-idx="${idx}"></div>
                    <div style="flex:1;"><input type="number" class="edit-price" value="${item.price}" step="0.01" min="0" style="width:100px;padding:5px;" data-idx="${idx}"></div>
                    <div style="flex:1;text-align:center;"><strong>R$ ${(item.quantity * item.price).toFixed(2)}</strong></div>
                    <div><button class="btn-delete btn-small" onclick="removeEditItem(${idx})">✕</button></div>
                </div>
            `).join('');
            document.querySelectorAll('.edit-qty').forEach(inp => inp.addEventListener('change', function() { 
                editItems[this.dataset.idx].quantity = parseFloat(this.value) || 1; 
                editItems[this.dataset.idx].subtotal = editItems[this.dataset.idx].quantity * editItems[this.dataset.idx].price; 
                renderItems(); 
                updateEditTotal(); 
            }));
            document.querySelectorAll('.edit-price').forEach(inp => inp.addEventListener('change', function() { 
                editItems[this.dataset.idx].price = parseFloat(this.value) || 0; 
                editItems[this.dataset.idx].subtotal = editItems[this.dataset.idx].quantity * editItems[this.dataset.idx].price; 
                renderItems(); 
                updateEditTotal(); 
            }));
        };
        
        window.removeEditItem = (idx) => { 
            confirmAction('Remover este item?', () => {
                editItems.splice(idx, 1); 
                renderItems(); 
                updateEditTotal(); 
            });
        };
        
        const addItem = () => {
            const partId = document.getElementById('edit-add-part')?.value;
            if (!partId) { showNotification('Selecione uma peça', 'warning'); return; }
            const qty = parseFloat(document.getElementById('edit-add-quantity')?.value) || 1;
            const part = parts.find(p => p.id === partId);
            if (!part) { showNotification('Peça não encontrada', 'error'); return; }
            editItems.push({ partId: part.id, name: part.name, quantity: qty, price: part.price || 0, subtotal: qty * (part.price || 0) });
            renderItems(); 
            updateEditTotal();
            document.getElementById('edit-add-part').value = '';
            document.getElementById('edit-add-quantity').value = '1';
        };
        
        const updateEditTotal = () => {
            const subtotal = editItems.reduce((s, i) => s + i.subtotal, 0);
            const labor = parseFloat(document.getElementById('edit-sale-labor')?.value) || 0;
            const discount = parseFloat(document.getElementById('edit-sale-discount')?.value) || 0;
            document.getElementById('edit-subtotal-display').textContent = `R$ ${subtotal.toFixed(2)}`;
            document.getElementById('edit-total-display').textContent = `R$ ${(subtotal + labor - discount).toFixed(2)}`;
        };
        
        const body = `
            <div><label>Cliente</label><select id="edit-sale-client" style="width:100%;padding:8px;">${clients.map(c => `<option value="${c.id}" ${c.id === sale.clientId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}</select></div>
            <div style="display:flex;gap:15px;margin:15px 0;"><div style="flex:1"><label>Mão de obra (R$)</label><input type="number" id="edit-sale-labor" step="0.01" value="${sale.labor || 0}" style="width:100%;padding:8px;"></div>
            <div style="flex:1"><label>Desconto (R$)</label><input type="number" id="edit-sale-discount" step="0.01" value="${sale.discount || 0}" style="width:100%;padding:8px;"></div></div>
            <div><label>Status</label><select id="edit-sale-status" style="width:100%;padding:8px;"><option value="paid" ${sale.paymentStatus === 'paid' ? 'selected' : ''}>Pago</option><option value="pending" ${sale.paymentStatus === 'pending' ? 'selected' : ''}>Pendente</option><option value="overdue" ${sale.paymentStatus === 'overdue' ? 'selected' : ''}>Atrasado</option><option value="partial" ${sale.paymentStatus === 'partial' ? 'selected' : ''}>Parcial</option></select></div>
            <div style="margin:20px 0;"><h4>Itens da Venda</h4><div id="edit-items-list"></div>
            <div style="background:#f8f9fa;padding:15px;border-radius:5px;margin-top:10px;"><h5>Adicionar item</h5><div style="display:flex;gap:10px;"><select id="edit-add-part" style="flex:2;padding:8px;"><option value="">Selecione...</option>${parts.map(p => `<option value="${p.id}">${escapeHtml(p.name)} - R$ ${(p.price || 0).toFixed(2)}</option>`).join('')}</select>
            <input type="number" id="edit-add-quantity" value="1" min="1" style="flex:1;padding:8px;"><button type="button" class="btn-primary" onclick="addItem()">Adicionar</button></div></div></div>
            <div style="background:#e9ecef;padding:15px;border-radius:5px;"><div><span>Subtotal:</span> <span id="edit-subtotal-display">R$ 0.00</span></div><div style="font-weight:bold;border-top:1px solid #ced4da;padding-top:8px;margin-top:8px;"><span>TOTAL:</span> <span id="edit-total-display">R$ 0.00</span></div></div>
            <div style="margin-top:15px;"><label>Observações</label><textarea id="edit-sale-notes" rows="3" style="width:100%;padding:8px;">${sale.notes || ''}</textarea></div>
        `;
        
        closeModal();
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.maxWidth = '700px';
        content.innerHTML = `<div class="modal-header"><h3>Editar Venda #${sale.saleNumber || sale.id.substring(0,8)}</h3><button class="close-modal" onclick="this.closest('.modal-overlay').remove()">&times;</button></div><div class="modal-body">${body}</div><div class="modal-footer"><button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button class="btn-primary" id="saveEditBtn">Salvar</button></div>`;
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        renderItems();
        updateEditTotal();
        document.getElementById('edit-sale-labor')?.addEventListener('input', updateEditTotal);
        document.getElementById('edit-sale-discount')?.addEventListener('input', updateEditTotal);
        window.addItem = addItem;
        
        document.getElementById('saveEditBtn').onclick = async () => {
            const subtotal = editItems.reduce((s, i) => s + i.subtotal, 0);
            const labor = parseFloat(document.getElementById('edit-sale-labor')?.value) || 0;
            const discount = parseFloat(document.getElementById('edit-sale-discount')?.value) || 0;
            const updatedSale = { 
                ...sale, 
                clientId: document.getElementById('edit-sale-client').value, 
                items: editItems, 
                labor, 
                subtotal, 
                discount, 
                total: subtotal + labor - discount, 
                paymentStatus: document.getElementById('edit-sale-status').value, 
                notes: document.getElementById('edit-sale-notes').value 
            };
            const result = await window.electronAPI.saveSale(updatedSale);
            if (result.success) { 
                showNotification('Venda atualizada!', 'success'); 
                overlay.remove(); 
                dataCache.delete('sales');
                await loadSales(); 
                await loadDashboard(); 
            } else { 
                showNotification('Erro ao atualizar', 'error'); 
            }
        };
    } catch (error) { console.error(error); showNotification('Erro ao editar', 'error'); }
}

function showDeleteConfirmationModal(saleId) {
    confirmAction('Excluir permanentemente esta venda?', async () => {
        showNotification('Excluindo...', 'info');
        try {
            const result = await window.electronAPI.deleteSale(saleId, true);
            if (result?.success) {
                showNotification('Venda excluída! Estoque reabastecido.', 'success');
                dataCache.delete('sales');
                dataCache.delete('parts');
                await Promise.all([loadSales(), loadDashboard(), loadRecentActivity(), loadParts(), loadStock()]);
            } else { 
                showNotification(result?.error || 'Erro ao excluir venda', 'error'); 
            }
        } catch (error) { 
            console.error(error); 
            showNotification('Erro ao excluir venda', 'error'); 
        }
    });
}

// ============ SERVIÇOS ==========
async function loadServices(search = '') {
    try {
        const services = await window.electronAPI.getServices();
        const clients = await window.electronAPI.getClients();
        const tbody = document.getElementById('services-table-body');
        if (!tbody) return;
        
        let filtered = services || [];
        if (search) {
            const term = search.toLowerCase();
            filtered = filtered.filter(s => {
                const client = clients.find(c => c.id === s.client_id);
                return (String(s.service_number).includes(term)) ||
                       (client?.name?.toLowerCase().includes(term)) ||
                       (s.equipment?.toLowerCase().includes(term));
            });
        }
        
        if (!filtered.length) { 
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhum serviço registrado</td></tr>'; 
            document.getElementById('total-quotes').textContent = '0';
            document.getElementById('in-progress').textContent = '0';
            document.getElementById('completed').textContent = '0';
            document.getElementById('total-revenue').textContent = 'R$ 0';
            return; 
        }
        
        const quotes = filtered.filter(s => s.status === 'orcamento').length;
        const inProgress = filtered.filter(s => s.status === 'em_andamento' || s.status === 'aguardando_peca').length;
        const completed = filtered.filter(s => s.status === 'finalizado' || s.status === 'entregue').length;
        const revenue = filtered.filter(s => s.status === 'finalizado' || s.status === 'entregue')
            .reduce((sum, s) => sum + (s.value || 0) + ((s.parts || []).reduce((ps, p) => ps + (p.subtotal || 0), 0)), 0);
        
        document.getElementById('total-quotes').textContent = quotes;
        document.getElementById('in-progress').textContent = inProgress;
        document.getElementById('completed').textContent = completed;
        document.getElementById('total-revenue').textContent = `R$ ${revenue.toFixed(2)}`;
        
        tbody.innerHTML = filtered.map(s => {
            // 🔧 CORREÇÃO: Buscar cliente por client_id (snake_case)
            const client = clients.find(c => c.id === s.client_id);
            const clientName = client ? client.name : (s.client_id ? 'Cliente #' + s.client_id.substring(0, 6) : '-');
            
            const total = (s.value || 0) + ((s.parts || []).reduce((sum, p) => sum + (p.subtotal || 0), 0));
            let statusClass = 'badge-secondary', statusName = getServiceStatusName(s.status);
            if (s.status === 'orcamento') statusClass = 'badge-info';
            else if (s.status === 'em_andamento') statusClass = 'badge-warning';
            else if (s.status === 'finalizado') statusClass = 'badge-success';
            else if (s.status === 'convertido') { statusClass = 'badge-success'; statusName = 'Convertido'; }
            
            return `<tr>
                <td class="text-center fw-bold">#${s.service_number || s.id.substring(0, 4)}</td>
                <td>${escapeHtml(clientName)}</td>
                <td>${escapeHtml(s.equipment || '-')}</td>
                <td>${(s.problem || '').substring(0, 40)}${(s.problem || '').length > 40 ? '...' : ''}</td>
                <td class="text-center fw-bold">R$ ${total.toFixed(2)}</td>
                <td class="text-center"><span class="badge ${statusClass}">${statusName}</span></td>
                <td class="actions">
                    <button class="btn-view" onclick="viewService('${s.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-print" onclick="printService('${s.id}')"><i class="fas fa-print"></i></button>
                    <button class="btn-whatsapp" onclick="sendViaWhatsApp('${s.id}')"><i class="fab fa-whatsapp"></i></button>
                    ${s.status !== 'convertido' ? `<button class="btn-success" onclick="convertServiceToSale('${s.id}')"><i class="fas fa-shopping-cart"></i></button>` : ''}
                    <button class="btn-edit" onclick="editService('${s.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteService('${s.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (error) { console.error(error); }
}

async function viewService(id) {
    try {
        const services = await window.electronAPI.getServices();
        const service = services.find(s => s.id === id);
        if (!service) { showNotification('Serviço não encontrado', 'error'); return; }
        
        const clients = await window.electronAPI.getClients();
        // 🔧 CORREÇÃO: Buscar por client_id
        const client = clients.find(c => c.id === service.client_id);
        const clientName = client ? client.name : (service.client_id ? 'Cliente #' + service.client_id.substring(0, 8) : '-');
        
        const partsTotal = (service.parts || []).reduce((s, p) => s + (p.subtotal || 0), 0);
        const body = `<div style="line-height:2;">
            <strong>Nº Orçamento:</strong> #${service.service_number || service.id.substring(0, 4)}<br>
            <strong>Cliente:</strong> ${escapeHtml(clientName)}<br>
            <strong>Equipamento:</strong> ${escapeHtml(service.equipment || '-')}<br>
            <strong>Problema:</strong> ${escapeHtml(service.problem || '-')}<br>
            ${service.solution ? `<strong>Solução:</strong> ${escapeHtml(service.solution)}<br>` : ''}
            <strong>Mão de obra:</strong> R$ ${(service.value || 0).toFixed(2)}<br>
            <strong>Total peças:</strong> R$ ${partsTotal.toFixed(2)}<br>
            <strong>Total Geral:</strong> R$ ${((service.value || 0) + partsTotal).toFixed(2)}<br>
            <strong>Status:</strong> ${getServiceStatusName(service.status)}<br>
            ${service.notes ? `<strong>Observações:</strong> ${escapeHtml(service.notes)}` : ''}
        </div>`;
        
        showGenericModal(`Orçamento #${service.service_number || id.substring(0, 4)}`, body, [
            { label: 'Converter em Venda', className: 'btn-success', onClick: () => { closeModal(); convertServiceToSale(id); } },
            { label: 'WhatsApp', className: 'btn-whatsapp', onClick: () => { closeModal(); sendViaWhatsApp(id); } },
            { label: 'Imprimir', className: 'btn-primary', onClick: () => { closeModal(); printService(id); } },
            { label: 'Editar', className: 'btn-edit', onClick: () => { closeModal(); editService(id); } },
            { label: 'Fechar', className: 'btn-secondary', onClick: () => closeModal() }
        ]);
    } catch (e) { console.error(e); }
}

async function saveService(e) {
    e.preventDefault();
    const data = {
        id: document.getElementById('service-id').value || null,
        clientId: document.getElementById('service-client').value,
        equipment: document.getElementById('service-equipment').value,
        problem: document.getElementById('service-problem').value,
        solution: document.getElementById('service-solution').value,
        value: parseFloat(document.getElementById('service-value').value) || 0,
        status: document.getElementById('service-status').value,
        notes: document.getElementById('service-notes').value,
        parts: currentServiceParts
    };
    if (!data.clientId) { showNotification('Selecione um cliente', 'error'); return; }
    if (!data.problem) { showNotification('Descreva o problema', 'error'); return; }
    try {
        const result = await window.electronAPI.saveService(data);
        if (result.success) {
            showNotification('Serviço salvo com sucesso!', 'success');
            hideServiceForm();
            dataCache.delete('services');
            await loadServices();
            await loadDashboard();
        } else { showNotification('Erro ao salvar serviço', 'error'); }
    } catch (error) { console.error(error); showNotification('Erro ao salvar serviço', 'error'); }
}

async function showServiceForm(id = null) {
    const fc = document.getElementById('service-form-container');
    if (!fc) return;
    fc.classList.remove('hidden');
    await loadServiceClientsSelect();
    await loadServicePartsSelect();
    currentServiceParts = [];
    if (id) {
        const services = await window.electronAPI.getServices();
        const service = services.find(s => s.id === id);
        if (service) {
            document.getElementById('service-id').value = service.id;
            document.getElementById('service-client').value = service.clientId || '';
            document.getElementById('service-equipment').value = service.equipment || '';
            document.getElementById('service-problem').value = service.problem || '';
            document.getElementById('service-solution').value = service.solution || '';
            document.getElementById('service-value').value = service.value || 0;
            document.getElementById('service-status').value = service.status || 'orcamento';
            document.getElementById('service-notes').value = service.notes || '';
            if (service.parts) currentServiceParts = [...service.parts];
        }
    } else { 
        document.getElementById('service-form').reset(); 
        document.getElementById('service-id').value = ''; 
    }
    updateServicePartsTable();
    recalcServiceTotal();
}

async function loadServiceClientsSelect() {
    const clients = await window.electronAPI.getClients();
    document.getElementById('service-client').innerHTML = '<option value="">Selecione um cliente...</option>' + 
        clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function loadServicePartsSelect() {
    const parts = await window.electronAPI.getParts();
    document.getElementById('service-part').innerHTML = '<option value="">Selecione uma peça...</option>' + 
        parts.map(p => `<option value="${p.id}" data-price="${p.price || 0}">${p.name} (Estoque: ${p.quantity})</option>`).join('');
}

function updateServicePartPrice() {
    const sel = document.getElementById('service-part');
    const opt = sel?.options[sel.selectedIndex];
    if (opt?.dataset.price) {
        document.getElementById('service-part-price').value = opt.dataset.price;
    }
    updateServicePartSubtotal();
}

function updateServicePartSubtotal() {
    const qty = parseFloat(document.getElementById('service-part-quantity').value) || 0;
    const price = parseFloat(document.getElementById('service-part-price').value) || 0;
    document.getElementById('service-part-subtotal').textContent = `R$ ${(qty * price).toFixed(2)}`;
}

function addServicePart() {
    const partId = document.getElementById('service-part').value;
    if (!partId) { showNotification('Selecione uma peça', 'error'); return; }
    const quantity = parseFloat(document.getElementById('service-part-quantity').value) || 1;
    const price = parseFloat(document.getElementById('service-part-price').value) || 0;
    if (quantity <= 0 || price <= 0) { showNotification('Quantidade e preço devem ser maiores que zero', 'error'); return; }
    const sel = document.getElementById('service-part');
    const opt = sel.options[sel.selectedIndex];
    const partName = opt.text.split(' (')[0];
    currentServiceParts.push({ partId, name: partName, quantity, price, subtotal: price * quantity });
    updateServicePartsTable();
    recalcServiceTotal();
    document.getElementById('service-part').value = '';
    document.getElementById('service-part-quantity').value = '1';
    document.getElementById('service-part-price').value = '';
    document.getElementById('service-part-subtotal').textContent = 'R$ 0.00';
}

function removeServicePart(idx) { 
    currentServiceParts.splice(idx, 1); 
    updateServicePartsTable(); 
    recalcServiceTotal(); 
}

function updateServicePartsTable() {
    const tbody = document.getElementById('service-parts-body');
    if (!tbody) return;
    if (!currentServiceParts.length) { 
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">Nenhuma peça adicionada</td></tr>'; 
        return; 
    }
    tbody.innerHTML = currentServiceParts.map((item, idx) => `
        <tr>
            <td style="max-width:200px;">${item.name}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-center">R$ ${item.price.toFixed(2)}</td>
            <td class="text-center">R$ ${item.subtotal.toFixed(2)}</td>
            <td class="text-center">
                <button onclick="removeServicePart(${idx})" class="btn-delete btn-small"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function recalcServiceTotal() {
    const partsTotal = currentServiceParts.reduce((s,i) => s + i.subtotal, 0);
    const labor = parseFloat(document.getElementById('service-value').value) || 0;
    document.getElementById('service-parts-total').textContent = `R$ ${partsTotal.toFixed(2)}`;
    document.getElementById('service-total-display').textContent = `R$ ${(partsTotal + labor).toFixed(2)}`;
}

function hideServiceForm() { 
    document.getElementById('service-form-container')?.classList.add('hidden'); 
}

function editService(id) { 
    showServiceForm(id); 
}

async function deleteService(serviceId) {
    confirmAction('Excluir este serviço?', async () => {
        try {
            const result = await window.electronAPI.deleteService(serviceId);
            if (result?.success) {
                showNotification('Serviço excluído!', 'success');
                dataCache.delete('services');
                await Promise.all([loadServices(), loadDashboard()]);
            } else { 
                showNotification(result?.error || 'Erro ao excluir serviço', 'error'); 
            }
        } catch (error) { 
            console.error(error); 
            showNotification('Erro ao excluir serviço', 'error'); 
        }
    });
}

async function convertServiceToSale(serviceId) {
    try {
        const services = await window.electronAPI.getServices();
        const service = services.find(s => s.id === serviceId);
        if (!service) { showNotification('Serviço não encontrado', 'error'); return; }
        
        const clients = await window.electronAPI.getClients();
        // 🔧 CORREÇÃO: Buscar por client_id (snake_case)
        const client = clients.find(c => c.id === service.client_id);
        if (!client) { showNotification('Cliente não encontrado', 'error'); return; }
        
        if (!confirm(`Converter orçamento #${service.service_number || service.id.substring(0, 8)} em venda?`)) return;
        
        closeModal();
        clearSaleForm();
        showTab('sales');
        
        // Aguardar a aba carregar
        await new Promise(r => setTimeout(r, 500));
        
        await loadSaleClients();
        await loadSaleParts();
        
        // Selecionar o cliente
        const clientSelect = document.getElementById('sale-client');
        if (clientSelect) {
            clientSelect.value = client.id;
            console.log('✅ Cliente selecionado:', client.name);
        }
        
        // Adicionar peças do orçamento
        if (service.parts && service.parts.length > 0) {
            for (const part of service.parts) {
                currentSale.items.push({
                    partId: part.partId,
                    name: part.name,
                    quantity: part.quantity,
                    price: part.price,
                    subtotal: part.subtotal
                });
            }
        }
        
        // Adicionar mão de obra
        if (service.value) {
            const laborInput = document.getElementById('sale-labor');
            if (laborInput) laborInput.value = service.value;
        }
        
        // Adicionar observações
        const notesInput = document.getElementById('sale-notes');
        if (notesInput) {
            notesInput.value = `ORIGEM: Orçamento #${service.service_number || service.id.substring(0, 8)}\n${service.notes || ''}`;
        }
        
        // Mostrar formulário de venda
        const container = document.getElementById('sale-form-container');
        if (container) {
            container.style.display = 'block';
            container.classList.remove('hidden');
        }
        
        const newBtn = document.getElementById('new-sale-btn');
        if (newBtn) newBtn.style.display = 'none';
        
        const backBtn = document.getElementById('back-to-sales-btn');
        if (backBtn) backBtn.style.display = 'inline-flex';
        
        updateSaleItemsTable();
        updateSaleTotal();
        updatePaymentUI();
        
        // Marcar serviço como convertido
        service.status = 'convertido';
        await window.electronAPI.saveService(service);
        
        showNotification('Orçamento convertido! Escolha a forma de pagamento e finalize a venda.', 'success');
        
    } catch (error) { 
        console.error('Erro ao converter:', error); 
        showNotification('Erro ao converter orçamento: ' + error.message, 'error'); 
    }
}

async function sendViaWhatsApp(serviceId) {
    try {
        const services = await window.electronAPI.getServices();
        const service = services.find(s => s.id === serviceId);
        if (!service) {
            showNotification('Serviço não encontrado', 'error');
            return;
        }
        
        const clients = await window.electronAPI.getClients();
        // 🔧 CORREÇÃO: Buscar por client_id (snake_case)
        const client = clients.find(c => c.id === service.client_id);
        
        if (!client || !client.phone) {
            showNotification('Cliente não possui telefone cadastrado', 'warning');
            return;
        }
        
        const partsTotal = (service.parts || []).reduce((s, p) => s + (p.subtotal || 0), 0);
        const total = (service.value || 0) + partsTotal;
        
        // Formatar mensagem
        let message = `*Smart Tech Reparo* 🛠️\n\n`;
        message += `📋 *Orçamento #${service.service_number || service.id.substring(0, 6)}*\n\n`;
        message += `👤 *Cliente:* ${client.name}\n`;
        message += `📱 *Equipamento:* ${service.equipment || 'Não informado'}\n`;
        message += `🔧 *Problema:* ${(service.problem || '').substring(0, 80)}\n\n`;
        
        if (service.parts && service.parts.length > 0) {
            message += `📦 *Peças:*\n`;
            service.parts.forEach(p => {
                message += `  • ${p.name} (${p.quantity}x) - R$ ${(p.subtotal || 0).toFixed(2)}\n`;
            });
            message += `\n`;
        }
        
        message += `🔨 *Mão de obra:* R$ ${(service.value || 0).toFixed(2)}\n`;
        message += `💰 *Valor Total:* R$ ${total.toFixed(2)}\n\n`;
        message += `📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n`;
        message += `🏢 *Smart Tech Reparo*\n`;
        message += `📞 (16) 99716-6263`;
        
        // Limpar telefone (remover máscara)
        const phone = client.phone.replace(/\D/g, '');
        
        if (phone.length < 10) {
            showNotification('Número de telefone inválido', 'error');
            return;
        }
        
        // Abrir WhatsApp
        const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
        console.log('🔗 Abrindo WhatsApp:', whatsappUrl);
        
        window.open(whatsappUrl, '_blank');
        showNotification('Abrindo WhatsApp...', 'success');
        
    } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error);
        showNotification('Erro ao abrir WhatsApp', 'error');
    }
}

// ============ COMPRAS (NF-e) ==========
async function loadPurchaseSummary() {
    try {
        const purchases = await window.electronAPI.getPurchases() || [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthPurchases = purchases.filter(p => {
            const date = new Date(p.issueDate || p.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        const monthlyTotal = monthPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
        const monthlyCount = monthPurchases.length;
        
        const parts = await window.electronAPI.getParts() || [];
        const stockValue = parts.reduce((sum, p) => sum + ((p.cost || 0) * (p.quantity || 0)), 0);
        
        document.getElementById('monthly-purchases').textContent = `R$ ${monthlyTotal.toFixed(2)}`;
        document.getElementById('stock-value').textContent = `R$ ${stockValue.toFixed(2)}`;
        document.getElementById('monthly-invoices').textContent = monthlyCount;
        
    } catch (error) {
        console.error('Erro ao carregar resumo de compras:', error);
    }
}

async function loadPurchases() {
    try {
        await loadPurchaseSummary();
        await loadPurchasesTable();
        await loadPurchaseSuppliers();
        await loadPurchaseParts();
    } catch (error) {
        console.error('Erro ao carregar compras:', error);
    }
}

async function loadPurchasesTable(search = '') {
    try {
        let purchases = await window.electronAPI.getPurchases() || [];
        const tbody = document.getElementById('purchases-table-body');
        if (!tbody) return;
        
        let filtered = purchases || [];
        if (search) {
            const term = search.toLowerCase();
            filtered = filtered.filter(p => 
                (p.invoiceNumber || '').toLowerCase().includes(term) ||
                (p.supplierName || '').toLowerCase().includes(term)
            );
        }
        
        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhuma compra registrada</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.sort((a,b) => new Date(b.issueDate || b.date) - new Date(a.issueDate || a.date)).map(p => {
            const statusClass = p.status === 'conferida' ? 'badge-success' : 'badge-warning';
            const statusText = p.status === 'conferida' ? 'Conferida' : 'Pendente';
            return `
            <tr>
                <td>${p.invoiceNumber || '-'}</td>
                <td>${p.issueDate ? new Date(p.issueDate).toLocaleDateString('pt-BR') : '-'}</td>
                <td>${p.supplierName || '-'}</td>
                <td class="text-center">${p.items?.length || 0}</td>
                <td class="text-center fw-bold">R$ ${(p.total || 0).toFixed(2)}</td>
                <td class="text-center"><span class="badge ${statusClass}">${statusText}</span></td>
                <td class="actions">
                    <button class="btn-view" onclick="viewPurchase('${p.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-edit" onclick="editPurchase('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deletePurchase('${p.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `}).join('');
        
    } catch (error) {
        console.error('Erro ao carregar tabela de compras:', error);
    }
}

async function loadPurchaseSuppliers() {
    try {
        const suppliers = await window.electronAPI.getSuppliers() || [];
        const sel = document.getElementById('purchase-supplier');
        if (sel) {
            sel.innerHTML = '<option value="">Selecione o fornecedor...</option>' +
                suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    } catch (e) { console.error('Erro ao carregar fornecedores:', e); }
}

async function loadPurchaseParts() {
    try {
        const parts = await window.electronAPI.getParts() || [];
        const sel = document.getElementById('purchase-item-part');
        if (sel) {
            sel.innerHTML = '<option value="">Selecione uma peça...</option>' +
                parts.map(p => `<option value="${p.id}">${p.name} (Cód: ${p.code || '-'})</option>`).join('');
        }
    } catch (e) { console.error('Erro ao carregar peças:', e); }
}

function showPurchaseModal(id = null) {
    const modal = document.getElementById('purchase-modal');
    if (!modal) return;
    
    document.getElementById('purchase-form').reset();
    document.getElementById('purchase-id').value = '';
    currentPurchaseItems = [];
    
    modal.style.display = 'flex';
    
    loadPurchaseSuppliers();
    loadPurchaseParts();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('purchase-issue-date').value = today;
    document.getElementById('purchase-arrival-date').value = today;
    document.getElementById('purchase-entry-date').value = today;
    document.getElementById('purchase-due-date').value = today;
    
    if (id) {
        window.electronAPI.getPurchases().then(purchases => {
            const purchase = purchases.find(p => p.id === id);
            if (purchase) {
                document.getElementById('purchase-id').value = purchase.id;
                document.getElementById('purchase-invoice').value = purchase.invoiceNumber || '';
                document.getElementById('purchase-series').value = purchase.series || '1';
                document.getElementById('purchase-model').value = purchase.model || '55';
                document.getElementById('purchase-issue-date').value = purchase.issueDate?.split('T')[0] || today;
                document.getElementById('purchase-arrival-date').value = purchase.arrivalDate?.split('T')[0] || today;
                document.getElementById('purchase-entry-date').value = purchase.entryDate?.split('T')[0] || today;
                document.getElementById('purchase-supplier').value = purchase.supplierId || '';
                document.getElementById('purchase-cfop').value = purchase.cfop || '5405';
                document.getElementById('purchase-freight').value = purchase.freight || 0;
                document.getElementById('purchase-insurance').value = purchase.insurance || 0;
                document.getElementById('purchase-discount').value = purchase.discount || 0;
                document.getElementById('purchase-other-expenses').value = purchase.otherExpenses || 0;
                document.getElementById('purchase-payment-method').value = purchase.paymentMethod || 'dinheiro';
                document.getElementById('purchase-installments').value = purchase.installments || 1;
                document.getElementById('purchase-due-date').value = purchase.dueDate?.split('T')[0] || today;
                document.getElementById('purchase-notes').value = purchase.notes || '';
                
                if (purchase.items) {
                    currentPurchaseItems = [...purchase.items];
                    updatePurchaseItemsTable();
                    calculatePurchaseTotals();
                }
            }
        });
    } else {
        updatePurchaseItemsTable();
        calculatePurchaseTotals();
    }
}

function closePurchaseModal() {
    document.getElementById('purchase-modal').style.display = 'none';
}

function addPurchaseItem() {
    const partSelect = document.getElementById('purchase-item-part');
    const newPartName = document.getElementById('purchase-new-part')?.value?.trim();
    const qty = parseInt(document.getElementById('purchase-item-qty').value) || 1;
    const price = parseFloat(document.getElementById('purchase-item-price').value) || 0;
    const ipiPercent = parseFloat(document.getElementById('purchase-item-ipi').value) || 0;
    const ncm = document.getElementById('purchase-item-ncm')?.value || '';
    const cfop = document.getElementById('purchase-item-cfop')?.value || '5405';
    const isBonus = document.getElementById('purchase-item-bonus')?.checked || false;
    
    let partId = partSelect?.value || null;
    let partName = '';
    
    if (partId) {
        const opt = partSelect.options[partSelect.selectedIndex];
        partName = opt.text.split(' (Cód:')[0].trim();
        
        const existingIndex = currentPurchaseItems.findIndex(i => i.partId === partId);
        if (existingIndex >= 0) {
            showNotification('❌ Este item já foi adicionado!', 'warning');
            return;
        }
    } else if (newPartName) {
        partName = newPartName;
        partId = null;
        
        const existingIndex = currentPurchaseItems.findIndex(i => 
            i.partName?.toLowerCase() === partName.toLowerCase()
        );
        if (existingIndex >= 0) {
            showNotification('❌ Este item já foi adicionado!', 'warning');
            return;
        }
    } else {
        showNotification('❌ Selecione uma peça ou informe um novo produto', 'warning');
        return;
    }
    
    if (!isBonus && price <= 0) {
        showNotification('❌ Informe o preço unitário', 'warning');
        return;
    }
    
    currentPurchaseItems.push({
        partId,
        partName,
        quantity: qty,
        unitPrice: price,
        total: qty * price,
        ipiPercent,
        ncm,
        cfop,
        isBonus,
        isNew: !partId
    });
    
    updatePurchaseItemsTable();
    calculatePurchaseTotals();
    
    if (partSelect) partSelect.value = '';
    document.getElementById('purchase-new-part').value = '';
    document.getElementById('purchase-item-qty').value = '1';
    document.getElementById('purchase-item-price').value = '';
    document.getElementById('purchase-item-ipi').value = '0';
    document.getElementById('purchase-item-ncm').value = '';
    document.getElementById('purchase-item-bonus').checked = false;
    
    showNotification('✅ Item adicionado!', 'success');
}

function removePurchaseItem(idx) {
    currentPurchaseItems.splice(idx, 1);
    updatePurchaseItemsTable();
    calculatePurchaseTotals();
}

function updatePurchaseItemsTable() {
    const tbody = document.getElementById('purchase-items-body');
    if (!tbody) return;
    
    if (!currentPurchaseItems.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhum item adicionado</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentPurchaseItems.map((item, idx) => {
        let rowStyle = '';
        if (item.isBonus) {
            rowStyle = 'style="background-color: #d4edda;"';
        } else if (item.isNew) {
            rowStyle = 'style="background-color: #e3f2fd; border-left: 4px solid #2196f3;"';
        }
        
        const newBadge = item.isNew ? ' <span class="badge badge-info" style="background:#2196f3;color:white;">NOVA</span>' : '';
        
        return `
        <tr ${rowStyle}>
            <td>${item.partName}${newBadge} ${item.isBonus ? '<span class="badge badge-success">BONIFICAÇÃO</span>' : ''}</td>
            <td>${item.ncm || '-'}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-center">${item.isBonus ? 'R$ 0,00' : `R$ ${(item.unitPrice || 0).toFixed(2)}`}</td>
            <td class="text-center">${item.ipiPercent || 0}%</td>
            <td class="text-center fw-bold">R$ ${(item.total || 0).toFixed(2)}</td>
            <td class="text-center">
                <button onclick="removePurchaseItem(${idx})" class="btn-delete btn-small"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

function calculatePurchaseTotals() {
    const productsTotal = currentPurchaseItems.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return sum + (qty * price);
    }, 0);
    
    const freight = parseFloat(document.getElementById('purchase-freight')?.value) || 0;
    const insurance = parseFloat(document.getElementById('purchase-insurance')?.value) || 0;
    const discount = parseFloat(document.getElementById('purchase-discount')?.value) || 0;
    const otherExpenses = parseFloat(document.getElementById('purchase-other-expenses')?.value) || 0;
    
    const total = productsTotal + freight + insurance + otherExpenses - discount;
    
    const productsTotalEl = document.getElementById('purchase-products-total');
    const totalEl = document.getElementById('purchase-total');
    
    if (productsTotalEl) productsTotalEl.value = productsTotal.toFixed(2);
    if (totalEl) totalEl.value = total.toFixed(2);
}

async function savePurchaseFromModal() {
    const invoiceNumber = document.getElementById('purchase-invoice')?.value?.trim();
    const supplierId = document.getElementById('purchase-supplier')?.value;
    
    if (!invoiceNumber) { showNotification('Informe o número da nota fiscal', 'error'); return; }
    if (!supplierId) { showNotification('Selecione um fornecedor', 'error'); return; }
    if (!currentPurchaseItems || currentPurchaseItems.length === 0) { showNotification('Adicione pelo menos um item', 'error'); return; }
    
    showNotification('Salvando compra...', 'info');
    
    try {
        let supplierName = '';
        try {
            const suppliers = await window.electronAPI.getSuppliers();
            supplierName = suppliers.find(s => s.id === supplierId)?.name || '';
        } catch (e) {}
        
        const cleanItems = currentPurchaseItems.map(item => ({
            partId: item.partId || null,
            partName: (item.partName || '').trim(),
            partCode: item.partCode || item.code || '',
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice || item.price || 0),
            total: Number(item.total || (Number(item.quantity) * Number(item.unitPrice || item.price || 0))),
            ncm: item.ncm || '',
            cfop: item.cfop || '5405',
            isBonus: item.isBonus || false,
            isNew: item.isNew || false
        }));
        
        const productsTotal = cleanItems.reduce((s, i) => s + i.total, 0);
        const freight = parseFloat(document.getElementById('purchase-freight')?.value) || 0;
        const insurance = parseFloat(document.getElementById('purchase-insurance')?.value) || 0;
        const discount = parseFloat(document.getElementById('purchase-discount')?.value) || 0;
        const otherExpenses = parseFloat(document.getElementById('purchase-other-expenses')?.value) || 0;
        const total = productsTotal + freight + insurance + otherExpenses - discount;
        
        const purchaseData = {
            id: document.getElementById('purchase-id')?.value || null,
            invoiceNumber,
            series: document.getElementById('purchase-series')?.value || '1',
            model: document.getElementById('purchase-model')?.value || '55',
            issueDate: document.getElementById('purchase-issue-date')?.value || new Date().toISOString().split('T')[0],
            arrivalDate: document.getElementById('purchase-arrival-date')?.value || new Date().toISOString().split('T')[0],
            entryDate: document.getElementById('purchase-entry-date')?.value || new Date().toISOString().split('T')[0],
            supplierId, supplierName,
            cfop: document.getElementById('purchase-cfop')?.value || '5405',
            freight, insurance, discount, otherExpenses,
            productsTotal, total,
            paymentMethod: document.getElementById('purchase-payment-method')?.value || 'dinheiro',
            installments: parseInt(document.getElementById('purchase-installments')?.value) || 1,
            dueDate: document.getElementById('purchase-due-date')?.value || new Date().toISOString().split('T')[0],
            notes: document.getElementById('purchase-notes')?.value || '',
            items: cleanItems,
            status: 'pendente',
            date: new Date().toISOString()
        };
        
        const result = await window.electronAPI.savePurchase(purchaseData);
        
        if (!result || !result.success) throw new Error(result?.error || 'Erro ao salvar');
        
        showNotification(`✅ Compra NF-e ${invoiceNumber} registrada! Total: R$ ${total.toFixed(2)}`, 'success');
        closePurchaseModal();
        dataCache.delete('parts');
        dataCache.delete('purchases');
        await Promise.all([loadPurchases(), loadStock(), loadParts(), loadDashboard()]);
        
    } catch (error) {
        console.error('❌', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

async function viewPurchase(id) {
    try {
        const purchases = await window.electronAPI.getPurchases();
        const purchase = purchases.find(p => p.id === id);
        if (!purchase) { showNotification('Compra não encontrada', 'error'); return; }
        
        const itemsHtml = purchase.items.map(i => `
            <tr>
                <td>${i.partName}</td>
                <td class="text-center">${i.quantity}</td>
                <td class="text-center">R$ ${(i.unitPrice || 0).toFixed(2)}</td>
                <td class="text-center">R$ ${(i.total || 0).toFixed(2)}</td>
            </tr>
        `).join('');
        
        const body = `
            <div style="line-height:2;">
                <strong>NFe:</strong> ${purchase.invoiceNumber}<br>
                <strong>Fornecedor:</strong> ${purchase.supplierName}<br>
                <strong>Data Emissão:</strong> ${new Date(purchase.issueDate).toLocaleDateString('pt-BR')}<br>
                <strong>Total:</strong> R$ ${(purchase.total || 0).toFixed(2)}<br>
            </div>
            <table style="margin-top:15px;width:100%;">
                <thead><tr><th>Item</th><th>Qtd</th><th>Preço</th><th>Total</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
        `;
        
        showGenericModal(`Compra NFe ${purchase.invoiceNumber}`, body, [
            { label: 'Editar', className: 'btn-primary', onClick: () => { closeModal(); editPurchase(id); } },
            { label: 'Fechar', className: 'btn-secondary', onClick: () => closeModal() }
        ]);
    } catch (error) {
        console.error(error);
        showNotification('Erro ao visualizar', 'error');
    }
}

async function editPurchase(id) {
    showPurchaseModal(id);
}

async function deletePurchase(id) {
    confirmAction('Excluir esta compra? O estoque NÃO será alterado.', async () => {
        try {
            const result = await window.electronAPI.deletePurchase(id);
            if (result?.success) {
                showNotification('Compra excluída!', 'success');
                await loadPurchases();
            } else {
                showNotification('Erro ao excluir compra', 'error');
            }
        } catch (error) {
            console.error(error);
            showNotification('Erro ao excluir compra', 'error');
        }
    });
}

async function importXML() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        showNotification('📦 Processando XML...', 'info');
        
        try {
            const text = await file.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');
            
            const nfe = xmlDoc.getElementsByTagName('NFe')[0] || xmlDoc.getElementsByTagName('nfeProc')[0];
            if (!nfe) {
                showNotification('❌ XML inválido - Não é uma NF-e', 'error');
                return;
            }
            
            const infNFe = nfe.getElementsByTagName('infNFe')[0] || nfe;
            const ide = infNFe.getElementsByTagName('ide')[0] || infNFe;
            const emit = infNFe.getElementsByTagName('emit')[0] || infNFe;
            const total = infNFe.getElementsByTagName('total')[0] || infNFe;
            const ICMSTot = total?.getElementsByTagName('ICMSTot')[0] || total;
            const det = infNFe.getElementsByTagName('det');
            
            const nfeNumber = ide?.getElementsByTagName('nNF')[0]?.textContent || '';
            const series = ide?.getElementsByTagName('serie')[0]?.textContent || '1';
            const dhEmi = ide?.getElementsByTagName('dhEmi')[0]?.textContent || '';
            const dEmi = ide?.getElementsByTagName('dEmi')[0]?.textContent || '';
            const issueDate = dhEmi.split('T')[0] || dEmi || new Date().toISOString().split('T')[0];
            
            const cnpjEmit = emit?.getElementsByTagName('CNPJ')[0]?.textContent || '';
            const supplierName = emit?.getElementsByTagName('xNome')[0]?.textContent || '';
            const supplierFantasia = emit?.getElementsByTagName('xFant')[0]?.textContent || '';
            
            const vFrete = parseFloat(ICMSTot?.getElementsByTagName('vFrete')[0]?.textContent || '0');
            const vSeg = parseFloat(ICMSTot?.getElementsByTagName('vSeg')[0]?.textContent || '0');
            const vDesc = parseFloat(ICMSTot?.getElementsByTagName('vDesc')[0]?.textContent || '0');
            const vProd = parseFloat(ICMSTot?.getElementsByTagName('vProd')[0]?.textContent || '0');
            const vNF = parseFloat(ICMSTot?.getElementsByTagName('vNF')[0]?.textContent || '0');
            
            const items = [];
            const existingParts = await window.electronAPI.getParts();
            
            for (let i = 0; i < det.length; i++) {
                const item = det[i];
                const prod = item.getElementsByTagName('prod')[0];
                if (!prod) continue;
                
                const cProd = prod.getElementsByTagName('cProd')[0]?.textContent || '';
                const xProd = prod.getElementsByTagName('xProd')[0]?.textContent || '';
                const NCM = prod.getElementsByTagName('NCM')[0]?.textContent || '';
                const CFOP = prod.getElementsByTagName('CFOP')[0]?.textContent || '5405';
                const qCom = parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '1');
                const vUnCom = parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || '0');
                const vProdItem = parseFloat(prod.getElementsByTagName('vProd')[0]?.textContent || '0');
                
                const existingPart = existingParts.find(p => 
                    (p.code && cProd && p.code === cProd) || 
                    (xProd && p.name?.toLowerCase() === xProd.toLowerCase())
                );
                
                items.push({
                    partId: existingPart?.id || null,
                    partName: xProd.trim(),
                    partCode: cProd || '',
                    quantity: qCom > 0 ? qCom : 1,
                    unitPrice: vUnCom,
                    total: vProdItem || (qCom * vUnCom),
                    ncm: NCM || '',
                    cfop: CFOP || '5405',
                    isBonus: vUnCom <= 0.01,
                    isNew: !existingPart
                });
            }
            
            let supplierId = null;
            if (cnpjEmit) {
                const cleanCnpj = cnpjEmit.replace(/\D/g, '');
                const suppliers = await window.electronAPI.getSuppliers();
                const supplierMatch = suppliers.find(s => {
                    const supplierCnpj = (s.document || '').replace(/\D/g, '');
                    return supplierCnpj === cleanCnpj;
                });
                if (supplierMatch) supplierId = supplierMatch.id;
            }
            
            // Abrir modal de compra com dados preenchidos
            showPurchaseModal();
            
            setTimeout(() => {
                document.getElementById('purchase-invoice').value = nfeNumber;
                document.getElementById('purchase-series').value = series;
                document.getElementById('purchase-issue-date').value = issueDate;
                document.getElementById('purchase-arrival-date').value = new Date().toISOString().split('T')[0];
                document.getElementById('purchase-entry-date').value = new Date().toISOString().split('T')[0];
                document.getElementById('purchase-freight').value = vFrete.toFixed(2);
                document.getElementById('purchase-insurance').value = vSeg.toFixed(2);
                document.getElementById('purchase-discount').value = vDesc.toFixed(2);
                
                if (supplierId) {
                    document.getElementById('purchase-supplier').value = supplierId;
                }
                
                currentPurchaseItems = items;
                updatePurchaseItemsTable();
                calculatePurchaseTotals();
                
                showNotification(`✅ ${items.length} itens importados da NF-e ${nfeNumber}!`, 'success');
            }, 300);
            
        } catch (error) {
            console.error('Erro ao processar XML:', error);
            showNotification('❌ Erro ao processar arquivo XML: ' + error.message, 'error');
        }
    };
    input.click();
}

// ============ FINANCEIRO (DESPESAS) ==========
async function loadFinancialData() {
    try {
        const expenses = await window.electronAPI.getExpenses ? await window.electronAPI.getExpenses() : [];
        const sales = await window.electronAPI.getSales();
        const parts = await window.electronAPI.getParts();
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        const monthSales = sales.filter(s => {
            const date = new Date(s.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        let costOfGoodsSold = 0;
        monthSales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    const part = parts.find(p => p.id === item.partId);
                    if (part) {
                        costOfGoodsSold += (part.cost || 0) * (item.quantity || 0);
                    }
                });
            }
        });
        
        const totalExpenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalSales = monthSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const profit = totalSales - costOfGoodsSold - totalExpenses;
        const margin = totalSales > 0 ? (profit / totalSales) * 100 : 0;
        
        document.getElementById('monthly-expenses').textContent = `R$ ${totalExpenses.toFixed(2)}`;
        document.getElementById('monthly-sales').textContent = `R$ ${totalSales.toFixed(2)}`;
        document.getElementById('monthly-profit').textContent = `R$ ${profit.toFixed(2)}`;
        document.getElementById('monthly-margin').textContent = `${margin.toFixed(1)}%`;
        
        await loadExpensesTable();
        
    } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
    }
}

async function loadExpensesTable(search = '') {
    try {
        const expenses = await window.electronAPI.getExpenses ? await window.electronAPI.getExpenses() : [];
        const tbody = document.getElementById('expenses-table-body');
        if (!tbody) return;
        
        let filtered = expenses || [];
        if (search) {
            const term = search.toLowerCase();
            filtered = filtered.filter(e => 
                (e.description || '').toLowerCase().includes(term) ||
                (e.category || '').toLowerCase().includes(term)
            );
        }
        
        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhuma despesa registrada</td></tr>';
            return;
        }
        
        const categoryNames = {
            aluguel: 'Aluguel', energia: 'Energia Elétrica', agua: 'Água',
            internet: 'Internet/Telefone', salarios: 'Salários', impostos: 'Impostos',
            material_escritorio: 'Material de Escritório', marketing: 'Marketing',
            manutencao: 'Manutenção', outros: 'Outros'
        };
        
        const statusMap = {
            pendente: 'badge-warning Pendente',
            pago: 'badge-success Pago',
            atrasado: 'badge-danger Atrasado'
        };
        
        tbody.innerHTML = filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => {
            const statusInfo = (statusMap[e.status] || 'badge-warning Pendente').split(' ');
            const statusClass = statusInfo[0];
            const statusText = statusInfo[1];
            return `
            <tr>
                <td>${new Date(e.date).toLocaleDateString('pt-BR')}</td>
                <td>${categoryNames[e.category] || e.category || '-'}</td>
                <td>${e.description || '-'}</td>
                <td class="text-center fw-bold">R$ ${(e.amount || 0).toFixed(2)}</td>
                <td>${e.dueDate ? new Date(e.dueDate).toLocaleDateString('pt-BR') : '-'}</td>
                <td class="text-center"><span class="badge ${statusClass}">${statusText}</span></td>
                <td class="actions">
                    <button class="btn-edit" onclick="editExpense('${e.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteExpense('${e.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `}).join('');
        
    } catch (error) {
        console.error('Erro ao carregar despesas:', error);
    }
}

function showExpenseModal(id = null) {
    const modal = document.getElementById('expense-modal');
    if (!modal) return;
    
    document.getElementById('expense-form').reset();
    document.getElementById('expense-id').value = '';
    
    modal.style.display = 'flex';
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    
    if (id) {
        window.electronAPI.getExpenses().then(expenses => {
            const expense = expenses.find(e => e.id === id);
            if (expense) {
                document.getElementById('expense-id').value = expense.id;
                document.getElementById('expense-date').value = expense.date?.split('T')[0] || '';
                document.getElementById('expense-category').value = expense.category || '';
                document.getElementById('expense-description').value = expense.description || '';
                document.getElementById('expense-amount').value = expense.amount || 0;
                document.getElementById('expense-payment-method').value = expense.paymentMethod || 'dinheiro';
                document.getElementById('expense-due-date').value = expense.dueDate?.split('T')[0] || '';
                document.getElementById('expense-status').value = expense.status || 'pendente';
                document.getElementById('expense-notes').value = expense.notes || '';
            }
        });
    }
}

function closeExpenseModal() {
    document.getElementById('expense-modal').style.display = 'none';
}

async function saveExpenseFromModal() {
    const data = {
        id: document.getElementById('expense-id').value || null,
        date: document.getElementById('expense-date').value,
        category: document.getElementById('expense-category').value,
        description: document.getElementById('expense-description').value,
        amount: parseFloat(document.getElementById('expense-amount').value) || 0,
        paymentMethod: document.getElementById('expense-payment-method').value,
        dueDate: document.getElementById('expense-due-date').value,
        status: document.getElementById('expense-status').value,
        notes: document.getElementById('expense-notes').value
    };
    
    if (!data.category) { showNotification('Selecione uma categoria', 'error'); return; }
    if (!data.description) { showNotification('Informe a descrição', 'error'); return; }
    if (data.amount <= 0) { showNotification('Valor deve ser maior que zero', 'error'); return; }
    
    try {
        const result = await window.electronAPI.saveExpense(data);
        
        if (result.success) {
            showNotification('Despesa salva com sucesso!', 'success');
            closeExpenseModal();
            await loadFinancialData();
        } else {
            showNotification('Erro ao salvar despesa', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar despesa:', error);
        showNotification('Erro ao salvar despesa', 'error');
    }
}

async function editExpense(id) {
    showExpenseModal(id);
}

async function deleteExpense(id) {
    confirmAction('Excluir esta despesa?', async () => {
        try {
            const result = await window.electronAPI.deleteExpense(id);
            if (result?.success) {
                showNotification('Despesa excluída!', 'success');
                await loadFinancialData();
            } else {
                showNotification('Erro ao excluir despesa', 'error');
            }
        } catch (error) {
            console.error(error);
            showNotification('Erro ao excluir despesa', 'error');
        }
    });
}

async function filterFinancialData() {
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;
    
    if (!startDate || !endDate) {
        showNotification('Selecione as datas inicial e final', 'warning');
        return;
    }
    
    try {
        const expenses = await window.electronAPI.getExpenses ? await window.electronAPI.getExpenses() : [];
        const sales = await window.electronAPI.getSales();
        const parts = await window.electronAPI.getParts();
        
        const filteredExpenses = expenses.filter(e => {
            const date = e.date?.split('T')[0];
            return date >= startDate && date <= endDate;
        });
        
        const filteredSales = sales.filter(s => {
            const date = s.date?.split('T')[0];
            return date >= startDate && date <= endDate;
        });
        
        let costOfGoodsSold = 0;
        filteredSales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    const part = parts.find(p => p.id === item.partId);
                    if (part) {
                        costOfGoodsSold += (part.cost || 0) * (item.quantity || 0);
                    }
                });
            }
        });
        
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const result = totalRevenue - costOfGoodsSold - totalExpenses;
        
        document.getElementById('filtered-expenses').textContent = `R$ ${totalExpenses.toFixed(2)}`;
        document.getElementById('filtered-revenue').textContent = `R$ ${totalRevenue.toFixed(2)}`;
        document.getElementById('filtered-purchases').textContent = `R$ ${costOfGoodsSold.toFixed(2)}`;
        document.getElementById('filtered-result').textContent = `R$ ${result.toFixed(2)}`;
        
        document.getElementById('filtered-results').style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao filtrar:', error);
    }
}

async function clearFinancialFilter() {
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    document.getElementById('filtered-results').style.display = 'none';
    await loadFinancialData();
}

async function exportFinancialReport() {
    try {
        const expenses = await window.electronAPI.getExpenses ? await window.electronAPI.getExpenses() : [];
        const sales = await window.electronAPI.getSales();
        const parts = await window.electronAPI.getParts();
        
        const data = [];
        data.push(['RELATÓRIO FINANCEIRO - SMART TECH REPARO']);
        data.push(['Gerado em:', new Date().toLocaleString('pt-BR')]);
        data.push([]);
        
        let costOfGoodsSold = 0;
        sales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    const part = parts.find(p => p.id === item.partId);
                    if (part) {
                        costOfGoodsSold += (part.cost || 0) * (item.quantity || 0);
                    }
                });
            }
        });
        
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
        const profit = totalSales - costOfGoodsSold - totalExpenses;
        
        data.push(['RESUMO GERAL']);
        data.push(['Total em Vendas:', `R$ ${totalSales.toFixed(2)}`]);
        data.push(['Custo das Mercadorias:', `R$ ${costOfGoodsSold.toFixed(2)}`]);
        data.push(['Total em Despesas:', `R$ ${totalExpenses.toFixed(2)}`]);
        data.push(['Lucro Líquido:', `R$ ${profit.toFixed(2)}`]);
        
        exportToExcel(data, 'relatorio_financeiro');
        showNotification('Relatório exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar:', error);
        showNotification('Erro ao exportar relatório', 'error');
    }
}

// ============ IMPRESSÃO ==========
async function printSale(id) {
    try {
        const sales = await window.electronAPI.getSales();
        const sale = sales.find(s => s.id === id);
        if (!sale) { showNotification('Venda não encontrada', 'error'); return; }
        
        const clients = await window.electronAPI.getClients();
        const client = clients.find(c => c.id === sale.client_id);
        const clientName = client ? client.name : (sale.client_id ? 'Cliente #' + sale.client_id.substring(0, 8) : 'Consumidor Final');
        const clientPhone = client ? client.phone : '';
        const clientDoc = client ? client.document : '';
        
        const itemsSubtotal = (sale.items || []).reduce((sum, i) => sum + (i.subtotal || 0), 0);
        const labor = sale.labor || 0;
        const discount = sale.discount || 0;
        const total = sale.total || 0;
        const paymentDesc = sale.payment_description || 'À vista';
        const isPaid = sale.payment_status === 'paid';
        
        // Formatar telefone
        let phoneFormatted = '';
        if (clientPhone) {
            const digits = clientPhone.replace(/\D/g, '');
            if (digits.length === 11) phoneFormatted = `(${digits.substring(0,2)}) ${digits.substring(2,7)}-${digits.substring(7)}`;
            else if (digits.length === 10) phoneFormatted = `(${digits.substring(0,2)}) ${digits.substring(2,6)}-${digits.substring(6)}`;
            else phoneFormatted = clientPhone;
        }
        
        // Formatar documento
        let docFormatted = '';
        let docLabel = '';
        if (clientDoc) {
            const digits = clientDoc.replace(/\D/g, '');
            if (digits.length === 11) {
                docFormatted = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                docLabel = 'CPF';
            } else if (digits.length === 14) {
                docFormatted = digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                docLabel = 'CNPJ';
            }
        }
        
        const win = window.open('', '_blank', 'width=800,height=600');
        
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Recibo de Venda #${sale.sale_number}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .company-name { font-size: 22px; font-weight: bold; }
                    .company-info { font-size: 12px; color: #666; margin-top: 3px; }
                    .title { font-size: 16px; font-weight: bold; margin: 10px 0; text-align: center; }
                    .info-section { margin: 15px 0; }
                    .info-row { margin: 5px 0; font-size: 14px; }
                    .info-label { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th { background: #f0f0f0; padding: 8px; text-align: left; border: 1px solid #ccc; font-size: 12px; }
                    td { padding: 8px; border: 1px solid #ccc; font-size: 13px; }
                    .text-center { text-align: center; }
                    .total-section { margin-top: 15px; text-align: right; }
                    .total-row { margin: 5px 0; font-size: 14px; }
                    .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
                    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; }
                    .status-paid { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                    .status-pending { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
                    .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
                    @media print {
                        .no-print { display: none; }
                        body { margin: 10px; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">Smart Tech Reparo</div>
                    <div class="company-info">CNPJ: 65.949.103/0001-48 | (16) 99716-6263</div>
                    <div class="title">RECIBO DE VENDA</div>
                    <div class="company-info">Nº: ${sale.sale_number} | ${sale.date ? new Date(sale.date).toLocaleDateString('pt-BR') : '-'}</div>
                </div>
                
                <div class="info-section">
                    <div class="info-row"><span class="info-label">Cliente:</span> ${clientName}</div>
                    ${phoneFormatted ? `<div class="info-row"><span class="info-label">Telefone:</span> ${phoneFormatted}</div>` : ''}
                    ${docFormatted ? `<div class="info-row"><span class="info-label">${docLabel}:</span> ${docFormatted}</div>` : ''}
                    <div class="info-row"><span class="info-label">Data:</span> ${sale.date ? new Date(sale.date).toLocaleString('pt-BR') : '-'}</div>
                    <div class="info-row"><span class="info-label">Pagamento:</span> ${paymentDesc}</div>
                    <div class="info-row"><span class="info-label">Status:</span> <span class="status-badge ${isPaid ? 'status-paid' : 'status-pending'}">${isPaid ? 'PAGO' : 'PENDENTE'}</span></div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th class="text-center">Qtd</th>
                            <th class="text-center">Preço Unit.</th>
                            <th class="text-center">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(sale.items || []).map(i => `
                            <tr>
                                <td>${i.name || 'Item'}</td>
                                <td class="text-center">${i.quantity}</td>
                                <td class="text-center">R$ ${(i.price || 0).toFixed(2)}</td>
                                <td class="text-center">R$ ${(i.subtotal || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total-section">
                    <div class="total-row">Subtotal (Peças): R$ ${itemsSubtotal.toFixed(2)}</div>
                    ${labor > 0 ? `<div class="total-row">Mão de obra: R$ ${labor.toFixed(2)}</div>` : ''}
                    ${discount > 0 ? `<div class="total-row">Desconto: - R$ ${discount.toFixed(2)}</div>` : ''}
                    <div class="total-final">TOTAL: R$ ${total.toFixed(2)}</div>
                </div>
                
                <div class="footer">
                    Smart Tech Reparo - CNPJ: 65.949.103/0001-48 | (16) 99716-6263<br>
                    Emitido em: ${new Date().toLocaleString('pt-BR')}<br>
                    Obrigado pela preferência!
                </div>
                
                <div class="no-print" style="text-align:center;margin-top:20px;">
                    <button onclick="window.print()" style="padding:10px 30px;background:#007bff;color:white;border:none;border-radius:5px;cursor:pointer;font-size:14px;">🖨️ Imprimir</button>
                    <button onclick="window.close()" style="padding:10px 30px;background:#6c757d;color:white;border:none;border-radius:5px;cursor:pointer;font-size:14px;margin-left:10px;">Fechar</button>
                </div>
                
                <script>window.onload = () => setTimeout(() => window.print(), 300);<\/script>
            </body>
            </html>
        `);
        win.document.close();
    } catch (error) { 
        console.error(error); 
        showNotification('Erro ao gerar recibo', 'error'); 
    }
}

async function printService(id) {
    try {
        const services = await window.electronAPI.getServices();
        const service = services.find(s => s.id === id);
        if (!service) { showNotification('Serviço não encontrado', 'error'); return; }
        
        const clients = await window.electronAPI.getClients();
        // 🔧 CORREÇÃO: Buscar por client_id (snake_case)
        const client = clients.find(c => c.id === service.client_id);
        const clientName = client ? client.name : (service.client_id ? 'Cliente #' + service.client_id.substring(0, 8) : '-');
        const clientPhone = client ? client.phone : '';
        
        const partsTotal = (service.parts || []).reduce((s, p) => s + (p.subtotal || 0), 0);
        const total = (service.value || 0) + partsTotal;
        
        // Formatar telefone
        let phoneFormatted = '';
        if (clientPhone) {
            const digits = clientPhone.replace(/\D/g, '');
            if (digits.length === 11) phoneFormatted = `(${digits.substring(0,2)}) ${digits.substring(2,7)}-${digits.substring(7)}`;
            else if (digits.length === 10) phoneFormatted = `(${digits.substring(0,2)}) ${digits.substring(2,6)}-${digits.substring(6)}`;
            else phoneFormatted = clientPhone;
        }
        
        const win = window.open('', '_blank', 'width=800,height=600');
        
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Orçamento #${service.service_number || service.id.substring(0, 6)}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .company-name { font-size: 22px; font-weight: bold; }
                    .company-info { font-size: 12px; color: #666; margin-top: 3px; }
                    .title { font-size: 16px; font-weight: bold; margin: 10px 0; text-align: center; }
                    .info-section { margin: 15px 0; }
                    .info-row { margin: 5px 0; font-size: 14px; }
                    .info-label { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th { background: #f0f0f0; padding: 8px; text-align: left; border: 1px solid #ccc; font-size: 12px; }
                    td { padding: 8px; border: 1px solid #ccc; font-size: 13px; }
                    .text-center { text-align: center; }
                    .total-section { margin-top: 15px; text-align: right; }
                    .total-row { margin: 5px 0; font-size: 14px; }
                    .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
                    .terms { margin-top: 25px; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; }
                    .terms ol { margin-left: 20px; }
                    .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
                    @media print {
                        .no-print { display: none; }
                        body { margin: 10px; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">Smart Tech Reparo</div>
                    <div class="company-info">CNPJ: 65.949.103/0001-48 | (16) 99716-6263</div>
                    <div class="title">ORÇAMENTO DE SERVIÇO</div>
                    <div class="company-info">Nº: ${service.service_number || service.id.substring(0, 6)} | ${new Date().toLocaleDateString('pt-BR')}</div>
                </div>
                
                <div class="info-section">
                    <div class="info-row"><span class="info-label">Cliente:</span> ${clientName}</div>
                    ${phoneFormatted ? `<div class="info-row"><span class="info-label">Telefone:</span> ${phoneFormatted}</div>` : ''}
                    <div class="info-row"><span class="info-label">Equipamento:</span> ${service.equipment || '-'}</div>
                    <div class="info-row"><span class="info-label">Status:</span> ${getServiceStatusName(service.status)}</div>
                </div>
                
                ${service.parts && service.parts.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Peça</th>
                            <th class="text-center">Qtd</th>
                            <th class="text-center">Preço Unit.</th>
                            <th class="text-center">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${service.parts.map(p => `
                            <tr>
                                <td>${p.name || '-'}</td>
                                <td class="text-center">${p.quantity}</td>
                                <td class="text-center">R$ ${(p.price || 0).toFixed(2)}</td>
                                <td class="text-center">R$ ${(p.subtotal || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}
                
                <div class="info-section">
                    <div class="info-row"><span class="info-label">Problema:</span> ${service.problem || '-'}</div>
                    ${service.solution ? `<div class="info-row"><span class="info-label">Solução:</span> ${service.solution}</div>` : ''}
                    ${service.notes ? `<div class="info-row"><span class="info-label">Observações:</span> ${service.notes}</div>` : ''}
                </div>
                
                <div class="total-section">
                    <div class="total-row">Mão de obra: R$ ${(service.value || 0).toFixed(2)}</div>
                    <div class="total-row">Total peças: R$ ${partsTotal.toFixed(2)}</div>
                    <div class="total-final">Total Geral: R$ ${total.toFixed(2)}</div>
                </div>
                
                <div class="terms">
                    <strong>Termos de Aceite</strong>
                    <ol>
                        <li>Aprovação autoriza início do serviço.</li>
                        <li>Podem surgir outros defeitos - novo orçamento.</li>
                        <li>Garantia sobre serviço/peças.</li>
                        <li>Cliente responsável por backup.</li>
                        <li>Retirada em até 30 dias.</li>
                    </ol>
                </div>
                
                <div class="footer">
                    Smart Tech Reparo - CNPJ: 65.949.103/0001-48 | (16) 99716-6263<br>
                    Emitido em: ${new Date().toLocaleString('pt-BR')}
                </div>
                
                <div class="no-print" style="text-align:center;margin-top:20px;">
                    <button onclick="window.print()" style="padding:10px 30px;background:#007bff;color:white;border:none;border-radius:5px;cursor:pointer;font-size:14px;">🖨️ Imprimir</button>
                    <button onclick="window.close()" style="padding:10px 30px;background:#6c757d;color:white;border:none;border-radius:5px;cursor:pointer;font-size:14px;margin-left:10px;">Fechar</button>
                </div>
                
                <script>window.onload = () => setTimeout(() => window.print(), 300);<\/script>
            </body>
            </html>
        `);
        win.document.close();
    } catch (error) { 
        console.error(error); 
        showNotification('Erro ao imprimir orçamento', 'error'); 
    }
}

// ============ EXPORTS GLOBAIS ==========
window.showTab = showTab;
window.showClientForm = showClientForm;
window.hideClientForm = hideClientForm;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.viewClient = viewClient;
window.showSupplierForm = showSupplierForm;
window.hideSupplierForm = hideSupplierForm;
window.editSupplier = editSupplier;
window.deleteSupplier = deleteSupplier;
window.viewSupplier = viewSupplier;
window.showPartForm = showPartForm;
window.hidePartForm = hidePartForm;
window.editPart = editPart;
window.deletePart = deletePart;
window.showServiceForm = showServiceForm;
window.hideServiceForm = hideServiceForm;
window.editService = editService;
window.deleteService = deleteService;
window.viewService = viewService;
window.convertServiceToSale = convertServiceToSale;
window.showSaleForm = showSaleForm;
window.hideSaleForm = hideSaleForm;
window.startNewSale = startNewSale;
window.addSaleItem = addSaleItem;
window.removeSaleItem = removeSaleItem;
window.cancelSale = cancelSale;
window.viewSale = viewSale;
window.editSale = editSale;
window.printSale = printSale;
window.printService = printService;
window.showStockMovementForm = showStockMovementForm;
window.closeModal = closeModal;
window.showDeleteConfirmationModal = showDeleteConfirmationModal;
window.addServicePart = addServicePart;
window.removeServicePart = removeServicePart;
window.updateServicePartPrice = updateServicePartPrice;
window.updateServicePartSubtotal = updateServicePartSubtotal;
window.setPaymentMode = setPaymentMode;
window.setVistaMethod = setVistaMethod;
window.setFinancedMethod = setFinancedMethod;
window.updateInstallments = updateInstallments;
window.toggleAutoDiscount = toggleAutoDiscount;
window.backupDatabase = backupDatabase;
window.restoreDatabase = restoreDatabase;
window.resetDatabase = resetDatabase;
window.exportClients = exportClients;
window.exportSales = exportSales;
window.sendViaWhatsApp = sendViaWhatsApp;
window.confirmAction = confirmAction;

// Compras (NF-e)
window.loadPurchases = loadPurchases;
window.loadPurchasesTable = loadPurchasesTable;
window.addPurchaseItem = addPurchaseItem;
window.removePurchaseItem = removePurchaseItem;
window.calculatePurchaseTotals = calculatePurchaseTotals;
window.viewPurchase = viewPurchase;
window.editPurchase = editPurchase;
window.deletePurchase = deletePurchase;
window.savePurchaseFromModal = savePurchaseFromModal;
window.importXML = importXML;

// Financeiro (Despesas)
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.filterFinancialData = filterFinancialData;
window.clearFinancialFilter = clearFinancialFilter;
window.exportFinancialReport = exportFinancialReport;

// Modais
window.showPurchaseModal = showPurchaseModal;
window.closePurchaseModal = closePurchaseModal;
window.showExpenseModal = showExpenseModal;
window.closeExpenseModal = closeExpenseModal;
window.saveExpenseFromModal = saveExpenseFromModal;

console.log('🚀 Sistema Smart Tech Reparo inicializado!');
console.log('✅ renderer.js carregado completamente!');
console.log('💳 Cartão de crédito = PAGO | 📄 Boleto = PENDENTE');