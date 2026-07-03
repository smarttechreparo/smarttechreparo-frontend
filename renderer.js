// ============ CONFIGURAÇÃO WEB (VERCEL & RAILWAY) ==========
const API_URL = 'https://smarttechreparo-backend-production.up.railway.app/api';

if (window.api && !window.electronAPI) {
    window.electronAPI = {
        getClients: window.api.clients.getAll,
        saveClient: window.api.clients.save,
        deleteClient: window.api.clients.delete,

        getSuppliers: window.api.suppliers.getAll,
        saveSupplier: window.api.suppliers.save,
        deleteSupplier: window.api.suppliers.delete,

        getParts: window.api.parts.getAll,
        savePart: window.api.parts.save,
        deletePart: window.api.parts.delete
    };
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(json.error || 'Erro na comunicacao com a API.');
    }

    return json;
}

// Ponte de compatibilidade: Transforma chamadas do Electron em requisições HTTP Fetch puras
window.electronAPI = {
    // Clientes
    getClients: async () => {
        const result = await requestJson(`${API_URL}/clients`);
        return result.data || [];
    },
    saveClient: async (client) => {

    const isEdit = !!client.id;

    const url = isEdit
        ? `${API_URL}/clients/${client.id}`
        : `${API_URL}/clients`;

    const method = isEdit
        ? 'PUT'
        : 'POST';

    const body = {
        ...client,

        phone: (client.phone || '').replace(/\D/g, ''),
        document: (client.document || '').replace(/\D/g, ''),
        cep: (client.cep || '').replace(/\D/g, '')
    };

    return requestJson(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

},

    deleteClient: async (id) => requestJson(`${API_URL}/clients/${id}`, {
        method: 'DELETE'
    }),

    // Fornecedores
    getSuppliers: async () => {
        const result = await requestJson(`${API_URL}/suppliers`);
        return result.data || [];
    },
    saveSupplier: async (supplier) => {
        const isEdit = !!supplier.id;
        const url = isEdit
            ? `${API_URL}/suppliers/${supplier.id}`
            : `${API_URL}/suppliers`;

        const body = {
            ...supplier,
            phone: (supplier.phone || '').replace(/\D/g, ''),
            document: (supplier.document || '').replace(/\D/g, '')
        };

        return requestJson(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    },
    deleteSupplier: async (id) => requestJson(`${API_URL}/suppliers/${id}`, {
        method: 'DELETE'
    }),

    // Peças
    getParts: async () => {
    const response = await fetch(`${API_URL}/parts`);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar peças.');
    }

    return result.data || [];
},

    savePart: async (part) => {
    const isEdit = !!part.id;

    const url = isEdit
        ? `${API_URL}/parts/${part.id}`
        : `${API_URL}/parts`;

    const method = isEdit ? 'PUT' : 'POST';

    const body = {
        name: part.name || '',
        code: part.code || '',
        quantity: Number(part.quantity) || 0,
        cost_price: Number(part.cost_price) || 0,
        sale_price: Number(part.sale_price) || 0,
        supplier_id: part.supplier_id || null,
        min_stock: Number(part.min_stock) || 0
    };

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar peça.');
    }

    return result;
},

deletePart: async (id) => {
    const response = await fetch(`${API_URL}/parts/${id}`, {
        method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir peça.');
    }

    return result;
},

    // Serviços
getServices: async () => {
    const response = await fetch(`${API_URL}/services`);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar serviços.');
    }

    return result.data || [];
},

saveService: async (service) => {
    const isEdit = !!service.id;

    const url = isEdit
        ? `${API_URL}/services/${service.id}`
        : `${API_URL}/services`;

    const method = isEdit ? 'PUT' : 'POST';

    const body = {
        client_id: service.client_id || service.clientId || null,
        equipment: service.equipment || service.device_model || '',
        device_model: service.device_model || service.equipment || '',
        device_brand: service.device_brand || '',
        problem: service.problem || '',
        solution: service.solution || '',
        value: Number(service.value) || 0,
        status: service.status || 'orcamento',
        notes: service.notes || '',
        parts: Array.isArray(service.parts) ? service.parts : []
    };

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar serviço.');
    }

    return result;
},

deleteService: async (id) => {
    const response = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir serviço.');
    }

    return result;
},

    // Vendas
getSales: async () => {
    const response = await fetch(`${API_URL}/sales`);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar vendas.');
    }

    return result.data || [];
},

saveSale: async (sale) => {
    const isEdit = !!sale.id;

    const url = isEdit
        ? `${API_URL}/sales/${sale.id}`
        : `${API_URL}/sales`;

    const method = isEdit ? 'PUT' : 'POST';

    const body = {
        client_id: sale.client_id || sale.clientId || null,
        items: Array.isArray(sale.items) ? sale.items : [],
        total_amount: Number(sale.total_amount ?? sale.total ?? 0) || 0,
        discount_amount: Number(sale.discount_amount ?? sale.discount ?? 0) || 0,
        payment_method: sale.payment_method || sale.paymentMethod || 'dinheiro',
        status: sale.status || 'concluida'
    };

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar venda.');
    }

    return result;
},

deleteSale: async (id) => {
    const response = await fetch(`${API_URL}/sales/${id}`, {
        method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir venda.');
    }

    return result;
},

    // Caixa (Cash)
getCashEntries: async () => {
    const result = await requestJson(`${API_URL}/cash`);
    return result.data || [];
},

saveCashEntry: async (entry) => {
    return requestJson(`${API_URL}/cash`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: entry.type || entry.tipo || 'entrada',
            description: entry.description || entry.descricao || 'Movimentação de caixa',
            amount: Number(entry.amount ?? entry.value ?? entry.valor ?? 0) || 0,
            payment_method: entry.payment_method || entry.paymentMethod || 'dinheiro',
            reference_type: entry.reference_type || entry.referenceType || null,
            reference_id: entry.reference_id || entry.referenceId || null
        })
    });
},
    deleteCashEntry: async (id) => {
    return requestJson(`${API_URL}/cash/${id}`, {
        method: 'DELETE'
    });
},

openCash: async (data) => {
    return requestJson(`${API_URL}/cash/open`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            openingBalance: Number(data.openingBalance ?? data.opening_balance ?? 0) || 0,
            notes: data.notes || ''
        })
    });
},

closeCash: async (data) => {
    return requestJson(`${API_URL}/cash/close`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            closingBalance: Number(data.closingBalance ?? data.closing_balance ?? 0) || 0,
            notes: data.notes || ''
        })
    });
},

isCashOpen: async () => {
    const result = await requestJson(`${API_URL}/cash/status`);
    return !!result.data?.isOpen;
},
    
getCashStatus: async () => {
    const result = await requestJson(`${API_URL}/cash/status`);
    return result.data || {};
},
    
    // Checklist
    getChecklists: async () => {
        const result = await requestJson(`${API_URL}/checklist`);
        return result.data || [];
    },

    getChecklistById: async (id) => {
        const result = await requestJson(`${API_URL}/checklist/${id}`);
        return result.data || null;
    },

    getChecklistsByService: async (service_id) => {
        const result = await requestJson(`${API_URL}/checklist/service/${service_id}`);
        return result.data || [];
    },

    saveChecklist: async (checklist) => {
    const formData = new FormData();

    const serviceId = checklist.service_id || '';

    formData.append('service_id', serviceId);
    formData.append('type', checklist.type || 'entrada');
    formData.append('items', JSON.stringify(checklist.items || []));
    formData.append('observations', checklist.observations || '');
    formData.append('technician_signature', checklist.technician_signature || '');

    const photos = Array.isArray(checklist.photos) ? checklist.photos : [];

    photos.forEach(photo => {
        if (photo instanceof File) {
            formData.append('photos', photo);
        }
    });

    console.log('📸 Enviando checklist para API:', {
        service_id: serviceId,
        type: checklist.type || 'entrada',
        totalPhotos: photos.length
    });

    const response = await fetch(`${API_URL}/checklist`, {
        method: 'POST',
        body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar checklist.');
    }

    return result;
},

    deleteChecklist: async (id) => {
        return requestJson(`${API_URL}/checklist/${id}`, {
            method: 'DELETE'
        });
    },
    
// Compras
getPurchases: async () => {
    const result = await requestJson(`${API_URL}/purchases`);
    return result.data || [];
},

savePurchase: async (purchase) => {
    return requestJson(`${API_URL}/purchases`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(purchase)
    });
},

deletePurchase: async (id) => {
    return requestJson(`${API_URL}/purchases/${id}`, {
        method: 'DELETE'
    });
},


// Despesas
getExpenses: async () => {
    const result = await requestJson(`${API_URL}/expenses`);
    return result.data || [];
},

saveExpense: async (expense) => {
    return requestJson(`${API_URL}/expenses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(expense)
    });
},

deleteExpense: async (id) => {
    return requestJson(`${API_URL}/expenses/${id}`, {
        method: 'DELETE'
    });
},

    // Estatísticas e Configurações
getStats: async () => {
    const result = await requestJson(`${API_URL}/stats`);

    return result.data || {
        totalClients: 0,
        totalSuppliers: 0,
        totalParts: 0,
        lowStock: 0,
        todaySales: 0,
        revenueToday: 0,
        pendingServices: 0,
        overduePayments: 0
    };
},

getSettings: async () => {
    const result = await requestJson(`${API_URL}/settings`);

    return result.data || {};
},

saveSettings: async (settings) => {
    return requestJson(`${API_URL}/settings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    });
},

