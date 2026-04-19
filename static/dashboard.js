// ── State ──
let state = {
    templates: [],
    userResumes: [],
    activeTab: 'Templates',
    search: ''
};

const root = document.getElementById('root');

// ── API helpers ──
async function fetchTemplates() {
    try {
        const res = await fetch('/api/templates', { credentials: 'same-origin' });
        const data = await res.json();
        state.templates = Array.isArray(data) ? data : [];
    } catch (e) {
        state.templates = [];
    }
}

async function fetchUserResumes() {
    try {
        const res = await fetch('/api/user-resumes', { credentials: 'same-origin' });
        const data = await res.json();
        state.userResumes = Array.isArray(data) ? data : [];
    } catch (e) {
        state.userResumes = [];
    }
}

async function loadAll() {
    await Promise.all([fetchTemplates(), fetchUserResumes()]);
    render();
}

async function toggleFavorite(id) {
    const resume = state.userResumes.find(r => r.id === id);
    if (!resume) return;
    await fetch(`/api/user-resumes/${id}/favorite`, { method: 'PATCH', credentials: 'same-origin' });
    await fetchUserResumes();
    render();
}

async function deleteUserResume(id) {
    await fetch(`/api/user-resumes/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    await fetchUserResumes();
    render();
}
 
// ── Filtering ──
function getVisibleTemplates() {
    let list = state.templates;
    if (state.search.trim()) {
        const q = state.search.toLowerCase();
        list = list.filter(t => t.name.toLowerCase().includes(q));
    }
    return list;
}

function getVisibleUserResumes() {
    let list = state.userResumes;
    if (state.activeTab === 'Favorites') list = list.filter(r => r.is_favorite);
    if (state.search.trim()) {
        const q = state.search.toLowerCase();
        list = list.filter(r => (r.title || '').toLowerCase().includes(q));
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

function formatDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return isNaN(d) ? str : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Render ──
function render() {
    const isRecent = state.activeTab === 'Recent';
    const isFavorites = state.activeTab === 'Favorites';
    const showUserResumes = isRecent || isFavorites;

    let contentHtml;

    if (showUserResumes) {
        const resumes = getVisibleUserResumes();
        if (resumes.length === 0) {
            contentHtml = `<div class="empty-state">${isFavorites ? 'No favorites yet. Star a resume to add it here.' : 'No recent resumes yet. Click a template to get started.'}</div>`;
        } else {
            contentHtml = `
                <div class="section-title">${isFavorites ? 'Favorite Resumes' : 'My Resumes'}</div>
                <div class="template-list">
                    ${resumes.map(r => {
                        let parsedContent = {};
                        try { parsedContent = JSON.parse(r.content); } catch(e) {}
                        const displayTitle = r.title && r.title !== 'Your Name' ? r.title : (parsedContent.name || 'Untitled Resume');
                        return `
                        <div class="template-item" data-id="${r.id}" data-href="/edit/${r.id}">
                            <div class="template-name-block">
                                <span class="template-name">${escHtml(displayTitle)}</span>
                                <span class="template-meta">Last edited ${formatDate(r.updated_at)}</span>
                            </div>
                            <div class="template-actions">
                                <button class="star-btn ${r.is_favorite ? 'favorited' : ''}" data-fav="${r.id}" title="Favorite">★</button>
                                <button class="delete-btn" data-del-resume="${r.id}" title="Delete">✕</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            `;
        }
    } else {
        const visible = getVisibleTemplates();
        const grouped = groupByCategory(visible);
        if (Object.keys(grouped).length === 0) {
            contentHtml = `<div class="empty-state">No templates found.</div>`;
        } else {
            contentHtml = Object.entries(grouped).map(([cat, items]) => `
                <div class="section-title">${escHtml(cat)}</div>
                <div class="template-list">
                    ${items.map(t => `
                        <div class="template-item" data-id="${t.id}" data-href="/resume/${t.id}">
                            <span class="template-name">${escHtml(t.name)}</span>
                        </div>
                    `).join('')}
                </div>
            `).join('');
        }
    }

    root.innerHTML = `
        <div class="topbar">Dashboard</div>
        <div class="dashboard-card">
            <div class="dash-header">
                <img src="/static/assets/logo.svg" alt="Resumaxing" class="dash-logo" />
                <input
                    class="search-bar"
                    type="text"
                    placeholder="${showUserResumes ? 'Search your resumes' : 'Search Templates'}"
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
                ${contentHtml}
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
            state.search = '';
            render();
        });
    });
 
    document.getElementById('btnCreate').addEventListener('click', () => {
        // Switch to Templates tab so user picks a template
        state.activeTab = 'Templates';
        render();
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

    // Delete user resume
    document.querySelectorAll('.delete-btn[data-del-resume]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            if (confirm('Delete this resume?')) deleteUserResume(parseInt(btn.dataset.delResume));
        });
    });
}
 
// ── Boot ──
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('tab') === 'recent') state.activeTab = 'Recent';
loadAll();
