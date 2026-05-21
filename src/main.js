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
window.enterApp = enterApp;
window.switchAuthTab = switchAuthTab;
window.checkPasswordStrength = checkPasswordStrength;
window.toggleCategory = toggleCategory;
window.switchTab = (tabId, el) => switchTab(tabId, el, renderCallbacks);
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

const renderCallbacks = {
    'profile': renderProfile,
    'calendar': renderCalendar,
    'playbook': renderPlaybook,
    'dashboard': renderDashboardData,
    'tactical': () => {
        if (!window.tacticalBoard) {
            const canvas = document.getElementById('courtCanvas');
            const draggables = document.getElementById('draggablesContainer');
            const board = document.getElementById('tacticalBoardWrapper');
            if (canvas && draggables && board) {
                window.tacticalBoard = initTacticalBoard(canvas, draggables, board);
            }
        } else {
            window.tacticalBoard.render();
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[ClutchApp] ✅ DOM Ready, modular system initialized.');

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