getHistory: async () => {
    try {
        const [sales, services, parts] = await Promise.all([
            window.electronAPI.getSales().catch(() => []),
            window.electronAPI.getServices().catch(() => []),
            window.electronAPI.getParts().catch(() => [])
        ]);

        const activities = [];

        sales.slice(0, 10).forEach(sale => {
            activities.push({
                type: 'venda',
                date: sale.created_at || sale.date || new Date().toISOString(),
                reason: `Venda registrada - R$ ${(Number(sale.total_amount ?? sale.total ?? 0) || 0).toFixed(2)}`,
                client_id: sale.client_id || sale.clientId || null
            });
        });

        services.slice(0, 10).forEach(service => {
            activities.push({
                type: 'servico',
                date: service.created_at || new Date().toISOString(),
                reason: `Serviço #${service.service_number || service.id?.substring(0, 6) || ''} - ${service.device_model || service.equipment || 'Equipamento'}`,
                client_id: service.client_id || service.clientId || null
            });
        });

        parts
            .filter(part => Number(part.quantity || 0) <= Number(part.min_stock || 0) && Number(part.min_stock || 0) > 0)
            .slice(0, 10)
            .forEach(part => {
                activities.push({
                    type: 'estoque',
                    date: part.updated_at || part.created_at || new Date().toISOString(),
                    reason: `Estoque baixo: ${part.name} (${Number(part.quantity || 0)} un.)`
                });
            });

        return activities
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20);

    } catch (error) {
        console.error('Erro ao gerar histórico:', error);
        return [];
    }
},

    // Utilitários e Senhas
    getPassword: async () => fetch(`${API_URL}/auth/password`).then(res => res.json()).then(r => r.password || 'admin123'),
    updatePassword: async (newPassword) => fetch(`${API_URL}/auth/password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword }) }).then(res => res.json()),
    testConnection: async () => fetch(`${API_URL}/test-connection`).then(res => res.json()).onCatch(() => ({ success: false })),
    
    // Impressões e Mocks Web (Evita quebras de hardware)
    printService: async (data) => { console.log('🖨️ Impressão de serviço solicitada na Web:', data); return { success: true }; },
    printSale: async (data) => { console.log('🖨️ Impressão de venda solicitada na Web:', data); return { success: true }; },
    backupDatabase: async () => ({ success: true }),
    restoreDatabase: async () => ({ success: true }),
    resetDatabase: async () => ({ success: true })
};

// Remove leituras de hardware incompatíveis com o navegador
function updateHardwareStatsMock() {
    const memFooter = document.getElementById('memory-footer');
    const storageUsage = document.getElementById('storage-usage');

    if (memFooter) {
        memFooter.innerHTML = '<i class="fas fa-wifi"></i> Online Cloud';
    }

    if (storageUsage) {
        storageUsage.innerHTML = '<i class="fas fa-server"></i> Railway API';
    }
}
setTimeout(updateHardwareStatsMock, 1000);
setInterval(updateHardwareStatsMock, 15000);


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
async function savePurchaseFromModal() {
    const invoiceNumber = document.getElementById('purchase-invoice')?.value?.trim();
    const supplierId = document.getElementById('purchase-supplier')?.value;

    if (!invoiceNumber) {
        showNotification('Informe o número da nota fiscal', 'error');
        return;
    }

    if (!supplierId) {
        showNotification('Selecione um fornecedor', 'error');
        return;
    }

    if (!currentPurchaseItems || currentPurchaseItems.length === 0) {
        showNotification('Adicione pelo menos um item', 'error');
        return;
    }

    showNotification('Salvando compra...', 'info');

    try {
        const suppliers = await window.electronAPI.getSuppliers();
        const supplierName = suppliers.find(s => s.id === supplierId)?.name || '';

        const savedItems = [];

        for (const item of currentPurchaseItems) {
            let partId = item.partId || item.part_id || null;

            if (!partId) {
                const partResult = await window.electronAPI.savePart({
                    name: item.partName || item.name || '',
                    code: item.partCode || item.code || '',
                    supplier_id: supplierId,
                    quantity: Number(item.quantity) || 0,
                    min_stock: 5,
                    cost_price: Number(item.unitPrice || item.price || 0) || 0,
                    sale_price: Number(item.unitPrice || item.price || 0) || 0
                });

                if (!partResult?.success) {
                    throw new Error(partResult?.error || `Erro ao cadastrar peça ${item.partName || item.name}`);
                }

                partId = partResult.data.id;
            }

            savedItems.push({
                part_id: partId,
                partId,
                partName: item.partName || item.name || '',
                partCode: item.partCode || item.code || '',
                quantity: Number(item.quantity) || 1,
                unitPrice: Number(item.unitPrice || item.price || 0),
                total: Number(item.total || 0),
                ncm: item.ncm || '',
                cfop: item.cfop || '5405',
                isBonus: !!item.isBonus
            });
        }

        const productsTotal = savedItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

        const freight = parseFloat(document.getElementById('purchase-freight')?.value) || 0;
        const insurance = parseFloat(document.getElementById('purchase-insurance')?.value) || 0;
        const discount = parseFloat(document.getElementById('purchase-discount')?.value) || 0;
        const otherExpenses = parseFloat(document.getElementById('purchase-other-expenses')?.value) || 0;

        const total = productsTotal + freight + insurance + otherExpenses - discount;

        const purchaseData = {
            invoiceNumber,
            series: document.getElementById('purchase-series')?.value || '1',
            model: document.getElementById('purchase-model')?.value || '55',
            issueDate: document.getElementById('purchase-issue-date')?.value || new Date().toISOString().split('T')[0],
            arrivalDate: document.getElementById('purchase-arrival-date')?.value || new Date().toISOString().split('T')[0],
            entryDate: document.getElementById('purchase-entry-date')?.value || new Date().toISOString().split('T')[0],
            supplier_id: supplierId,
            supplierId,
            supplierName,
            cfop: document.getElementById('purchase-cfop')?.value || '5405',
            freight,
            insurance,
            discount,
            otherExpenses,
            productsTotal,
            total,
            total_amount: total,
            paymentMethod: document.getElementById('purchase-payment-method')?.value || 'dinheiro',
            payment_method: document.getElementById('purchase-payment-method')?.value || 'dinheiro',
            installments: parseInt(document.getElementById('purchase-installments')?.value) || 1,
            dueDate: document.getElementById('purchase-due-date')?.value || new Date().toISOString().split('T')[0],
            notes: document.getElementById('purchase-notes')?.value || '',
            items: savedItems,
            status: 'pendente',
            date: new Date().toISOString()
        };

        const result = await window.electronAPI.savePurchase(purchaseData);

        if (!result?.success) {
            throw new Error(result?.error || 'Erro ao salvar compra');
        }

        showNotification(`Compra NF-e ${invoiceNumber} registrada!`, 'success');

        closePurchaseModal();

        currentPurchaseItems = [];

        dataCache.delete('parts');
        dataCache.delete('purchases');

        await Promise.all([
            loadPurchases(),
            loadStock(),
            loadParts(),
            loadDashboard()
        ]);

    } catch (error) {
        console.error('Erro ao salvar compra:', error);
        showNotification(error.message || 'Erro ao salvar compra', 'error');
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
    // Status fictício removido do painel.
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

        const pending = sales.filter(s =>
            s.status === 'pendente' ||
            s.payment_status === 'pending' ||
            s.paymentStatus === 'pending'
        );

        const overdue = pending.filter(s => {
            const dateValue = s.created_at || s.date;

            if (!dateValue) return false;

            const dueDate = new Date(dateValue);
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
        else if (tabId === 'cash') { await loadCashPanel(); }
        else if (tabId === 'checklists') { await loadChecklistPanel(); }
    }, 50);
}

// ============ DASHBOARD ==========
async function loadDashboard() {
    try {
        const stats = await window.electronAPI.getStats();

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('total-clients', stats.totalClients || 0);
        setText('total-suppliers', stats.totalSuppliers || 0);
        setText('total-parts', stats.totalParts || 0);
        setText('low-stock', stats.lowStock || 0);
        setText('today-sales', stats.todaySales || 0);
        setText('revenue-today', `R$ ${(Number(stats.revenueToday) || 0).toFixed(2)}`);
        setText('pending-services', stats.pendingServices || 0);
        setText('overdue-payments', stats.overduePayments || 0);

        await loadDashboardPendingPanel();
        console.log('✅ Dashboard carregado');

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);

        const fallbackIds = [
            'total-clients',
            'total-suppliers',
            'total-parts',
            'low-stock',
            'today-sales',
            'pending-services',
            'overdue-payments'
        ];

        fallbackIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });

        const revenue = document.getElementById('revenue-today');
        if (revenue) revenue.textContent = 'R$ 0.00';
    }
}

async function loadRecentActivity() {
    try {
        const history = await window.electronAPI.getHistory();
        const clients = await window.electronAPI.getClients().catch(() => []);
        const suppliers = await window.electronAPI.getSuppliers().catch(() => []);

        const list = document.getElementById('activity-list');

        if (!list) return;

        if (!history || !history.length) {
            list.innerHTML = '<div class="no-activity">Nenhuma atividade recente</div>';
            return;
        }

        list.innerHTML = history.slice(0, 20).map(item => {
            const time = item.date
                ? new Date(item.date).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : '--:--';

            const icon =
                item.type === 'entrada' ? '📥' :
                item.type === 'saida' ? '📤' :
                item.type === 'venda' ? '💰' :
                item.type === 'servico' ? '🛠️' :
                item.type === 'estoque' ? '📦' :
                item.type === 'pagamento' ? '💳' :
                '📋';

            let personName = '';

            if (item.client_id) {
                const client = clients.find(c => c.id === item.client_id);
                if (client) personName = ` - ${client.name}`;
            } else if (item.supplier_id) {
                const supplier = suppliers.find(s => s.id === item.supplier_id);
                if (supplier) personName = ` - ${supplier.name}`;
            }

            const descricao =
                item.reason ||
                `${icon} ${item.quantity || 1}x ${item.part_name || 'Item'}${personName}`;

            return `
                <div class="activity-item">
                    <div class="activity-time">${time}</div>
                    <div class="activity-desc">${icon} ${escapeHtml(descricao)}${escapeHtml(personName)}</div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar atividades:', error);

        const list = document.getElementById('activity-list');

        if (list) {
            list.innerHTML = '<div class="no-activity">Nenhuma atividade recente</div>';
        }
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
            document.getElementById('client-id').value = '';
            dataCache.delete('clients');
            await loadClients();
            await loadDashboard();
        } else { 
            showNotification(result.error || 'Erro ao salvar cliente', 'error'); 
        }
    } catch (error) { 
        console.error(error); 
        showNotification(error.message || 'Erro ao salvar cliente', 'error'); 
    }
}

