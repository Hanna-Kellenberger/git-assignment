const root = document.getElementById('root');

const tabs = ['Templates', 'Recent', 'Favorites'];
let activeTab = 'Recent';

function render() {
    root.innerHTML = `
        <div class="navbar">
            <div class="navbar-left">
                <div class="brand">ResumaX<span>ing</span></div>
                <input class="search-bar" type="text" placeholder="Search Templates" />
            </div>
            <button class="btn-create">+ Create New Resume</button>
        </div>

        <div class="tabs">
            ${tabs.map(t => `
                <div class="tab ${t === activeTab ? 'active' : ''}" data-tab="${t}">${t}</div>
            `).join('')}
        </div>

        <div class="content">
            <div class="section-title">Template Library</div>
            <div class="template-card">
                <span class="template-name">UT Dallas Resume</span>
                <span class="star">★</span>
            </div>
        </div>
    `;

    root.querySelectorAll('.tab').forEach(el => {
        el.addEventListener('click', () => {
            activeTab = el.dataset.tab;
            render();
        });
    });
}

render();
