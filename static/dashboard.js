// ── State ──
let state = {
    templates: [],
    activeTab: 'Templates',
    search: ''
};
 
const root = document.getElementById('root');
 
// ── API helpers ──
async function fetchTemplates() {
    const res = await fetch('/api/templates');
    state.templates = await res.json();
    render();
}
 
async function toggleFavorite(id) {
    await fetch(`/api/templates/${id}/favorite`, { method: 'PATCH' });
    await fetchTemplates();
}
 
async function deleteTemplate(id) {
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    await fetchTemplates();
}
 
// ── Filtering ──
function getVisible() {
    let list = state.templates;
    if (state.activeTab === 'Favorites') list = list.filter(t => t.is_favorite);
    if (state.activeTab === 'Recent') list = [...list].sort((a, b) => b.id - a.id).slice(0, 5);
    if (state.search.trim()) {
        const q = state.search.toLowerCase();
        list = list.filter(t => t.name.toLowerCase().includes(q));
    }
    return list;
}
 
// ── Group by category ──
function groupByCategory(list) {
    return list.reduce((acc, t) => {
        const cat = t.category || 'Resume Template';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(t);
        return acc;
    }, {});
}
 
function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
 
// ── Render ──
function render() {
    const visible = getVisible();
    const grouped = groupByCategory(visible);
 
    root.innerHTML = `
        <div class="topbar">Dashboard</div>
        <div class="dashboard-card">
            <div class="dash-header">
                <img src="/static/assets/logo.svg" alt="Resumaxing" class="dash-logo" />
                <input
                    class="search-bar"
                    type="text"
                    placeholder="Search Templates"
                    id="searchInput"
                    value="${escHtml(state.search)}"
                />
                <button class="btn-create" id="btnCreate">+ Create New Resume</button>
            </div>
 
            <div class="tabs">
                ${['Templates', 'Recent', 'Favorites'].map(tab => `
                    <div class="tab ${state.activeTab === tab ? 'active' : ''}" data-tab="${tab}">${tab}</div>
                `).join('')}
            </div>
 
            <div class="dash-content">
                ${Object.keys(grouped).length === 0
                    ? `<div class="empty-state">No templates found.</div>`
                    : Object.entries(grouped).map(([cat, items]) => `
                        <div class="section-title">${escHtml(cat)}</div>
                        <div class="template-list">
                            ${items.map(t => `
                                <div class="template-item" data-id="${t.id}" data-href="/resume/${t.id}">
                                    <span class="template-name">${escHtml(t.name)}</span>
                                    <div class="template-actions">
                                        <button class="star-btn ${t.is_favorite ? 'favorited' : ''}" data-fav="${t.id}" title="Favorite">★</button>
                                        <button class="delete-btn" data-del="${t.id}" title="Delete">✕</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
            </div>
        </div>
    `;
 
    attachEvents();
}
 
// ── Events ──
function attachEvents() {
    document.getElementById('searchInput').addEventListener('input', e => {
        state.search = e.target.value;
        render();
    });
 
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            state.activeTab = tab.dataset.tab;
            render();
        });
    });
 
    document.getElementById('btnCreate').addEventListener('click', () => {
        window.location.href = '/resume/new';
    });
 
    document.querySelectorAll('.template-item').forEach(item => {
        item.addEventListener('click', e => {
            if (e.target.closest('.star-btn') || e.target.closest('.delete-btn')) return;
            window.location.href = item.dataset.href;
        });
    });
 
    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            toggleFavorite(parseInt(btn.dataset.fav));
        });
    });
 
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            if (confirm('Delete this template?')) deleteTemplate(parseInt(btn.dataset.del));
        });
    });
}
 
// ── Boot ──
fetchTemplates();
 
 