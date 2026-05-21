import db from './database';

const SEED_VERSION_KEY = '__playbook_seed_version__';

/**
 * Playbook Seed Sistemi
 * ---------------------
 * Uygulama ilk açıldığında (veya manifest güncellendiğinde)
 * public/videos/ klasöründeki varsayılan videoları IndexedDB'ye kaydeder.
 * 
 * Videolar Blob olarak DEĞİL, dosya yolu (videoPath) olarak kaydedilir.
 * Bu sayede uygulama boyutu küçük kalır ve videolar doğrudan oynatılır.
 * 
 * Kullanım:
 *   1. public/videos/ klasörüne video dosyalarını koyun
 *   2. public/videos/manifest.json dosyasına video bilgilerini ekleyin
 *   3. Uygulama açıldığında otomatik yüklenir
 */
export async function seedPlaybook() {
    try {
        const response = await fetch('./videos/manifest.json');
        if (!response.ok) {
            console.log('[Seed] manifest.json bulunamadı, seed atlanıyor.');
            return;
        }

        const manifest = await response.json();

        // Eğer video yoksa seed'e gerek yok
        if (!manifest.videos || manifest.videos.length === 0) {
            console.log('[Seed] Manifest boş, seed atlanıyor.');
            return;
        }

        // Daha önce bu versiyon seed edilmiş mi kontrol et
        const existingSeed = await db.table('profile').get(SEED_VERSION_KEY);
        if (existingSeed && existingSeed.version >= manifest.version) {
            console.log('[Seed] Playbook zaten seed edilmiş (v' + existingSeed.version + ').');
            return;
        }

        console.log('[Seed] Playbook seed başlıyor... (v' + manifest.version + ')');

        let addedCount = 0;
        for (const video of manifest.videos) {
            // Aynı ID ile daha önce eklenmiş mi kontrol et
            const existing = await db.playbook
                .where('title')
                .equals(video.title)
                .first();

            if (!existing) {
                await db.playbook.add({
                    title: video.title,
                    category: video.category || 'Kategorisiz',
                    videoPath: './videos/' + video.filename,
                    isDefault: true  // Varsayılan video olduğunu işaretle
                });
                addedCount++;
                console.log('[Seed] ✅ Eklendi: ' + video.title);
            }
        }

        // Seed versiyonunu kaydet
        await db.table('profile').put({
            id: SEED_VERSION_KEY,
            version: manifest.version,
            seededAt: new Date().toISOString()
        });

        console.log('[Seed] 🎬 Playbook seed tamamlandı! ' + addedCount + ' video eklendi.');

    } catch (error) {
        console.warn('[Seed] Playbook seed hatası (ilk kurulumda normal olabilir):', error);
    }
}
