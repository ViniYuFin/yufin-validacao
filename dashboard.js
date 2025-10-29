// Configuração inicial
const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal ? 'http://localhost:3001' : 'https://yufin-backend.vercel.app';
const token = localStorage.getItem('adminToken');

console.log('🔍 Ambiente:', isLocal ? 'Local' : 'Produção');
console.log('🔍 API URL:', API_URL);

// Verificar autenticação
if (!token) {
    window.location.href = 'login.html';
}

// ==================== Funções de API ====================

// Carregar dados do dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/api/market-validation/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar dashboard');
        }
        
        const data = await response.json();
        
        // Atualizar estatísticas
        document.getElementById('totalResponses').textContent = data.data.summary.total;
        document.getElementById('avgScore').textContent = Math.round(data.data.summary.avgLeadScore);
        
        // Contar leads quentes
        const highPriorityCount = data.data.priority.find(p => p._id === 'quente')?.count || 0;
        document.getElementById('highPriority').textContent = highPriorityCount;
        
        // Calcular taxa de conversão
        const wouldPayData = data.data.wouldPay;
        const wouldPay = wouldPayData.find(p => ['sim_definitivamente', 'provavelmente'].includes(p._id))?.count || 0;
        const conversionRate = data.data.summary.total > 0 ? Math.round((wouldPay / data.data.summary.total) * 100) : 0;
        document.getElementById('conversionRate').textContent = conversionRate + '%';
        
        // Renderizar gráficos
        renderChart('wouldPayChart', wouldPayData, 'wouldPay');
        renderChart('urgencyChart', data.data.urgency, 'whenStart');
        renderChart('priorityChart', data.data.priority, 'priority');
        renderChart('priceChart', data.data.prices, 'priceRange');
        
        // Renderizar tabela de leads
        renderLeadsTable(data.data.topLeads);
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dashboard. Verifique sua conexão.');
    }
}

// ==================== Funções de Renderização ====================

