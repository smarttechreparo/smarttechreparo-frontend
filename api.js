const API_URL = 'https://smarttechreparo-backend-production.up.railway.app/api';

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(json.error || 'Erro na comunicação com a API.');
    }

    return json;
}

window.api = {
    clients: {
        getAll: async () => {
            const result = await requestJson(`${API_URL}/clients`);
            return result.data || [];
        },

        save: async (client) => {
            const isEdit = !!client.id;

            const url = isEdit
                ? `${API_URL}/clients/${client.id}`
                : `${API_URL}/clients`;

            const method = isEdit ? 'PUT' : 'POST';

            return requestJson(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...client,
                    phone: (client.phone || '').replace(/\D/g, ''),
                    document: (client.document || '').replace(/\D/g, ''),
                    cep: (client.cep || '').replace(/\D/g, '')
                })
            });
        },

        delete: async (id) => {
            return requestJson(`${API_URL}/clients/${id}`, {
                method: 'DELETE'
            });
        }
    },

    suppliers: {
        getAll: async () => {
            const result = await requestJson(`${API_URL}/suppliers`);
            return result.data || [];
        },

        save: async (supplier) => {
            const isEdit = !!supplier.id;

            const url = isEdit
                ? `${API_URL}/suppliers/${supplier.id}`
                : `${API_URL}/suppliers`;

            return requestJson(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...supplier,
                    phone: (supplier.phone || '').replace(/\D/g, ''),
                    document: (supplier.document || '').replace(/\D/g, '')
                })
            });
        },

        delete: async (id) => {
            return requestJson(`${API_URL}/suppliers/${id}`, {
                method: 'DELETE'
            });
        }
    },

    parts: {
        getAll: async () => {
            const result = await requestJson(`${API_URL}/parts`);
            return result.data || [];
        },

        save: async (part) => {
            const isEdit = !!part.id;

            const url = isEdit
                ? `${API_URL}/parts/${part.id}`
                : `${API_URL}/parts`;

            return requestJson(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: part.name || '',
                    code: part.code || '',
                    quantity: Number(part.quantity) || 0,
                    cost_price: Number(part.cost_price) || 0,
                    sale_price: Number(part.sale_price) || 0,
                    supplier_id: part.supplier_id || null,
                    min_stock: Number(part.min_stock) || 0
                })
            });
        },

        delete: async (id) => {
            return requestJson(`${API_URL}/parts/${id}`, {
                method: 'DELETE'
            });
        }
    }
};
