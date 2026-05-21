import db from './database.js';

let searchModal = null;
let searchInput = null;
let searchResults = null;

export function initGlobalSearch() {
    searchModal = document.getElementById('globalSearchModal');
    searchInput = document.getElementById('globalSearchInput');
    searchResults = document.getElementById('globalSearchResults');

    // Klavye kısayolu (Ctrl+K veya Cmd+K)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault(); // Tarayıcının arama çubuğunu engelle
            window.openGlobalSearch();
        }
        if (e.key === 'Escape' && searchModal && searchModal.style.display === 'flex') {
            window.closeGlobalSearch();
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });
    }

    // Modal dışına tıklayınca kapatma
    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) window.closeGlobalSearch();
        });
    }

    // Global erişim
    window.openGlobalSearch = () => {
        if (searchModal) {
            searchModal.style.display = 'flex';
            setTimeout(() => searchInput.focus(), 50); // Modal açıldıktan sonra focus
            searchInput.value = '';
            searchResults.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">Aramak için yazmaya başlayın...</div>';
        }
    };

    window.closeGlobalSearch = () => {
        if (searchModal) searchModal.style.display = 'none';
    };
}

async function performSearch(query) {
    if (!query || query.trim().length < 2) {
        searchResults.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">Aramak için en az 2 karakter yazın...</div>';
        return;
    }

    query = query.toLowerCase().trim();
    searchResults.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">Aranıyor...</div>';

    try {
        const players = await db.players.toArray();
        const matches = await db.matches.toArray();
        const playbook = await db.playbook.toArray();
        const events = await db.events.toArray();

        const results = [];

        // Oyuncular
        players.filter(p => p.name.toLowerCase().includes(query)).forEach(p => {
            results.push({ type: 'Oyuncu', title: p.name, desc: `${p.pos || 'Pos Belirsiz'} | Gen: ${p.generation || '?'}`, action: `window.switchSection('players')`, icon: '👤', color: '#45aaf2' });
        });

        // Maçlar
        matches.filter(m => (m.opponent && m.opponent.toLowerCase().includes(query)) || (m.teamName && m.teamName.toLowerCase().includes(query))).forEach(m => {
            results.push({ type: 'Maç', title: `${m.teamName} vs ${m.opponent}`, desc: `${m.date} | Skor: ${m.score}`, action: `window.switchSection('matches')`, icon: '🏆', color: '#fc5c65' });
        });

        // Playbook
        playbook.filter(p => p.title.toLowerCase().includes(query) || (p.category && p.category.toLowerCase().includes(query))).forEach(p => {
            results.push({ type: 'Taktik', title: p.title, desc: p.category, action: `window.switchSection('playbook')`, icon: '📋', color: '#f1c40f' });
        });

        // Etkinlikler
        events.filter(e => e.title.toLowerCase().includes(query)).forEach(e => {
            results.push({ type: 'Etkinlik', title: e.title, desc: e.dateStr, action: `window.switchSection('dashboard')`, icon: '📅', color: '#2bcbba' });
        });

        if (results.length === 0) {
            searchResults.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">Hiçbir sonuç bulunamadı.</div>';
            return;
        }

        searchResults.innerHTML = results.map(r => `
            <div onclick="${r.action}; window.closeGlobalSearch();" style="display: flex; align-items: center; padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.03);" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
                <div style="width: 40px; height: 40px; border-radius: 8px; background: ${r.color}20; color: ${r.color}; display: flex; justify-content: center; align-items: center; font-size: 18px; margin-right: 15px;">
                    ${r.icon}
                </div>
                <div style="flex: 1;">
                    <div style="color: #fff; font-weight: 600; font-size: 14px;">${r.title}</div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-top: 3px;">${r.desc}</div>
                </div>
                <div style="font-size: 11px; padding: 3px 8px; border-radius: 12px; background: rgba(255,255,255,0.1); color: #ccc;">
                    ${r.type}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Arama hatası:", error);
        searchResults.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--danger); font-size: 13px;">Arama sırasında bir hata oluştu.</div>';
    }
}
