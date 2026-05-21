import { showToast } from './ui_utils';

export function toggleCategory(el) {
    // el might be the menu-group itself (from HTML: toggleCategory(this.parentElement))
    // or the menu-header (from toggleCategory(this))
    let group;
    if (el && el.classList && el.classList.contains('menu-group')) {
        group = el;
    } else if (el && el.parentElement) {
        group = el.parentElement;
    }
    if (group && group.classList) {
        group.classList.toggle('open');
    }
}

export function switchTab(tabId, menuElement, renderCallbacks = {}) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    // Show target section
    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active'), 50);
    }

    // Update menu active state
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    if (menuElement) menuElement.classList.add('active');

    // Trigger render callback if any
    if (renderCallbacks[tabId]) {
        renderCallbacks[tabId]();
    }

    // Handle mobile/tablet menu close
    if (window.innerWidth <= 1024) {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobileMenuOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.opacity = '0';
        }
    }
}

export function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobileMenuOverlay');
    if (!sidebar) return;

    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.opacity = '0';
        }
    } else {
        sidebar.classList.add('open');
        if (overlay) {
            overlay.style.display = 'block';
            setTimeout(() => {
                overlay.classList.add('active');
                overlay.style.opacity = '1';
            }, 10);
        }
    }
}
