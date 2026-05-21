import db from './database';
import { showToast } from './ui_utils';

export async function hashPassword(password) {
    const salted = password + 'CLUTCH_SALT_2026';
    
    // crypto.subtle is only available in secure contexts (HTTPS / localhost)
    // On iPad Safari over HTTP (local network), we need a fallback
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(salted);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn('[Auth] crypto.subtle failed, using fallback hash:', e);
        }
    }

    // Fallback: simple but consistent hash for non-secure contexts
    console.warn('[Auth] crypto.subtle not available (non-HTTPS), using fallback hash');
    let hash = 0;
    for (let i = 0; i < salted.length; i++) {
        const char = salted.charCodeAt(i);
        hash = ((hash << 5) - hash + char) | 0;
    }
    // Make it look like a hex string and add more entropy
    let result = '';
    let seed = Math.abs(hash);
    for (let i = 0; i < 64; i++) {
        seed = (seed * 31 + salted.charCodeAt(i % salted.length)) | 0;
        result += (Math.abs(seed) % 16).toString(16);
    }
    return result;
}

export function switchAuthTab(tab) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-error, .auth-success').forEach(e => e.style.display = 'none');
    if (tab === 'login') { 
        document.getElementById('authLoginForm').classList.add('active'); 
        document.querySelectorAll('.auth-tab')[0].classList.add('active'); 
    }
    else if (tab === 'register') { 
        document.getElementById('authRegisterForm').classList.add('active'); 
        document.querySelectorAll('.auth-tab')[1].classList.add('active'); 
    }
    else if (tab === 'forgot') { 
        document.getElementById('authForgotForm').classList.add('active'); 
    }
}

export function checkPasswordStrength(val) {
    const bar = document.getElementById('passStrengthBar');
    if (!bar) return;
    bar.className = 'password-strength';
    if (val.length === 0) return;
    if (val.length < 6) bar.classList.add('weak');
    else if (val.length < 10 || !/[A-Z]/.test(val) || !/[0-9]/.test(val)) bar.classList.add('medium');
    else bar.classList.add('strong');
}

export function showAuthError(id, msg) { 
    const el = document.getElementById(id); 
    if (el) { el.innerText = msg; el.style.display = 'block'; } 
}

export function showAuthSuccess(id, msg) { 
    const el = document.getElementById(id); 
    if (el) { el.innerText = msg; el.style.display = 'block'; } 
}

export async function doLogin(email, pass, onEnterApp) {
    console.log('[Auth] doLogin attempt:', email);
    document.querySelectorAll('.auth-error').forEach(e => e.style.display = 'none');
    
    // Null safety
    email = email || '';
    pass = pass || '';
    
    if (!email || !pass) { 
        showAuthError('loginError', 'Lütfen e-posta ve şifre alanlarını doldurun.'); 
        return; 
    }
    
    try {
        if (!db || !db.users) {
            throw new Error('Veritabanı bağlantısı hazır değil. iPad kullanıyorsanız HTTPS bağlantısı gerekebilir.');
        }

        // DB'nin açık olduğundan emin ol
        if (!db.isOpen()) {
            console.log('[Auth] DB kapalı, açılıyor...');
            await db.open();
        }

        const user = await db.users.where('email').equals(email.toLowerCase()).first();
        console.log('[Auth] User found:', user ? 'Yes' : 'No');

        if (!user) { 
            showAuthError('loginError', 'Bu e-posta ile kayıtlı hesap bulunamadı.'); 
            return; 
        }

        const hashed = await hashPassword(pass);
        if (user.passwordHash !== hashed) { 
            showAuthError('loginError', 'Şifre hatalı. Lütfen tekrar deneyin.'); 
            return; 
        }

        console.log('[Auth] Login successful, entering app...');
        if (typeof onEnterApp === 'function') {
            onEnterApp(user.name);
        } else {
            console.error('[Auth] onEnterApp is not a function');
            if (window.enterApp) window.enterApp(user.name);
        }
    } catch (error) { 
        console.error('[Auth] Login error:', error);
        showAuthError('loginError', 'Giriş sırasında bir hata oluştu: ' + error.message); 
    }
}

export async function doRegister(name, email, pass, passConfirm) {
    document.querySelectorAll('.auth-error, .auth-success').forEach(e => e.style.display = 'none');
    
    // Null safety
    name = name || '';
    email = email || '';
    pass = pass || '';
    passConfirm = passConfirm || '';
    
    if (!name) { showAuthError('registerError', 'Lütfen adınızı ve soyadınızı girin.'); return; }
    if (!email || !email.includes('@') || !email.includes('.')) { 
        showAuthError('registerError', 'Geçerli bir e-posta adresi girin.'); 
        return; 
    }
    if (pass.length < 6) { 
        showAuthError('registerError', 'Şifre en az 6 karakter olmalıdır.'); 
        return; 
    }
    if (pass !== passConfirm) { 
        showAuthError('registerError', 'Şifreler eşleşmiyor.'); 
        return; 
    }
    try {
        // iPad Safari'de db null olabilir
        if (!db || !db.users) {
            showAuthError('registerError', 'Veritabanı bağlantısı hazır değil. Sayfayı yenileyip tekrar deneyin. iPad kullanıyorsanız HTTPS bağlantısı gerekebilir.');
            return;
        }
        
        // DB'nin açık olduğundan emin ol
        if (!db.isOpen()) {
            console.log('[Auth] DB kapalı, açılıyor...');
            await db.open();
        }
        
        const existing = await db.users.where('email').equals(email.toLowerCase()).first();
        if (existing) { 
            showAuthError('registerError', 'Bu e-posta adresi zaten kayıtlı.'); 
            return; 
        }
        const hashed = await hashPassword(pass);
        await db.users.add({ 
            name, 
            email: email.toLowerCase(), 
            passwordHash: hashed, 
            createdAt: new Date().toISOString() 
        });
        showAuthSuccess('registerSuccess', '✅ Hesap oluşturuldu! Şimdi giriş yapabilirsiniz.');
        
        setTimeout(() => { 
            switchAuthTab('login'); 
            const loginUserInput = document.getElementById('loginUser');
            if(loginUserInput) loginUserInput.value = email; 
        }, 2000);
    } catch (error) { 
        console.error('[Auth] Register error:', error);
        let msg = 'Kayıt hatası: ' + error.message;
        if (error.name === 'SecurityError' || error.name === 'AbortError' || (error.message && error.message.includes('security'))) {
            msg = 'Veritabanı güvenlik hatası. iPad Safari üzerinden HTTP ile erişim sorunlu olabilir. HTTPS kullanmayı deneyin.';
        }
        showAuthError('registerError', msg); 
    }
}
