import Dexie from 'dexie';
import 'dexie-export-import';

let db;

try {
    db = new Dexie("EliteAppDB_v1");

    db.version(13).stores({
        players: '++id, name, pos, stars, stats, height, weight, wingspan, shoeSize',
        events: '++id, dateStr, title, category',
        playbook: '++id, title, category, videoPath',
        matches: '++id, teamName, generation, gender, opponent, date, score',
        pdfLibrary: '++id, fileName, fileType',
        coachNotes: 'id',
        bireysel: '++id, name',
        trainings: '++id, type, note, date, season, attendance',
        drills: '++id, title, category',
        handouts: '++id, opponentName, category, date',
        users: '++id, &email, name, passwordHash, createdAt',
        profile: 'id'
    });

    // iPad Safari HTTP üzerinden IndexedDB'yi test et
    db.open().then(() => {
        console.log('[DB] ✅ Dexie veritabanı başarıyla açıldı.');
    }).catch(err => {
        console.error('[DB] ❌ Dexie açma hatası:', err);
        // iPad Safari'de HTTP üzerinden IndexedDB sorunlu olabilir
        if (err.name === 'SecurityError' || err.message.includes('security')) {
            console.error('[DB] ⚠️ iPad Safari HTTP üzerinden güvenlik hatası. HTTPS kullanmayı deneyin.');
            alert('iPad Safari üzerinden güvenli olmayan bağlantı (HTTP) ile veritabanına erişilemiyor. Lütfen HTTPS kullanın veya Safari ayarlarından "Cross-Site Tracking" seçeneğini kapatın.');
        }
    });
} catch (e) {
    console.error('[DB] ❌ Dexie oluşturma hatası:', e);
    db = null;
}

export default db;