function showClientForm(id = null) {

    const container = document.getElementById('client-form-container');

    if (!container) return;

    container.classList.remove('hidden');

    // NOVO CLIENTE
    if (!id) {

        document.getElementById('client-form').reset();

        document.getElementById('client-id').value = '';

        return;

    }

    // EDITAR CLIENTE
    window.electronAPI.getClients()

        .then(clients => {

            const client = clients.find(c => c.id === id);

            if (!client) {

                showNotification('Cliente não encontrado.', 'error');

                return;

            }

            document.getElementById('client-id').value = client.id || '';

            document.getElementById('client-name').value = client.name || '';

            // TELEFONE FORMATADO
            document.getElementById('client-phone').value =
                formatarTelefoneAPI(client.phone || '');

            document.getElementById('client-email').value =
                client.email || '';

            // CPF / CNPJ FORMATADO
            let documentValue = client.document || '';

            if (documentValue.length === 11) {

                documentValue = documentValue.replace(
                    /(\d{3})(\d{3})(\d{3})(\d{2})/,
                    '$1.$2.$3-$4'
                );

            } else if (documentValue.length === 14) {

                documentValue = documentValue.replace(
                    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                    '$1.$2.$3/$4-$5'
                );

            }

            document.getElementById('client-document').value =
                documentValue;

            // CEP FORMATADO
            let cep = client.cep || '';

            if (cep.length === 8) {

                cep = cep.replace(
                    /(\d{5})(\d{3})/,
                    '$1-$2'
                );

            }

            document.getElementById('client-cep').value = cep;

            document.getElementById('client-address').value =
                client.address || '';

            document.getElementById('client-number').value =
                client.number || '';

            document.getElementById('client-complement').value =
                client.complement || '';

            document.getElementById('client-district').value =
                client.district || '';

            document.getElementById('client-city').value =
                client.city || '';

            document.getElementById('client-state').value =
                client.state || '';

        })

        .catch(error => {

            console.error(error);

            showNotification(
                'Erro ao carregar cliente.',
                'error'
            );

        });

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
                showNotification(result.error || 'Erro ao excluir cliente', 'error'); 
            }
        } catch (error) { 
            console.error(error); 
            showNotification(error.message || 'Erro ao excluir cliente', 'error'); 
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
        
        const filtered = search ? suppliers.filter(s => {
            const term = search.toLowerCase();
            return [
                s.name,
                s.contact,
                s.phone,
                s.email,
                s.document,
                s.category,
                s.city
            ].some(value => String(value || '').toLowerCase().includes(term));
        }) : suppliers;
        if (!filtered.length) { 
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhum fornecedor cadastrado</td></tr>'; 
            return; 
        }
        
        tbody.innerHTML = filtered.map(s => {
            return `
            <tr>
                <td>${escapeHtml(s.name || '-')}</td>
                <td>${escapeHtml(s.contact || '-')}</td>
                <td>${escapeHtml(s.phone || '-')}</td>
                <td>${escapeHtml(s.email || '-')}</td>
                <td>${escapeHtml(s.category || '-')}</td>
                <td>${escapeHtml(s.city || '-')}</td>
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
        
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            showNotification('Informe um telefone com DDD para o fornecedor', 'error');
            return;
        }
        
        const cleanDocument = documentValue.replace(/\D/g, '');

        if (cleanDocument && cleanDocument.length !== 14) {
            showNotification('CNPJ deve ter 14 digitos', 'error');
            return;
        }
        
        const data = {
            id: id,
            name: name,
            contact: contact,
            phone: phoneDigits,
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
            showNotification(error.message || 'Erro ao excluir fornecedor', 'error');
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
        
        const documentNumbers = String(s.document || '').replace(/\D/g, '');
        let documentDisplay = s.document || '-';
        if (documentNumbers.length === 14) {
            documentDisplay = documentNumbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        
        const body = `<div style="line-height:2;">
            <strong>Empresa:</strong> ${escapeHtml(s.name || '-')}<br>
            <strong>Contato:</strong> ${escapeHtml(s.contact || '-')}<br>
            <strong>Telefone:</strong> ${escapeHtml(s.phone || '-')}<br>
            <strong>Email:</strong> ${escapeHtml(s.email || '-')}<br>
            <strong>CNPJ:</strong> ${escapeHtml(documentDisplay)}<br>
            <strong>Categoria:</strong> ${escapeHtml(s.category || '-')}<br>
            <strong>Endereço:</strong> ${escapeHtml(s.address || '-')}<br>
            <strong>Cidade/UF:</strong> ${escapeHtml(s.city || '-')}/${escapeHtml(s.state || '-')}<br>
            <strong>Observações:</strong> ${escapeHtml(s.notes || '-')}
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

        const term = (search || '').toLowerCase();

        const filtered = term
            ? parts.filter(p =>
                (p.name || '').toLowerCase().includes(term) ||
                (p.code || '').toLowerCase().includes(term)
            )
            : parts;

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">Nenhuma peça cadastrada</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(p => {
            const supplier = suppliers.find(s => s.id === p.supplier_id);
            const supplierName = supplier ? supplier.name : '-';

            const quantity = Number(p.quantity) || 0;
            const minStock = Number(p.min_stock) || 0;
            const costPrice = Number(p.cost_price) || 0;
            const salePrice = Number(p.sale_price) || 0;

            const stockAlert = quantity <= minStock && minStock > 0
                ? ' <span class="badge badge-warning">Baixo</span>'
                : '';

            return `
                <tr>
                    <td style="max-width:200px;">${escapeHtml(p.name || '-')}</td>
                    <td>${escapeHtml(p.code || '-')}</td>
                    <td>-</td>
                    <td>${escapeHtml(supplierName)}</td>
                    <td class="text-center">${quantity}${stockAlert}</td>
                    <td class="text-center">R$ ${costPrice.toFixed(2)}</td>
                    <td class="text-center">R$ ${salePrice.toFixed(2)}</td>
                    <td class="actions">
                        <button class="btn-edit" onclick="editPart('${p.id}')" title="Editar peça">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deletePart('${p.id}')" title="Excluir peça">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar peças:', error);
        showNotification('Erro ao carregar peças', 'error');
    }
}

async function savePart(e) {
    e.preventDefault();

    const id = document.getElementById('part-id')?.value || null;

    const data = {
        id,
        name: document.getElementById('part-name')?.value?.trim() || '',
        code: document.getElementById('part-code')?.value?.trim() || '',
        supplier_id: document.getElementById('part-supplier')?.value || null,
        quantity: parseInt(document.getElementById('part-quantity')?.value) || 0,
        min_stock: parseInt(document.getElementById('part-min-quantity')?.value) || 0,
        cost_price: parseFloat(document.getElementById('part-cost')?.value) || 0,
        sale_price: parseFloat(document.getElementById('part-price')?.value) || 0
    };

    if (!data.name) {
        showNotification('Nome da peça é obrigatório', 'error');
        return;
    }

    try {
        const result = await window.electronAPI.savePart(data);

        if (result.success) {
            showNotification(
                id ? 'Peça atualizada com sucesso!' : 'Peça cadastrada com sucesso!',
                'success'
            );

            hidePartForm();

            document.getElementById('part-form')?.reset();
            document.getElementById('part-id').value = '';

            dataCache.delete('parts');

            await loadParts();
            await loadDashboard();

            if (typeof loadStock === 'function') {
                await loadStock();
            }

        } else {
            showNotification(result.error || 'Erro ao salvar peça', 'error');
        }

    } catch (error) {
        console.error('Erro ao salvar peça:', error);
        showNotification(error.message || 'Erro ao salvar peça', 'error');
    }
}

async function showPartForm(id = null) {
    const container = document.getElementById('part-form-container');

    if (!container) return;

    container.classList.remove('hidden');

    try {
        const suppliers = await window.electronAPI.getSuppliers();

        const supplierSelect = document.getElementById('part-supplier');

        if (supplierSelect) {
            supplierSelect.innerHTML =
                '<option value="">Selecione um fornecedor.</option>' +
                suppliers
                    .map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
                    .join('');
        }

        // Nova peça
        if (!id) {
            document.getElementById('part-form')?.reset();
            document.getElementById('part-id').value = '';

            if (document.getElementById('part-min-quantity')) {
                document.getElementById('part-min-quantity').value = '5';
            }

            if (document.getElementById('part-cfop')) {
                document.getElementById('part-cfop').value = '5405';
            }

            return;
        }

        // Editar peça
        const parts = await window.electronAPI.getParts();
        const part = parts.find(p => p.id === id);

        if (!part) {
            showNotification('Peça não encontrada', 'error');
            return;
        }

        document.getElementById('part-id').value = part.id || '';
        document.getElementById('part-name').value = part.name || '';
        document.getElementById('part-code').value = part.code || '';

        if (document.getElementById('part-category')) {
            document.getElementById('part-category').value = part.category || '';
        }

        if (supplierSelect) {
            supplierSelect.value = part.supplier_id || '';
        }

        document.getElementById('part-quantity').value = part.quantity || 0;
        document.getElementById('part-min-quantity').value = part.min_stock || 0;
        document.getElementById('part-cost').value = part.cost_price || '';
        document.getElementById('part-price').value = part.sale_price || '';

        if (document.getElementById('part-description')) {
            document.getElementById('part-description').value = part.description || '';
        }

        if (document.getElementById('part-ncm')) {
            document.getElementById('part-ncm').value = part.ncm || '';
        }

        if (document.getElementById('part-cfop')) {
            document.getElementById('part-cfop').value = part.cfop || '5405';
        }

    } catch (error) {
        console.error('Erro ao carregar formulário de peça:', error);
        showNotification('Erro ao carregar formulário de peça', 'error');
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
            const result = await window.electronAPI.deletePart(id);

            if (result.success) {
                showNotification('Peça excluída com sucesso!', 'success');

                dataCache.delete('parts');

                await loadParts();
                await loadDashboard();

                if (typeof loadStock === 'function') {
                    await loadStock();
                }

            } else {
                showNotification(result.error || 'Erro ao excluir peça', 'error');
            }

        } catch (error) {
            console.error('Erro ao excluir peça:', error);
            showNotification(error.message || 'Erro ao excluir peça', 'error');
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

        if (!sel) return;

        sel.innerHTML =
            '<option value="">Selecione uma peça...</option>' +
            parts
                .filter(p => Number(p.quantity) > 0)
                .map(p => {
                    const price = Number(p.sale_price ?? p.price ?? 0) || 0;
                    const quantity = Number(p.quantity) || 0;

                    return `
                        <option value="${p.id}" data-price="${price}">
                            ${escapeHtml(p.name)} (Estoque: ${quantity}) - R$ ${price.toFixed(2)}
                        </option>
                    `;
                })
                .join('');

    } catch (error) {
        console.error('Erro ao carregar peças para venda:', error);
        showNotification('Erro ao carregar peças para venda.', 'error');
    }
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
    const partId = document.getElementById('sale-part')?.value;

    if (!partId) {
        showNotification('Selecione uma peça', 'error');
        return;
    }

    const quantity = parseFloat(document.getElementById('sale-quantity')?.value) || 1;
    const price = parseFloat(document.getElementById('sale-price')?.value) || 0;

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

        const stockQuantity = Number(part.quantity) || 0;

        if (stockQuantity < quantity) {
            showNotification(`Estoque insuficiente! Disponível: ${stockQuantity}`, 'error');
            return;
        }

        currentSale.items.push({
            part_id: part.id,
            partId: part.id,
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

        const subtotal = document.getElementById('sale-item-subtotal');
        if (subtotal) subtotal.textContent = 'R$ 0.00';

        showNotification('Item adicionado!', 'success');

    } catch (error) {
        console.error('Erro ao adicionar item:', error);
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

        const tbody =
        document.getElementById('sales-table-body') ||
        document.getElementById('sales-history-body');

        if (!tbody) return;

        let filtered = sales || [];

        if (search) {
            const term = search.toLowerCase();

            filtered = filtered.filter(sale => {
                const client = clients.find(c => c.id === sale.client_id || c.id === sale.clientId);
                const clientName = client?.name || '';

                return (
                    clientName.toLowerCase().includes(term) ||
                    (sale.payment_method || sale.paymentMethod || '').toLowerCase().includes(term) ||
                    (sale.payment_description || sale.paymentDescription || '').toLowerCase().includes(term) ||
                    (sale.status || '').toLowerCase().includes(term)
                );
            });
        }

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">Nenhuma venda registrada</td></tr>';

            const totalSales = document.getElementById('total-sales');
            const salesRevenue = document.getElementById('sales-revenue');

            if (totalSales) totalSales.textContent = '0';
            if (salesRevenue) salesRevenue.textContent = 'R$ 0,00';

            return;
        }

        const totalRevenue = filtered.reduce((sum, sale) => {
            return sum + (Number(sale.total_amount ?? sale.total ?? 0) || 0);
        }, 0);

        const totalSalesElement = document.getElementById('total-sales');
        const salesRevenueElement = document.getElementById('sales-revenue');

        if (totalSalesElement) {
            totalSalesElement.textContent = filtered.length;
        }

        if (salesRevenueElement) {
            salesRevenueElement.textContent = `R$ ${totalRevenue.toFixed(2)}`;
        }

        tbody.innerHTML = filtered.map(sale => {
            const client = clients.find(c => c.id === sale.client_id || c.id === sale.clientId);

            const clientName = client
                ? client.name
                : 'Consumidor Final';

            const total = Number(sale.total_amount ?? sale.total ?? 0) || 0;
            const discount = Number(sale.discount_amount ?? sale.discount ?? 0) || 0;
            const itemCount = Array.isArray(sale.items) ? sale.items.length : 0;

            const paymentMethod =
                sale.payment_description ||
                sale.paymentDescription ||
                sale.payment_method ||
                sale.paymentMethod ||
                '-';

            const dateValue = sale.created_at || sale.date;
            const date = dateValue
                ? new Date(dateValue).toLocaleDateString('pt-BR')
                : '-';

            const status = sale.status || 'concluida';

            let statusClass = 'badge-success';
            let statusLabel = 'Concluída';

            if (status === 'pendente') {
                statusClass = 'badge-warning';
                statusLabel = 'Pendente';
            } else if (status === 'cancelada') {
                statusClass = 'badge-danger';
                statusLabel = 'Cancelada';
            }

            return `
                <tr>
                    <td>${date}</td>
                    <td>${escapeHtml(clientName)}</td>
                    <td class="text-center">${itemCount}</td>
                    <td class="text-center">R$ ${discount.toFixed(2)}</td>
                    <td class="text-center fw-bold">R$ ${total.toFixed(2)}</td>
                    <td>${escapeHtml(paymentMethod)}</td>
                    <td class="text-center">
                        <span class="badge ${statusClass}">${statusLabel}</span>
                    </td>
                    <td class="actions">
                        <button class="btn-view" onclick="viewSale('${sale.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-print" onclick="printSale('${sale.id}')" title="Imprimir">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn-delete" onclick="showDeleteConfirmationModal('${sale.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        showNotification('Erro ao carregar vendas.', 'error');
    }
}

async function finalizeSale(e) {
    e.preventDefault();
    e.stopPropagation();

    if (window.isProcessingSale) {
        console.warn('Venda já está sendo processada.');
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

const totals = calculateFinalTotal();
const laborValue = Number(totals.labor || 0);

if ((!currentSale.items || currentSale.items.length === 0) && laborValue <= 0) {
    showNotification('Adicione uma peça ou informe um valor de mão de obra para finalizar a venda.', 'error');
    return false;
}

let clientName = '';

        if (clientId) {
            const clients = await window.electronAPI.getClients();
            const client = clients.find(c => c.id === clientId);
            clientName = client ? client.name : '';
        }

        let initialStatus = 'pendente';

        if (currentPaymentMode === 'vista') {
            initialStatus = 'concluida';
        } else if (currentPaymentMode === 'prazo' && currentFinancedMethod === 'credito_prazo') {
            initialStatus = 'concluida';
        } else if (currentPaymentMode === 'prazo' && currentFinancedMethod === 'boleto') {
            initialStatus = 'pendente';
        }

        const methods = {
            pix: 'PIX',
            dinheiro: 'Dinheiro',
            debito: 'Débito',
            credito_vista: 'Crédito à vista',
            credito_prazo: 'Cartão de Crédito',
            boleto: 'Boleto'
        };

        const paymentMethod =
            currentPaymentMode === 'vista'
                ? currentPaymentMethod
                : currentFinancedMethod;

        const methodName = methods[paymentMethod] || paymentMethod;

        let paymentDescription = '';

        if (currentPaymentMode === 'vista') {
            paymentDescription = `${methodName} (à vista) - Total: R$ ${totals.total.toFixed(2)}`;

            if (totals.autoDiscount > 0) {
                paymentDescription += ` (Desconto: R$ ${totals.autoDiscount.toFixed(2)})`;
            }

        } else {
            const installmentValue = totals.total / currentInstallments;

            paymentDescription =
                `${methodName} - ${currentInstallments}x de R$ ${installmentValue.toFixed(2)} - Total: R$ ${totals.total.toFixed(2)}`;
        }

        const finalItems = Array.isArray(currentSale.items)
    ? currentSale.items.map(item => {
        const quantity = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;

        return {
            part_id: item.part_id || item.partId || null,
            partId: item.partId || item.part_id || null,
            name: item.name || item.partName || '',
            partName: item.partName || item.name || '',
            type: 'part',
            item_type: 'part',
            quantity,
            price,
            unitPrice: price,
            subtotal: quantity * price,
            total: quantity * price
        };
    })
    : [];

if (laborValue > 0) {
    finalItems.push({
        part_id: null,
        partId: null,
        name: 'Mão de obra',
        partName: 'Mão de obra',
        type: 'labor',
        item_type: 'labor',
        quantity: 1,
        price: laborValue,
        unitPrice: laborValue,
        subtotal: laborValue,
        total: laborValue
    });
}

const saleData = {
    client_id: clientId,
    clientId: clientId,

    items: finalItems,

    subtotal: totals.subtotal,
    labor: totals.labor,
    discount_amount: totals.autoDiscount,
    discount: totals.autoDiscount,
    total_amount: totals.total,
    total: totals.total,

            payment_method: paymentMethod,
            paymentMethod: paymentMethod,
            payment_description: paymentDescription,
            paymentDescription: paymentDescription,

            payment_mode: currentPaymentMode,
            paymentMode: currentPaymentMode,

            installments: currentPaymentMode !== 'vista' ? currentInstallments : 1,
            financed_method: currentPaymentMode !== 'vista' ? currentFinancedMethod : null,
            financedMethod: currentPaymentMode !== 'vista' ? currentFinancedMethod : null,

            notes: document.getElementById('sale-notes')?.value || '',
            status: initialStatus,
            clientName
        };

        const result = await window.electronAPI.saveSale(saleData);

        if (result && result.success) {
            let message = 'Venda finalizada!';

            if (initialStatus === 'concluida') {
                message += ' Pago!';
            } else {
                message += ' Aguardando pagamento.';
            }

            message += ` Total: R$ ${totals.total.toFixed(2)}`;

            showNotification(message, 'success');

            hideSaleForm();
            clearSaleForm();

            dataCache.delete('sales');
            dataCache.delete('parts');

            await Promise.all([
                loadSales(),
                loadDashboard(),
                loadParts(),
                loadStock()
            ]);

            if (typeof loadRecentActivity === 'function') {
                await loadRecentActivity();
            }

        } else {
            showNotification(result?.error || 'Erro ao finalizar venda', 'error');
        }

    } catch (error) {
        console.error('Erro ao finalizar venda:', error);
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
            const result = await window.electronAPI.deleteSale(saleId);

            if (result?.success) {
                showNotification('Venda excluída com sucesso!', 'success');

                dataCache.delete('sales');
                dataCache.delete('parts');

                await Promise.all([
                    loadSales(),
                    loadDashboard(),
                    loadParts(),
                    loadStock()
                ]);

                if (typeof loadRecentActivity === 'function') {
                    await loadRecentActivity();
                }

            } else {
                showNotification(result?.error || 'Erro ao excluir venda', 'error');
            }

        } catch (error) {
            console.error('Erro ao excluir venda:', error);
            showNotification(error.message || 'Erro ao excluir venda', 'error');
        }
    });
}

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
                const equipment = s.equipment || s.device_model || '';

                return (
                    String(s.service_number || '').includes(term) ||
                    (client?.name || '').toLowerCase().includes(term) ||
                    equipment.toLowerCase().includes(term) ||
                    (s.problem || '').toLowerCase().includes(term)
                );
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

        const inProgress = filtered.filter(s =>
            s.status === 'em_andamento' ||
            s.status === 'aguardando_peca'
        ).length;

        const completed = filtered.filter(s =>
            s.status === 'finalizado' ||
            s.status === 'entregue'
        ).length;

        const revenue = filtered
            .filter(s => s.status === 'finalizado' || s.status === 'entregue')
            .reduce((sum, s) => {
                const labor = Number(s.value) || 0;
                const partsTotal = (s.parts || []).reduce((ps, p) => ps + (Number(p.subtotal) || 0), 0);

                return sum + labor + partsTotal;
            }, 0);

        document.getElementById('total-quotes').textContent = quotes;
        document.getElementById('in-progress').textContent = inProgress;
        document.getElementById('completed').textContent = completed;
        document.getElementById('total-revenue').textContent = `R$ ${revenue.toFixed(2)}`;

        tbody.innerHTML = filtered.map(s => {
            const client = clients.find(c => c.id === s.client_id);

            const clientName = client
                ? client.name
                : (s.client_id ? 'Cliente #' + s.client_id.substring(0, 6) : '-');

            const equipment = s.equipment || s.device_model || '-';

            const partsTotal = (s.parts || []).reduce(
                (sum, p) => sum + (Number(p.subtotal) || 0),
                0
            );

            const total = (Number(s.value) || 0) + partsTotal;

            let statusClass = 'badge-secondary';
            let statusName = getServiceStatusName(s.status);

            if (s.status === 'orcamento') {
                statusClass = 'badge-info';
            } else if (s.status === 'em_andamento') {
                statusClass = 'badge-warning';
            } else if (s.status === 'finalizado') {
                statusClass = 'badge-success';
            } else if (s.status === 'convertido') {
                statusClass = 'badge-success';
                statusName = 'Convertido';
            }

            return `
                <tr>
                    <td class="text-center fw-bold">#${s.service_number || s.id.substring(0, 4)}</td>
                    <td>${escapeHtml(clientName)}</td>
                    <td>${escapeHtml(equipment)}</td>
                    <td>${escapeHtml((s.problem || '').substring(0, 40))}${(s.problem || '').length > 40 ? '...' : ''}</td>
                    <td class="text-center fw-bold">R$ ${total.toFixed(2)}</td>
                    <td class="text-center">
                        <span class="badge ${statusClass}">${statusName}</span>
                    </td>
                    <td class="actions">
                        <button class="btn-view" onclick="viewService('${s.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-print" onclick="printService('${s.id}')" title="Imprimir">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn-whatsapp" onclick="sendViaWhatsApp('${s.id}')" title="WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        ${s.status !== 'convertido' ? `
                            <button class="btn-success" onclick="convertServiceToSale('${s.id}')" title="Converter em venda">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        ` : ''}
                        <button class="btn-edit" onclick="editService('${s.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteService('${s.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        showNotification('Erro ao carregar serviços', 'error');
    }
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

    const id = document.getElementById('service-id')?.value || null;
    const clientId = document.getElementById('service-client')?.value || null;
    const equipment = document.getElementById('service-equipment')?.value?.trim() || '';
    const problem = document.getElementById('service-problem')?.value?.trim() || '';

    const data = {
        id,
        client_id: clientId,
        equipment,
        device_model: equipment,
        problem,
        solution: document.getElementById('service-solution')?.value?.trim() || '',
        value: parseFloat(document.getElementById('service-value')?.value) || 0,
        status: document.getElementById('service-status')?.value || 'orcamento',
        notes: document.getElementById('service-notes')?.value?.trim() || '',
        parts: currentServiceParts
    };

    if (!data.client_id) {
        showNotification('Selecione um cliente', 'error');
        return;
    }

    if (!data.equipment) {
        showNotification('Informe o equipamento', 'error');
        return;
    }

    if (!data.problem) {
        showNotification('Descreva o problema', 'error');
        return;
    }

    try {
        const result = await window.electronAPI.saveService(data);

        if (result.success) {
            showNotification(
                id ? 'Serviço atualizado com sucesso!' : 'Serviço cadastrado com sucesso!',
                'success'
            );

            hideServiceForm();

            document.getElementById('service-form')?.reset();
            document.getElementById('service-id').value = '';

            currentServiceParts = [];

            dataCache.delete('services');

            await loadServices();
            await loadDashboard();

        } else {
            showNotification(result.error || 'Erro ao salvar serviço', 'error');
        }

    } catch (error) {
        console.error('Erro ao salvar serviço:', error);
        showNotification(error.message || 'Erro ao salvar serviço', 'error');
    }
}

async function showServiceForm(id = null) {
    const container = document.getElementById('service-form-container');

    if (!container) return;

    container.classList.remove('hidden');

    try {
        await loadServiceClientsSelect();
        await loadServicePartsSelect();

        currentServiceParts = [];

        // Novo serviço
        if (!id) {
            document.getElementById('service-form')?.reset();
            document.getElementById('service-id').value = '';

            const status = document.getElementById('service-status');
            if (status) status.value = 'orcamento';

            updateServicePartsTable();
            recalcServiceTotal();

            return;
        }

        // Editar serviço
        const services = await window.electronAPI.getServices();
        const service = services.find(s => s.id === id);

        if (!service) {
            showNotification('Serviço não encontrado', 'error');
            return;
        }

        const equipment =
            service.equipment ||
            service.device_model ||
            '';

        document.getElementById('service-id').value = service.id || '';
        document.getElementById('service-client').value = service.client_id || service.clientId || '';
        document.getElementById('service-equipment').value = equipment;
        document.getElementById('service-problem').value = service.problem || '';
        document.getElementById('service-solution').value = service.solution || '';
        document.getElementById('service-value').value = service.value || 0;
        document.getElementById('service-status').value = service.status || 'orcamento';
        document.getElementById('service-notes').value = service.notes || '';

        currentServiceParts = Array.isArray(service.parts)
            ? service.parts
            : [];

        updateServicePartsTable();
        recalcServiceTotal();

    } catch (error) {
        console.error('Erro ao abrir formulário de serviço:', error);
        showNotification('Erro ao carregar serviço', 'error');
    }
}

async function loadServiceClientsSelect() {
    const clients = await window.electronAPI.getClients();
    document.getElementById('service-client').innerHTML = '<option value="">Selecione um cliente...</option>' + 
        clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function loadServicePartsSelect() {
    const parts = await window.electronAPI.getParts();

    const select = document.getElementById('service-part');

    if (!select) return;

    select.innerHTML =
        '<option value="">Selecione uma peça...</option>' +
        parts.map(p => {
            const price = Number(p.sale_price || p.price || 0);
            const quantity = Number(p.quantity || 0);

            return `
                <option value="${p.id}" data-price="${price}">
                    ${escapeHtml(p.name)} (Estoque: ${quantity})
                </option>
            `;
        }).join('');
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

async function deleteService(service_id) {
    confirmAction('Excluir este serviço?', async () => {
        try {
            const result = await window.electronAPI.deleteService(service_id);

            if (result?.success) {
                showNotification('Serviço excluído com sucesso!', 'success');

                dataCache.delete('services');

                await loadServices();
                await loadDashboard();

            } else {
                showNotification(result?.error || 'Erro ao excluir serviço', 'error');
            }

        } catch (error) {
            console.error('Erro ao excluir serviço:', error);
            showNotification(error.message || 'Erro ao excluir serviço', 'error');
        }
    });
}

async function convertServiceToSale(service_id) {
    try {
        const services = await window.electronAPI.getServices();
        const service = services.find(s => s.id === service_id);
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

async function sendViaWhatsApp(service_id) {
    try {
        const services = await window.electronAPI.getServices();
        const service = services.find(s => s.id === service_id);
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
                <td>${p.invoiceNumber || p.invoice_number || '-'}</td>
                <td>${(p.issueDate || p.issue_date || p.created_at) ? new Date(p.issueDate || p.issue_date || p.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                <td>${p.supplierName || p.supplier_name || '-'}</td>
                <td class="text-center">${p.items?.length || 0}</td>
                <td class="text-center fw-bold">R$ ${(Number(p.total ?? p.total_amount ?? 0) || 0).toFixed(2)}</td>
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

        if (!purchase) {
            showNotification('Compra não encontrada', 'error');
            return;
        }

        const invoiceNumber = purchase.invoiceNumber || purchase.invoice_number || '-';
        const supplierName = purchase.supplierName || purchase.supplier_name || '-';
        const issueDate = purchase.issueDate || purchase.issue_date || purchase.created_at || null;
        const total = Number(purchase.total ?? purchase.total_amount ?? 0) || 0;
        const items = Array.isArray(purchase.items) ? purchase.items : [];

        const itemsHtml = items.map(i => {
            const name = i.partName || i.name || i.description || '-';
            const quantity = Number(i.quantity || 0);
            const unitPrice = Number(i.unitPrice ?? i.price ?? 0);
            const itemTotal = Number(i.total ?? quantity * unitPrice);

            return `
                <tr>
                    <td>${escapeHtml(name)}</td>
                    <td class="text-center">${quantity}</td>
                    <td class="text-center">R$ ${unitPrice.toFixed(2)}</td>
                    <td class="text-center">R$ ${itemTotal.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        const body = `
            <div style="line-height:2;">
                <strong>NFe:</strong> ${escapeHtml(invoiceNumber)}<br>
                <strong>Fornecedor:</strong> ${escapeHtml(supplierName)}<br>
                <strong>Data Emissão:</strong> ${issueDate ? new Date(issueDate).toLocaleDateString('pt-BR') : '-'}<br>
                <strong>Total:</strong> R$ ${total.toFixed(2)}<br>
            </div>

            <table style="margin-top:15px;width:100%;">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qtd</th>
                        <th>Preço</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml || '<tr><td colspan="4" class="no-data">Nenhum item encontrado</td></tr>'}
                </tbody>
            </table>
        `;

        showGenericModal(`Compra NFe ${escapeHtml(invoiceNumber)}`, body, [
            {
                label: 'Editar',
                className: 'btn-primary',
                onClick: () => {
                    closeModal();
                    editPurchase(id);
                }
            },
            {
                label: 'Fechar',
                className: 'btn-secondary',
                onClick: () => closeModal()
            }
        ]);

    } catch (error) {
        console.error(error);
        showNotification('Erro ao visualizar compra', 'error');
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
        async function loadCashPanel() {
    try {
        const status = await window.electronAPI.getCashStatus();

        const statusLabel = document.getElementById('cash-status-label');
        const openingBalance = document.getElementById('cash-opening-balance');
        const currentBalance = document.getElementById('cash-current-balance');
        const tbody = document.getElementById('cash-table-body');

        if (statusLabel) {
            statusLabel.textContent = status?.status === 'aberto' ? 'Aberto' : 'Fechado';
        }

        if (openingBalance) {
            openingBalance.textContent = `R$ ${(Number(status?.opening_balance) || 0).toFixed(2)}`;
        }

        if (currentBalance) {
            const current = Number(status?.closing_balance ?? status?.opening_balance ?? 0);
            currentBalance.textContent = `R$ ${current.toFixed(2)}`;
        }

        const movements = await window.electronAPI.getCash();
        if (tbody) {
            if (!movements || movements.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="no-data">Nenhuma movimentação registrada</td></tr>`;
            } else {
                tbody.innerHTML = movements.map(item => `
                    <tr>
                        <td>${item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                        <td>${item.status || '-'}</td>
                        <td>R$ ${(Number(item.opening_balance || item.closing_balance || 0)).toFixed(2)}</td>
                        <td>${item.notes || '-'}</td>
                        <td>
                            <div class="actions">
                                <button class="btn-view" title="Visualizar"><i class="fas fa-eye"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar caixa:', error);
        showNotification('Erro ao carregar caixa', 'error');
    }
}

async function loadChecklistPanel() {
    try {
        const [list, services, clients] = await Promise.all([
            window.electronAPI.getChecklists().catch(() => []),
            window.electronAPI.getServices().catch(() => []),
            window.electronAPI.getClients().catch(() => [])
        ]);

        const tbody = document.getElementById('checklists-table-body');

        const total = list.length;
        const entryTotal = list.filter(item => (item.type || '').includes('entrada')).length;
        const exitTotal = list.filter(item => ['saida', 'entrega'].includes(item.type)).length;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('checklists-total', total);
        setText('checklists-entry-total', entryTotal);
        setText('checklists-exit-total', exitTotal);

        if (!tbody) return;

        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">Nenhum checklist cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(item => {
            const service_id = item.service_id || item.service_id || '';
            const service = services.find(s => s.id === service_id);

            const clientId = service?.client_id || service?.clientId || '';
            const client = clients.find(c => c.id === clientId);

            const clientName = client?.name || 'Cliente não identificado';
            const equipment = service?.device_model || service?.equipment || 'Equipamento não informado';

            const serviceLabel = `${clientName} - ${equipment}`;

            const typeLabel =
                item.type === 'entrada' ? 'Entrada' :
                item.type === 'saida' ? 'Saída' :
                item.type === 'entrega' ? 'Entrega' :
                item.type || '-';

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(clientName)}</strong><br>
                        <small>${escapeHtml(equipment)}</small>
                    </td>
                    <td><span class="badge badge-info">${escapeHtml(typeLabel)}</span></td>
                    <td>${escapeHtml(item.observations || item.notes || '-')}</td>
                    <td>${item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                        <div class="actions">
                            <button class="btn-view" title="Visualizar" onclick="viewChecklist('${item.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-delete" title="Excluir" onclick="deleteChecklist('${item.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar checklists:', error);
        showNotification('Erro ao carregar checklists', 'error');
    }
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

// ============ CAIXA E CHECKLIST - WEB ============

function formatCurrencyBR(value) {
    return `R$ ${(Number(value) || 0).toFixed(2)}`;
}

function normalizeCashEntry(entry) {
    const type = entry.type || entry.tipo || entry.movement_type || 'entrada';
    const amount = Number(entry.amount ?? entry.value ?? entry.valor ?? entry.opening_balance ?? entry.closing_balance ?? 0) || 0;

    return {
        id: entry.id,
        type,
        description: entry.description || entry.descricao || entry.notes || 'Movimentação de caixa',
        amount,
        payment_method: entry.payment_method || entry.paymentMethod || 'dinheiro',
        created_at: entry.created_at || entry.createdAt || entry.date || new Date().toISOString()
    };
}

async function loadCashPanel() {
    try {
        const status = await window.electronAPI.getCashStatus().catch(() => ({}));
        const entries = await window.electronAPI.getCashEntries().catch(() => []);

        const normalized = (entries || []).map(normalizeCashEntry);

        const openingBalance = Number(
            status.opening_balance ??
            status.openingBalance ??
            status.cash_register?.opening_balance ??
            status.cashRegister?.openingBalance ??
            0
        ) || 0;

        const totalEntries = normalized
            .filter(item => item.type === 'entrada')
            .reduce((sum, item) => sum + item.amount, 0);

        const totalExits = normalized
            .filter(item => item.type === 'saida')
            .reduce((sum, item) => sum + item.amount, 0);

        const balance = openingBalance + totalEntries - totalExits;

        const isOpen =
            status.isOpen === true ||
            status.is_open === true ||
            status.status === 'aberto' ||
            status.cash_register?.status === 'aberto';

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('cash-status-label', isOpen ? 'Aberto' : 'Fechado');
        setText('cash-total-entries', formatCurrencyBR(totalEntries));
        setText('cash-total-exits', formatCurrencyBR(totalExits));
        setText('cash-current-balance', formatCurrencyBR(balance));

        const tbody = document.getElementById('cash-table-body');

        if (!tbody) return;

        const rows = [];

        if (openingBalance > 0) {
            rows.push(`
                <tr>
                    <td>${new Date().toLocaleString('pt-BR')}</td>
                    <td><span class="badge badge-success">Abertura</span></td>
                    <td>Saldo inicial do caixa</td>
                    <td>dinheiro</td>
                    <td class="fw-bold">${formatCurrencyBR(openingBalance)}</td>
                    <td>
                        <div class="actions">
                            <button class="btn-view" title="Saldo inicial">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
        }

        normalized.forEach(item => {
            const typeLabel = item.type === 'saida' ? 'Saída' : 'Entrada';
            const badgeClass = item.type === 'saida' ? 'badge-danger' : 'badge-success';

            rows.push(`
                <tr>
                    <td>${new Date(item.created_at).toLocaleString('pt-BR')}</td>
                    <td><span class="badge ${badgeClass}">${typeLabel}</span></td>
                    <td>${escapeHtml(item.description)}</td>
                    <td>${escapeHtml(item.payment_method)}</td>
                    <td class="fw-bold">${formatCurrencyBR(item.amount)}</td>
                    <td>
                        <div class="actions">
                            <button class="btn-view" title="Visualizar" onclick="viewCashEntry('${item.id || ''}')">
                                <i class="fas fa-eye"></i>
                            </button>

                        <button class="btn-delete" title="Excluir" onclick="deleteCashEntry('${item.id || ''}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
        });

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">Nenhuma movimentação registrada</td></tr>';
            return;
        }

        tbody.innerHTML = rows.join('');

    } catch (error) {
        console.error('Erro ao carregar caixa:', error);
        showNotification('Erro ao carregar caixa', 'error');
    }
}

function showOpenCashModal() {
    const body = `
        <div class="form-row">
            <div class="form-group">
                <label>Saldo inicial (R$)</label>
                <input type="number" id="modal-opening-balance" step="0.01" min="0" value="0.00">
            </div>
        </div>
        <div class="form-group">
            <label>Observações</label>
            <textarea id="modal-open-cash-notes" rows="3" placeholder="Ex: Abertura do caixa do dia"></textarea>
        </div>
    `;

    showGenericModal('Abrir Caixa', body, [
        {
            label: '<i class="fas fa-lock-open"></i> Abrir Caixa',
            className: 'btn-primary',
            onClick: async () => {
                try {
                    const openingBalance = Number(document.getElementById('modal-opening-balance')?.value || 0);
                    const notes = document.getElementById('modal-open-cash-notes')?.value || '';

                    const result = await window.electronAPI.openCash({ openingBalance, notes });

                    if (!result?.success) {
                        throw new Error(result?.error || 'Erro ao abrir caixa');
                    }

                    closeModal();
                    showNotification('Caixa aberto com sucesso!', 'success');
                    await loadCashPanel();

                } catch (error) {
                    console.error(error);
                    showNotification(error.message || 'Erro ao abrir caixa', 'error');
                }
            }
        },
        {
            label: 'Cancelar',
            className: 'btn-secondary',
            onClick: () => closeModal()
        }
    ]);
}

function showCashEntryModal(type = 'entrada') {
    const isExit = type === 'saida';
    const title = isExit ? 'Registrar Saída de Caixa' : 'Registrar Entrada de Caixa';

    const body = `
        <div class="form-row">
            <div class="form-group">
                <label>Valor (R$)</label>
                <input type="number" id="modal-cash-amount" step="0.01" min="0" value="0.00">
            </div>
            <div class="form-group">
                <label>Forma de pagamento</label>
                <select id="modal-cash-payment-method">
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Descrição</label>
            <textarea id="modal-cash-description" rows="3" placeholder="${isExit ? 'Ex: Compra de material' : 'Ex: Recebimento de serviço'}"></textarea>
        </div>
    `;

    showGenericModal(title, body, [
        {
            label: isExit ? '<i class="fas fa-minus-circle"></i> Registrar Saída' : '<i class="fas fa-plus-circle"></i> Registrar Entrada',
            className: isExit ? 'btn-warning' : 'btn-success',
            onClick: async () => {
                try {
                    const amount = Number(document.getElementById('modal-cash-amount')?.value || 0);
                    const payment_method = document.getElementById('modal-cash-payment-method')?.value || 'dinheiro';
                    const description = document.getElementById('modal-cash-description')?.value || (isExit ? 'Saída de caixa' : 'Entrada de caixa');

                    if (amount <= 0) {
                        showNotification('Informe um valor maior que zero', 'warning');
                        return;
                    }

                    const result = await window.electronAPI.saveCashEntry({
                        type,
                        amount,
                        payment_method,
                        description
                    });

                    if (!result?.success) {
                        throw new Error(result?.error || 'Erro ao registrar movimentação');
                    }

                    closeModal();
                    showNotification('Movimentação registrada!', 'success');
                    await loadCashPanel();

                } catch (error) {
                    console.error(error);
                    showNotification(error.message || 'Erro ao registrar movimentação', 'error');
                }
            }
        },
        {
            label: 'Cancelar',
            className: 'btn-secondary',
            onClick: () => closeModal()
        }
    ]);
}

function showCloseCashModal() {
    const body = `
        <div class="form-row">
            <div class="form-group">
                <label>Saldo de fechamento (R$)</label>
                <input type="number" id="modal-closing-balance" step="0.01" min="0" value="0.00">
            </div>
        </div>
        <div class="form-group">
            <label>Observações</label>
            <textarea id="modal-close-cash-notes" rows="3" placeholder="Ex: Fechamento do caixa do dia"></textarea>
        </div>
    `;

    showGenericModal('Fechar Caixa', body, [
        {
            label: '<i class="fas fa-lock"></i> Fechar Caixa',
            className: 'btn-danger',
            onClick: async () => {
                try {
                    const closingBalance = Number(document.getElementById('modal-closing-balance')?.value || 0);
                    const notes = document.getElementById('modal-close-cash-notes')?.value || '';

                    const result = await window.electronAPI.closeCash({ closingBalance, notes });

                    if (!result?.success) {
                        throw new Error(result?.error || 'Erro ao fechar caixa');
                    }

                    closeModal();
                    showNotification('Caixa fechado com sucesso!', 'success');
                    await loadCashPanel();

                } catch (error) {
                    console.error(error);
                    showNotification(error.message || 'Erro ao fechar caixa', 'error');
                }
            }
        },
        {
            label: 'Cancelar',
            className: 'btn-secondary',
            onClick: () => closeModal()
        }
    ]);
}

function viewCashEntry(id) {
    showNotification('Movimentação registrada no histórico do caixa.', 'info');
}

async function loadChecklistPanel() {
    try {
        const [list, services, clients] = await Promise.all([
            window.electronAPI.getChecklists().catch(() => []),
            window.electronAPI.getServices().catch(() => []),
            window.electronAPI.getClients().catch(() => [])
        ]);

        const tbody = document.getElementById('checklists-table-body');

        const total = list.length;
        const entryTotal = list.filter(item => (item.type || '').includes('entrada')).length;
        const exitTotal = list.filter(item => ['saida', 'entrega'].includes(item.type)).length;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('checklists-total', total);
        setText('checklists-entry-total', entryTotal);
        setText('checklists-exit-total', exitTotal);

        if (!tbody) return;

        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">Nenhum checklist cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(item => {
            const service_id = item.service_id || item.service_id || '';
            const service = services.find(s => s.id === service_id);

            const clientId = service?.client_id || service?.clientId || '';
            const client = clients.find(c => c.id === clientId);

            const clientName = client?.name || 'Cliente não identificado';
            const equipment = service?.device_model || service?.equipment || 'Equipamento não informado';
            const osNumber = service?.service_number || service_id.substring(0, 8);

            const typeLabel =
                item.type === 'entrada' ? 'Entrada' :
                item.type === 'saida' ? 'Saída' :
                item.type === 'entrega' ? 'Entrega' :
                item.type || '-';

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(clientName)}</strong><br>
                        <small>OS: ${escapeHtml(String(osNumber))} • ${escapeHtml(equipment)}</small>
                    </td>
                    <td><span class="badge badge-info">${escapeHtml(typeLabel)}</span></td>
                    <td>${escapeHtml(item.observations || item.notes || '-')}</td>
                    <td>${item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                        <div class="actions">
                            <button class="btn-view" title="Visualizar" onclick="viewChecklist('${item.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-delete" title="Excluir" onclick="deleteChecklist('${item.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar checklists:', error);
        showNotification('Erro ao carregar checklists', 'error');
    }
}

async function showChecklistForm() {
    try {
        const services = await window.electronAPI.getServices().catch(() => []);
        if (!services || services.length === 0) {
    showNotification('Cadastre uma OS/Serviço antes de criar um checklist.', 'warning');
    showTab('services');
    return;
}

        const [services, clients] = await Promise.all([
    window.electronAPI.getServices().catch(() => []),
    window.electronAPI.getClients().catch(() => [])
]);

if (!services || services.length === 0) {
    showNotification('Cadastre uma OS/Serviço antes de criar um checklist.', 'warning');
    showTab('services');
    return;
}

const serviceOptions = services.map(service => {
    const clientId = service.client_id || '';
    const client = clients.find(c => c.id === clientId);

    const clientName = client?.name || 'Cliente não identificado';
    const phone = client?.phone ? ` - ${client.phone}` : '';

    const osNumber =
        service.service_number ||
        service.serviceNumber ||
        service.id?.substring(0, 8) ||
        '';

    const equipment =
        service.device_model ||
        service.equipment ||
        service.device ||
        'Equipamento não informado';

    const status =
        service.status === 'orcamento' ? 'Orçamento' :
        service.status === 'em_andamento' ? 'Em andamento' :
        service.status === 'aguardando_peca' ? 'Aguardando peça' :
        service.status === 'finalizado' ? 'Finalizado' :
        service.status === 'entregue' ? 'Entregue' :
        service.status === 'cancelado' ? 'Cancelado' :
        service.status || '';

    const label = `OS ${osNumber} | ${clientName}${phone} | ${equipment} | ${status}`;

    return `<option value="${service.id}">${escapeHtml(label)}</option>`;
    }).join('');

        const body = `
            <div class="form-row">
                <div class="form-group">
                    <label>Serviço / OS</label>
                    <select id="modal-checklist-service" required>
                        <option value="">Selecione um serviço...</option>
                        ${serviceOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Tipo de Checklist</label>
                    <select id="modal-checklist-type">
                        <option value="entrada">Entrada do aparelho</option>
                        <option value="saida">Saída do aparelho</option>
                        <option value="entrega">Entrega ao cliente</option>
                    </select>
                </div>
            </div>

            <div class="form-section">
                <h4><i class="fas fa-mobile-alt"></i> Condição do aparelho</h4>
                <label><input type="checkbox" class="modal-check-item" value="Liga normalmente"> Liga normalmente</label><br>
                <label><input type="checkbox" class="modal-check-item" value="Tela sem trincos aparentes"> Tela sem trincos aparentes</label><br>
                <label><input type="checkbox" class="modal-check-item" value="Touch funcionando"> Touch funcionando</label><br>
                <label><input type="checkbox" class="modal-check-item" value="Câmeras funcionando"> Câmeras funcionando</label><br>
                <label><input type="checkbox" class="modal-check-item" value="Alto-falante funcionando"> Alto-falante funcionando</label><br>
                <label><input type="checkbox" class="modal-check-item" value="Microfone funcionando"> Microfone funcionando</label><br>
                <label><input type="checkbox" class="modal-check-item" value="Conector de carga funcionando"> Conector de carga funcionando</label><br>
                <label><input type="checkbox" class="modal-check-item" value="Biometria/Face ID funcionando"> Biometria/Face ID funcionando</label>
            </div>

            <div class="form-group">
                <label>Observações</label>
                <textarea id="modal-checklist-observations" rows="4" placeholder="Descreva marcas, riscos, trincos, acessórios recebidos ou qualquer observação importante..."></textarea>
            </div>
            
                        <div class="form-group">
                <label>Fotos do aparelho</label>
                <input type="file" id="modal-checklist-photos" accept="image/*" multiple>
                <small style="color:#6c757d; margin-top:6px;">
                    Você pode anexar fotos da frente, traseira, laterais, tela, conector e marcas do aparelho.
                </small>
            </div>

            <div class="form-group">
                <label>Assinatura / responsável</label>
                <input type="text" id="modal-checklist-signature" placeholder="Nome do responsável pelo checklist">
            </div>
        `;

        showGenericModal('Novo Checklist', body, [
            {
                label: '<i class="fas fa-save"></i> Salvar Checklist',
                className: 'btn-primary',
                onClick: async () => {
                    try {
                        const service_id = document.getElementById('modal-checklist-service')?.value || '';
                        const type = document.getElementById('modal-checklist-type')?.value || 'entrada';
                        const observations = document.getElementById('modal-checklist-observations')?.value || '';
                        const technician_signature = document.getElementById('modal-checklist-signature')?.value || '';

                        if (!service_id) {
                            showNotification('Selecione um serviço para o checklist', 'warning');
                            return;
                        }

                        const checkedItems = Array.from(document.querySelectorAll('.modal-check-item')).map(input => ({
                                label: input.value,
                                checked: input.checked
                            }));
                            
                            const photosInput = document.getElementById('modal-checklist-photos');
                            const photos = photosInput ? Array.from(photosInput.files || []) : [];
                            
                            const result = await window.electronAPI.saveChecklist({
                                service_id: service_id,
                                type,
                                items: checkedItems,
                                observations,
                                technician_signature,
                                photos
                            });

                        if (!result?.success) {
                            throw new Error(result?.error || 'Erro ao salvar checklist');
                        }

                        closeModal();
                        showNotification('Checklist salvo com sucesso!', 'success');
                        await loadChecklistPanel();

                    } catch (error) {
                        console.error(error);
                        showNotification(error.message || 'Erro ao salvar checklist', 'error');
                    }
                }
            },
            {
                label: 'Cancelar',
                className: 'btn-secondary',
                onClick: () => closeModal()
            }
        ]);

    } catch (error) {
        console.error(error);
        showNotification('Erro ao abrir formulário de checklist', 'error');
    }
}

async function viewChecklist(id) {
    try {
        const item = await window.electronAPI.getChecklistById(id);

        if (!item) {
            showNotification('Checklist não encontrado', 'error');
            return;
        }

        const [services, clients] = await Promise.all([
            window.electronAPI.getServices().catch(() => []),
            window.electronAPI.getClients().catch(() => [])
        ]);

        const service_id = item.service_id || item.service_id || '';
        const service = services.find(s => s.id === service_id);

        const clientId = service?.client_id || service?.clientId || '';
        const client = clients.find(c => c.id === clientId);

        const clientName = client?.name || 'Cliente não identificado';
        const equipment = service?.device_model || service?.equipment || 'Equipamento não informado';
        const osNumber = service?.service_number || service_id.substring(0, 8);

        const items = Array.isArray(item.items) ? item.items : [];

        const itemsHtml = items.length ? `
            <ul style="margin-left:18px;">
                ${items.map(i => `<li>${i.checked ? '✅' : '⬜'} ${escapeHtml(i.label || String(i))}</li>`).join('')}
            </ul>
        ` : '<p>Nenhum item detalhado.</p>';

        const photos = Array.isArray(item.photos)
            ? item.photos
            : Array.isArray(item.checklist_photos)
                ? item.checklist_photos
                : [];

        const validPhotos = photos
            .map(photo => photo.photo_url || photo.url || photo.publicUrl || photo.public_url || '')
            .filter(Boolean);

        const photosHtml = validPhotos.length ? `
            <hr style="margin:15px 0;">
            <h4>Fotos do aparelho</h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:12px;">
                ${validPhotos.map(url => `
                    <a href="${url}" target="_blank">
                        <img src="${url}" alt="Foto do aparelho" style="width:100%;height:120px;object-fit:cover;border-radius:10px;border:1px solid #ddd;">
                    </a>
                `).join('')}
            </div>
        ` : `
            <hr style="margin:15px 0;">
            <p><strong>Fotos:</strong> Nenhuma foto anexada.</p>
        `;

        const typeLabel =
            item.type === 'entrada' ? 'Entrada' :
            item.type === 'saida' ? 'Saída' :
            item.type === 'entrega' ? 'Entrega' :
            item.type || '-';

        const body = `
            <p><strong>Cliente:</strong> ${escapeHtml(clientName)}</p>
            <p><strong>Equipamento:</strong> ${escapeHtml(equipment)}</p>
            <p><strong>Serviço/OS:</strong> ${escapeHtml(String(osNumber))}</p>
            <p><strong>Tipo:</strong> ${escapeHtml(typeLabel)}</p>
            <p><strong>Data:</strong> ${item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '-'}</p>
            <p><strong>Observações:</strong> ${escapeHtml(item.observations || '-')}</p>

            <hr style="margin:15px 0;">

            <h4>Itens verificados</h4>
            ${itemsHtml}

            ${photosHtml}
        `;

        showGenericModal('Detalhes do Checklist', body, [
            {
                label: 'Fechar',
                className: 'btn-secondary',
                onClick: () => closeModal()
            }
        ]);

    } catch (error) {
        console.error(error);
        showNotification('Erro ao visualizar checklist', 'error');
    }
}

async function deleteChecklist(id) {
    confirmAction('Deseja excluir este checklist?', async () => {
        try {
            const result = await window.electronAPI.deleteChecklist(id);

            if (!result?.success) {
                throw new Error(result?.error || 'Erro ao excluir checklist');
            }

            showNotification('Checklist excluído!', 'success');
            await loadChecklistPanel();

        } catch (error) {
            console.error(error);
            showNotification(error.message || 'Erro ao excluir checklist', 'error');
        }
    });
}

async function loadDashboardPendingPanel() {
    try {
        const [services, parts, sales, cashStatus] = await Promise.all([
            window.electronAPI.getServices().catch(() => []),
            window.electronAPI.getParts().catch(() => []),
            window.electronAPI.getSales().catch(() => []),
            window.electronAPI.getCashStatus
                ? window.electronAPI.getCashStatus().catch(() => ({}))
                : Promise.resolve({})
        ]);

        const tbody = document.getElementById('dashboard-pending-body');

        if (!tbody) return;

        const pendingItems = [];

        services
            .filter(service => {
                const status = service.status || '';
                return ['orcamento', 'em_andamento', 'aguardando_peca'].includes(status);
            })
            .slice(0, 6)
            .forEach(service => {
                const statusName = getServiceStatusName(service.status || 'orcamento');

                pendingItems.push({
                    type: 'Serviço',
                    description: `${service.service_number || service.id?.substring(0, 8) || ''} - ${service.device_model || service.equipment || 'Equipamento'}`,
                    status: statusName,
                    action: 'services'
                });
            });

        parts
            .filter(part => {
                const quantity = Number(part.quantity || 0);
                const minStock = Number(part.min_stock || 0);
                return minStock > 0 && quantity <= minStock;
            })
            .slice(0, 5)
            .forEach(part => {
                pendingItems.push({
                    type: 'Estoque',
                    description: `${part.name || 'Peça'} com ${Number(part.quantity || 0)} unidade(s)`,
                    status: 'Baixo estoque',
                    action: 'parts'
                });
            });

        sales
            .filter(sale => {
                const status = sale.status || '';
                return ['pendente', 'orcamento'].includes(status);
            })
            .slice(0, 5)
            .forEach(sale => {
                pendingItems.push({
                    type: 'Venda',
                    description: `Venda de R$ ${(Number(sale.total_amount ?? sale.total ?? 0) || 0).toFixed(2)}`,
                    status: sale.status || 'Pendente',
                    action: 'sales-history'
                });
            });

        const cashIsOpen =
            cashStatus?.isOpen === true ||
            cashStatus?.is_open === true ||
            cashStatus?.status === 'aberto' ||
            cashStatus?.cash_register?.status === 'aberto';

        pendingItems.push({
            type: 'Caixa',
            description: cashIsOpen ? 'Caixa aberto no momento' : 'Caixa fechado',
            status: cashIsOpen ? 'Aberto' : 'Fechado',
            action: 'cash'
        });

        if (!pendingItems.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data">Nenhuma pendência encontrada</td></tr>';
            return;
        }

        tbody.innerHTML = pendingItems.map(item => `
            <tr>
                <td><strong>${escapeHtml(item.type)}</strong></td>
                <td>${escapeHtml(item.description)}</td>
                <td><span class="badge badge-info">${escapeHtml(item.status)}</span></td>
                <td>
                    <div class="actions">
                        <button class="btn-view" onclick="showTab('${item.action}')" title="Abrir">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar pendências do dashboard:', error);

        const tbody = document.getElementById('dashboard-pending-body');

        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data">Erro ao carregar pendências</td></tr>';
        }
    }
}
async function deleteCashEntry(id) {
    if (!id) {
        showNotification('Movimentação inválida.', 'error');
        return;
    }

    confirmAction('Deseja excluir esta movimentação do caixa?', async () => {
        try {
            const result = await window.electronAPI.deleteCashEntry(id);

            if (!result?.success) {
                throw new Error(result?.error || 'Erro ao excluir movimentação.');
            }

            showNotification('Movimentação excluída com sucesso!', 'success');

            await loadCashPanel();

            if (typeof loadDashboard === 'function') {
                await loadDashboard();
            }

        } catch (error) {
            console.error('Erro ao excluir movimentação:', error);
            showNotification(error.message || 'Erro ao excluir movimentação.', 'error');
        }
    });
}

window.deleteCashEntry = deleteCashEntry;

window.loadCashPanel = loadCashPanel;
window.showOpenCashModal = showOpenCashModal;
window.showCashEntryModal = showCashEntryModal;
window.showCloseCashModal = showCloseCashModal;
window.loadChecklistPanel = loadChecklistPanel;
window.showChecklistForm = showChecklistForm;
window.viewChecklist = viewChecklist;
window.deleteChecklist = deleteChecklist;

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
