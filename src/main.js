import './styles/main.css';
import db from './js/database';
import { 
    hashPassword, 
    switchAuthTab, 
    checkPasswordStrength, 
    doLogin, 
    doRegister 
} from './js/auth';
import { 
    showToast, 
    playSplashSound 
} from './js/ui_utils';
import { 
    switchTab, 
    toggleCategory, 
    toggleMobileMenu 
} from './js/navigation';
import { 
    renderProfile, 
    saveProfile, 
    handleProfilePhoto 
} from './js/profile';
import { 
    initTacticalBoard 
} from './js/tactical';
import {
    renderCalendar,
    changeMonth,
    addEvent,
    closeEventModal,
    saveCalendarEvent,
    deleteEvent
} from './js/calendar';
import {
    renderPlaybook,
    handlePlaybookUpload,
    deletePlaybookItem,
    filterPlaybook,
    cleanupPlaybookMemory
} from './js/playbook';
import { seedPlaybook } from './js/seedPlaybook';
import {
    renderDashboardData
} from './js/dashboard';
import {
    initGlobalSearch
} from './js/search';

// ✅ Global olarak expose et — inline <script> blokları veya HTML attribute'ları bu fonksiyonlara erişebilir
window.db = db;
window.showToast = showToast;
window.playSplashSound = playSplashSound;

window.doLogin = (email, pass) => {
    const e = email || document.getElementById('loginUser')?.value;
    const p = pass || document.getElementById('loginPass')?.value;
    return doLogin(e, p, enterApp);
};
window.doRegister = (name, email, pass, confirm) => {
    const n = name || document.getElementById('regName')?.value;
    const em = email || document.getElementById('regEmail')?.value;
    const ps = pass || document.getElementById('regPass')?.value;
    const co = confirm || document.getElementById('regPassConfirm')?.value;
    return doRegister(n, em, ps, co);
};

// Şifre sıfırlama fonksiyonu
window.doResetPassword = async () => {
    const email = document.getElementById('forgotEmail')?.value?.trim();
    const newPass = document.getElementById('forgotNewPass')?.value;
    const confirmPass = document.getElementById('forgotNewPassConfirm')?.value;
    const errorEl = document.getElementById('forgotError');
    const successEl = document.getElementById('forgotSuccess');
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';
    if (!email) { 
        if (errorEl) { errorEl.innerText = 'E-posta adresi gereklidir.'; errorEl.style.display = 'block'; }
        return; 
    }
    if (!newPass || newPass.length < 6) { 
        if (errorEl) { errorEl.innerText = 'Yeni şifre en az 6 karakter olmalıdır.'; errorEl.style.display = 'block'; }
        return; 
    }
    if (newPass !== confirmPass) { 
        if (errorEl) { errorEl.innerText = 'Şifreler eşleşmiyor.'; errorEl.style.display = 'block'; }
        return; 
    }
    try {
        if (!db || !db.users) { 
            if (errorEl) { errorEl.innerText = 'Veritabanı hazır değil.'; errorEl.style.display = 'block'; }
            return; 
        }
        const user = await db.users.where('email').equals(email.toLowerCase()).first();
        if (!user) { 
            if (errorEl) { errorEl.innerText = 'Bu e-posta ile kayıtlı hesap bulunamadı.'; errorEl.style.display = 'block'; }
            return; 
        }
        const hashed = await hashPassword(newPass);
        await db.users.update(user.id, { passwordHash: hashed });
        if (successEl) { successEl.innerText = '✅ Şifreniz başarıyla güncellendi! Şimdi giriş yapabilirsiniz.'; successEl.style.display = 'block'; }
        setTimeout(() => switchAuthTab('login'), 2500);
    } catch (e) {
        if (errorEl) { errorEl.innerText = 'Hata: ' + e.message; errorEl.style.display = 'block'; }
    }
};

window.enterApp = enterApp;
window.switchAuthTab = switchAuthTab;
window.checkPasswordStrength = checkPasswordStrength;
window.toggleCategory = toggleCategory;
window.switchTab = (tabId, el) => {
    switchTab(tabId, el, renderCallbacks);
    window.updateBottomNav && window.updateBottomNav(tabId);
};
window.saveProfile = saveProfile;
window.handleProfilePhoto = handleProfilePhoto;
window.toggleMobileMenu = toggleMobileMenu;
window.renderProfile = renderProfile;
window.renderDashboardData = renderDashboardData;
window.renderPlaybook = renderPlaybook;

// Calendar & Playbook Globals
window.changeMonth = changeMonth;
window.addEvent = addEvent;
window.closeEventModal = closeEventModal;
window.saveCalendarEvent = saveCalendarEvent;
window.deleteEvent = deleteEvent;
window.deletePlaybookItem = deletePlaybookItem;
window.filterPlaybook = filterPlaybook;

// Tactical Board global wrappers (HTML inline onclick'ler için)
window.setDrawType = (type, btn) => {
    if (window.tacticalBoard) window.tacticalBoard.setDrawType(type, btn);
};
window.addPiece = (text, type) => {
    if (window.tacticalBoard) window.tacticalBoard.addPiece(text, type);
};
window.clearBoard = () => {
    if (window.tacticalBoard) window.tacticalBoard.clearBoard();
};
window.applyFormation = (name) => {
    if (window.tacticalBoard) window.tacticalBoard.applyFormation(name);
};