// Renderizar gráfico
function renderChart(containerId, data, type) {
    const container = document.getElementById(containerId);
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color: #495057;">Sem dados disponíveis</p>';
        return;
    }
    
    const total = data.reduce((sum, item) => sum + item.count, 0);
    const sorted = [...data].sort((a, b) => b.count - a.count);
    
    const labels = {
        wouldPay: {
            'sim_definitivamente': 'Sim, definitivamente',
            'provavelmente': 'Provavelmente sim',
            'talvez': 'Talvez',
            'provavelmente_nao': 'Provavelmente não',
            'nao': 'Não'
        },
        whenStart: {
            'imediato': 'Imediatamente',
            'um_mes': 'Próximos 30 dias',
            'tres_meses': 'Próximos 3 meses',
            'depois': 'Depois, sem pressa'
        },
        priority: {
            'quente': 'Quente',
            'morno': 'Morno',
            'frio': 'Frio'
        },
        priceRange: {
            'gratis': 'Prefiro gratuito',
            '5-10': 'R$ 5-10/mês',
            '10-20': 'R$ 10-20/mês',
            '20-30': 'R$ 20-30/mês',
            '30-50': 'R$ 30-50/mês',
            '50+': 'R$ 50+/mês'
        }
    };
    
    container.innerHTML = sorted.map(item => {
        const percentage = Math.round((item.count / total) * 100);
        return `
            <div class="chart-bar">
                <div class="chart-label">${labels[type]?.[item._id] || item._id}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar-fill" style="width: ${percentage}%">
                        ${percentage}%
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar tabela de leads
function renderLeadsTable(leads) {
    const container = document.getElementById('leadsTable');
    
    if (!leads || leads.length === 0) {
        container.innerHTML = '<p style="color: #495057;">Nenhum lead disponível</p>';
        return;
    }
    
    // Debug: verificar estrutura dos leads
    console.log('🔍 Leads recebidos:', leads);
    console.log('🔍 Primeiro lead:', leads[0]);
    
    // Renderizar tabela (desktop)
    const table = `
        <table class="leads-table">
            <thead>
                <tr>
                    <th>Follow</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Prioridade</th>
                    <th>Disposição de Pagar</th>
                    <th>Urgência</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody>
                ${leads.map(lead => `
                    <tr>
                        <td style="text-align: center;">
                            <input type="checkbox" 
                                   class="followup-checkbox" 
                                   data-lead-id="${lead._id}"
                                   ${lead.needFollowUp ? 'checked' : ''}
                                   onchange="toggleFollowUp('${lead._id}', this.checked)">
                        </td>
                        <td>${lead.name}</td>
                        <td>${lead.email}</td>
                        <td>${lead.phone || '-'}</td>
                        <td>
                            <span class="priority-badge priority-${lead.priority}">${lead.priority}</span>
                        </td>
                        <td>${formatWouldPay(lead.wouldPay)}</td>
                        <td>${formatUrgency(lead.whenStart)}</td>
                        <td>
                            <button onclick="deleteLead('${lead._id}')" class="delete-btn" title="Excluir lead">
                                ×
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Renderizar cards (mobile)
    const cards = leads.map(lead => `
        <div class="lead-card">
            <div class="lead-card-header">
                <div class="lead-card-name">${lead.name}</div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label style="display: flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; color: #6c757d;">
                        <input type="checkbox" 
                               class="followup-checkbox" 
                               data-lead-id="${lead._id}"
                               ${lead.needFollowUp ? 'checked' : ''}
                               onchange="toggleFollowUp('${lead._id}', this.checked)"
                               style="margin: 0;">
                        Follow-up
                    </label>
                    <button onclick="deleteLead('${lead._id}')" class="delete-btn" title="Excluir lead" style="font-size: 1.2rem;">
                        ×
                    </button>
                </div>
            </div>
            <div class="lead-card-row">
                <div class="lead-card-label">Email:</div>
                <div class="lead-card-value">${lead.email}</div>
            </div>
            <div class="lead-card-row">
                <div class="lead-card-label">Telefone:</div>
                <div class="lead-card-value">${lead.phone || '-'}</div>
            </div>
            <div class="lead-card-row">
                <div class="lead-card-label">Prioridade:</div>
                <div class="lead-card-value">
                    <span class="priority-badge priority-${lead.priority}">${lead.priority}</span>
                </div>
            </div>
            <div class="lead-card-row">
                <div class="lead-card-label">Disposição:</div>
                <div class="lead-card-value">${formatWouldPay(lead.wouldPay)}</div>
            </div>
            <div class="lead-card-row" style="border-bottom: none;">
                <div class="lead-card-label">Urgência:</div>
                <div class="lead-card-value">${formatUrgency(lead.whenStart)}</div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = table + cards;
}

// ==================== Funções de Formatação ====================

function formatWouldPay(value) {
    const map = {
        'sim_definitivamente': 'Sim, definitivamente',
        'provavelmente': 'Provavelmente sim',
        'talvez': 'Talvez',
        'provavelmente_nao': 'Provavelmente não',
        'nao': 'Não'
    };
    return map[value] || value;
}

function formatUrgency(value) {
    const map = {
        'imediato': 'Imediatamente',
        'um_mes': '30 dias',
        'tres_meses': '3 meses',
        'depois': 'Sem pressa'
    };
    return map[value] || value;
}

// ==================== Funções de Ação ====================

// Logout
function logout() {
    if (confirm('Deseja fazer logout?')) {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    }
}

// Excluir lead
async function deleteLead(leadId) {
    if (!confirm('Tem certeza que deseja excluir este lead?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/market-validation/${leadId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Lead excluído com sucesso!');
            loadDashboard(); // Recarregar dashboard
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao excluir lead');
        }
    } catch (error) {
        console.error('Erro ao excluir lead:', error);
        alert('Erro ao excluir lead. Tente novamente.');
    }
}

// Toggle follow-up
async function toggleFollowUp(leadId, needFollowUp) {
    try {
        const response = await fetch(`${API_URL}/api/market-validation/${leadId}/followup`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ needFollowUp })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao atualizar follow-up');
        }
        
        console.log('Follow-up atualizado:', needFollowUp);
    } catch (error) {
        console.error('Erro ao atualizar follow-up:', error);
        alert('Erro ao atualizar follow-up. Tente novamente.');
    }
}

// ==================== Inicialização ====================

// Carregar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
});

