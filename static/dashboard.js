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
    const res = await fetch('/api/templates');
    state.templates = await res.json();
}

async function fetchUserResumes() {
    const res = await fetch('/api/user-resumes');
    state.userResumes = await res.json();
}

async function loadAll() {
    await Promise.all([fetchTemplates(), fetchUserResumes()]);
    render();
}

async function toggleFavorite(id) {
    await fetch(`/api/templates/${id}/favorite`, { method: 'PATCH' });
    await fetchTemplates();
    render();
}
 
async function deleteTemplate(id) {
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    await fetchTemplates();
    render();
}

async function deleteUserResume(id) {
    await fetch(`/api/user-resumes/${id}`, { method: 'DELETE' });
    await fetchUserResumes();
    render();
}
 
// ── Filtering ──
function getVisibleTemplates() {
    let list = state.templates;
    if (state.activeTab === 'Favorites') list = list.filter(t => t.is_favorite);
    if (state.search.trim()) {
        const q = state.search.toLowerCase();
        list = list.filter(t => t.name.toLowerCase().includes(q));
    }
    return list;
}

function getVisibleUserResumes() {
    let list = state.userResumes;
    if (state.search.trim()) {
        const q = state.search.toLowerCase();
        list = list.filter(r => r.title.toLowerCase().includes(q) || r.template_name.toLowerCase().includes(q));
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

    let contentHtml;

    if (isRecent) {
        const resumes = getVisibleUserResumes();
        if (resumes.length === 0) {
            contentHtml = `<div class="empty-state">No recent resumes yet. Click a template to get started.</div>`;
        } else {
            contentHtml = `
                <div class="section-title">My Resumes</div>
                <div class="template-list">
                    ${resumes.map(r => `
                        <div class="template-item" data-id="${r.id}" data-href="/edit/${r.id}">
                            <div class="template-name-block">
                                <span class="template-name">${escHtml(r.title || r.person_name || 'Untitled Resume')}</span>
                                <span class="template-meta">
                                    ${r.person_title ? escHtml(r.person_title) + ' · ' : ''}${escHtml(r.template_name)}
                                    ${r.skills && r.skills.length ? ' · ' + r.skills.slice(0,3).map(escHtml).join(', ') : ''}
                                </span>
                                <span class="template-meta">Last edited ${formatDate(r.updated_at)}</span>
                            </div>
                            <div class="template-actions">
                                <button class="delete-btn" data-del-resume="${r.id}" title="Delete">✕</button>
                            </div>
                        </div>
                    `).join('')}
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
                            <div class="template-actions">
                                <button class="star-btn ${t.is_favorite ? 'favorited' : ''}" data-fav="${t.id}" title="Favorite">★</button>
                                <button class="delete-btn" data-del="${t.id}" title="Delete">✕</button>
                            </div>
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
                    placeholder="${isRecent ? 'Search your resumes' : 'Search Templates'}"
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

    // Delete template
    document.querySelectorAll('.delete-btn[data-del]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            if (confirm('Delete this template?')) deleteTemplate(parseInt(btn.dataset.del));
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
loadAll();