// === Tema Değiştirme ===
window.changeAppTheme = (theme) => {
    document.body.classList.remove('theme-red-black', 'theme-blue', 'theme-green');
    if (theme && theme !== 'default') {
        document.body.classList.add(theme);
    }
    try { localStorage.setItem('clutchAppTheme', theme); } catch(e) {}
};

// === Koç Notu Kaydet ===
window.saveCoachNote = (value) => {
    try {
        localStorage.setItem('clutchCoachNote', value);
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) {
            saveStatus.innerText = '✓ Kaydedildi';
            setTimeout(() => { saveStatus.innerText = 'Otomatik kaydediliyor...'; }, 1500);
        }
    } catch(e) {}
};

// === Elite Dropdown ===
window.toggleEliteDropdown = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const isOpen = container.classList.contains('open');
    // Diğer açık dropdown'ları kapat
    document.querySelectorAll('.elite-select-container.open').forEach(c => c.classList.remove('open'));
    if (!isOpen) {
        container.classList.add('open');
        const closeHandler = (e) => {
            if (!container.contains(e.target)) {
                container.classList.remove('open');
                document.removeEventListener('click', closeHandler, true);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler, true), 0);
    }
};

window.selectEliteOption = (containerId, value, callback) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const hidden = container.querySelector('input[type="hidden"]');
    if (hidden) hidden.value = value;
    const trigger = container.querySelector('.elite-select-trigger span');
    if (trigger) trigger.textContent = value;
    container.querySelectorAll('.elite-select-option').forEach(opt => {
        opt.classList.toggle('selected', opt.textContent.trim() === value);
    });
    container.classList.remove('open');
    // Gender icon güncelle
    if (containerId.toLowerCase().includes('gender')) {
        const icon = document.getElementById('dashGenderIcon');
        if (icon) icon.textContent = value === 'Kız' ? '♀️' : '♂️';
    }
    if (typeof callback === 'function') callback();
    else renderDashboardData();
};

// === Veritabanı Export/Import ===
window.exportDatabase = async () => {
    try {
        if (!db) { showToast('Veritabanı hazır değil!'); return; }
        const { exportDB } = await import('dexie-export-import');
        const blob = await exportDB(db, { prettyJson: false });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clutch-backup-${new Date().toISOString().split('T')[0]}.clutch`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✅ Yedek dosyası indirildi!');
    } catch (e) {
        console.error('Export hatası:', e);
        showToast('❌ Dışa aktarma hatası: ' + e.message);
    }
};

window.importDatabase = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
        if (!db) { showToast('Veritabanı hazır değil!'); return; }
        const { importDB } = await import('dexie-export-import');
        const backupStatus = document.getElementById('backupStatus');
        if (backupStatus) { backupStatus.innerText = '⏳ İçe aktarılıyor...'; backupStatus.style.color = 'var(--info)'; }
        await importDB(db, file, { overwriteValues: true, clearTablesBeforeImport: false });
        if (backupStatus) { backupStatus.innerText = '✅ Yedek başarıyla yüklendi! Sayfa yenileniyor...'; backupStatus.style.color = 'var(--success)'; }
        showToast('✅ Veriler başarıyla içe aktarıldı!');
        setTimeout(() => location.reload(), 2000);
    } catch (e) {
        console.error('Import hatası:', e);
        showToast('❌ İçe aktarma hatası: ' + e.message);
    }
};

// === PDF Kütüphanesi ===
window.handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = e.target.result;
            await db.pdfLibrary.add({
                fileName: file.name,
                fileType: file.type,
                fileData: data,
                uploadedAt: new Date().toISOString()
            });
            showToast('✅ Dosya kütüphaneye eklendi!');
            window.renderPdfLibrary && window.renderPdfLibrary();
        };
        reader.readAsDataURL(file);
    } catch (e) {
        showToast('❌ Dosya yükleme hatası: ' + e.message);
    }
};

window.renderPdfLibrary = async () => {
    const container = document.getElementById('pdfLibraryList');
    if (!container || !db) return;
    const files = await db.pdfLibrary.toArray();
    if (files.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:40px;grid-column:1/-1;">Henüz dosya yüklenmedi. PDF veya görsel eklemek için ➕ Dosya Yükle butonunu kullanın.</div>';
        return;
    }
    container.innerHTML = files.map(f => `
        <div class="card" style="display:flex;flex-direction:column;gap:10px;">
            <div style="font-size:13px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.fileType === 'application/pdf' ? '📄' : '🖼️'} ${f.fileName}</div>
            <div style="font-size:11px;color:var(--text-muted);">${new Date(f.uploadedAt).toLocaleDateString('tr-TR')}</div>
            ${f.fileType.startsWith('image/') ? `<img src="${f.fileData}" style="width:100%;border-radius:8px;max-height:150px;object-fit:cover;">` : '<div style="background:rgba(255,107,0,0.1);border:1px dashed rgba(255,107,0,0.3);border-radius:8px;height:80px;display:flex;align-items:center;justify-content:center;color:#ff6b00;font-size:28px;">📄</div>'}
            <button class="btn" style="background:rgba(252,92,101,0.1);color:#fc5c65;border-color:rgba(252,92,101,0.3);" onclick="window.deletePdfItem(${f.id})">🗑️ Sil</button>
        </div>
    `).join('');
};

window.deletePdfItem = async (id) => {
    await db.pdfLibrary.delete(id);
    showToast('Dosya silindi.');
    window.renderPdfLibrary();
};

// Bottom nav aktif sekmeyi güncelle
window.updateBottomNav = function(tabId) {
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabId);
    });
};

const renderCallbacks = {
    'profile': renderProfile,
    'calendar': renderCalendar,
    'playbook': renderPlaybook,
    'dashboard': renderDashboardData,
    'matches': () => { if (window.renderMatches) window.renderMatches(); },
    'scout': () => { if (window.renderScout) window.renderScout(); },
    'addplayer': () => { if (window.renderAddPlayer) window.renderAddPlayer(); },
    'bireysel': () => { if (window.renderBireysel) window.renderBireysel(); },
    'handout': () => { if (window.renderHandouts) window.renderHandouts(); },
    'drills': () => { if (window.renderDrills) window.renderDrills(); },
    'pdf-library': () => { if (window.renderPdfLibrary) window.renderPdfLibrary(); },
    'tactical': () => {
        const canvas = document.getElementById('courtCanvas');
        const draggables = document.getElementById('draggablesContainer');
        const board = document.getElementById('tacticalBoardWrapper');
        if (canvas && draggables && board) {
            if (!window.tacticalBoard) {
                window.tacticalBoard = initTacticalBoard(canvas, draggables, board);
            } else {
                window.tacticalBoard.resize();
                window.tacticalBoard.render();
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[ClutchApp] ✅ DOM Ready, modular system initialized.');

    // Tema yükle
    try {
        const savedTheme = localStorage.getItem('clutchAppTheme');
        if (savedTheme && savedTheme !== 'default') {
            document.body.classList.add(savedTheme);
            const sel = document.getElementById('appThemeSelect');
            if (sel) sel.value = savedTheme;
        }
    } catch(e) {}

    // Koç notunu yükle
    try {
        const savedNote = localStorage.getItem('clutchCoachNote');
        const noteEl = document.getElementById('coachDailyNote');
        if (savedNote && noteEl) noteEl.value = savedNote;
    } catch(e) {}

    // 🎬 Varsayılan playbook videolarını seed et (ilk açılışta)
    await seedPlaybook();

    // Enter tuşu desteği
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen && loginScreen.style.display !== 'none') {
                const activeAuthForm = document.querySelector('.auth-form.active');
                if (activeAuthForm && activeAuthForm.id === 'authLoginForm') {
                    window.doLogin();
                } else if (activeAuthForm && activeAuthForm.id === 'authRegisterForm') {
                    window.doRegister();
                }
            }
        }
    });

    // Playbook Upload listener
    const playbookUpload = document.getElementById('playbookVideoUpload');
    if (playbookUpload) {
        playbookUpload.addEventListener('change', handlePlaybookUpload);
    }

    renderProfile();
    renderDashboardData();
    initGlobalSearch();
    console.log('[ClutchApp] 🚀 System ready.');
    showToast('Sistem Hazır! Giriş yapabilirsiniz.');

    // Module hazır flag
    window.__clutchModuleReady = true;
    document.dispatchEvent(new CustomEvent('clutchReady'));
});

function enterApp(userName) {
    document.getElementById('login-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('login-screen').style.display = 'none';
        const splash = document.getElementById('splash-screen');
        splash.classList.add('active');
        playSplashSound();

        // Particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'splash-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = (Math.random() * 2) + 's';
            const dx = (Math.random() - 0.5) * 100;
            const dy = (Math.random() - 0.5) * 100;
            particle.style.setProperty('--dx', dx + 'px');
            particle.style.setProperty('--dy', dy + 'px');
            splash.appendChild(particle);
        }

        setTimeout(() => {
            splash.classList.add('splash-fadeout');
            setTimeout(() => {
                splash.classList.remove('active');
                splash.style.display = 'none';
                document.getElementById('app-wrapper').style.display = 'flex';
                setTimeout(() => document.getElementById('app-wrapper').style.opacity = '1', 50);
                showToast('Hoş geldin, ' + (userName || 'Koç') + '!');
                window.updateBottomNav && window.updateBottomNav('dashboard');
            }, 800);
        }, 3000);
    }, 500);

    // Dashboard hoş geldin mesajı
    const dashWelcome = document.getElementById('dashWelcomeText');
    if (dashWelcome) {
        const firstName = userName ? userName.split(' ')[0] : '';
        dashWelcome.innerHTML = `Ana Karargah'a Hoş Geldin, Koç ${firstName}! <span>⛹️</span>`;
    }
}
