import db from './database';
import { showToast } from './ui_utils';

let currentPlaybookFilter = 'Tümü';
window._playbookBlobUrls = new Map();
window._playbookObserver = null;

export function cleanupPlaybookMemory() {
    if (window._playbookBlobUrls && window._playbookBlobUrls.size > 0) {
        window._playbookBlobUrls.forEach((url) => {
            URL.revokeObjectURL(url);
        });
        window._playbookBlobUrls.clear();
    }
    if (window._playbookObserver) {
        window._playbookObserver.disconnect();
        window._playbookObserver = null;
    }
}

export async function renderPlaybook() {
    const list = document.getElementById('playbookList');
    if (!list) return;
    list.innerHTML = "";

    cleanupPlaybookMemory();

    try {
        let items = await db.playbook.toArray();

        if (currentPlaybookFilter !== 'Tümü') {
            items = items.filter(item => item.category === currentPlaybookFilter);
        }

        if (items.length === 0) {
            list.innerHTML = `<div style='color:var(--text-muted); width:100%; grid-column: 1 / -1; text-align:center; padding:40px; border:2px dashed #333; border-radius:12px;'>Bu kategoride henüz video yok.</div>`;
            return;
        }

        window._playbookObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const videoEl = entry.target;
                    const videoId = parseInt(videoEl.dataset.playbookId);
                    const hasBlob = videoEl.dataset.hasBlob === 'true';

                    if (hasBlob && !window._playbookBlobUrls.has(videoId)) {
                        db.playbook.get(videoId).then(item => {
                            if (item && item.videoBlob) {
                                const blobUrl = URL.createObjectURL(item.videoBlob);
                                window._playbookBlobUrls.set(videoId, blobUrl);
                                videoEl.src = blobUrl;
                            }
                        });
                    } else if (!hasBlob && videoEl.dataset.videoPath) {
                        videoEl.src = videoEl.dataset.videoPath;
                    }
                    window._playbookObserver.unobserve(videoEl);
                }
            });
        }, { rootMargin: '200px' });

        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const catTag = item.category && item.category !== 'Kategorisiz Seçim' ? item.category : 'Kategorisiz';
            const isDefault = item.isDefault === true;

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div style="display:flex; flex-direction: column; gap: 8px; margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:16px;">${item.title}</h3>
                        ${isDefault 
                            ? '<span style="font-size:11px; color:var(--accent); opacity:0.7;">📦 Varsayılan</span>' 
                            : `<button class="btn" style="background:transparent; color:var(--danger); padding:0; font-size:13px;" onclick="window.deletePlaybookItem(${item.id})">Sil</button>`}
                    </div>
                    <div><span class="tag highlight">${catTag}</span></div>
                </div>
            `;

            const video = document.createElement('video');
            video.style.cssText = 'width:100%; height:200px; background:#000; border-radius:8px; outline:none;';
            video.controls = true;
            video.preload = 'none';
            video.dataset.playbookId = item.id;
            video.dataset.hasBlob = item.videoBlob ? 'true' : 'false';
            if (item.videoPath) video.dataset.videoPath = item.videoPath;

            if (window._playbookBlobUrls.has(item.id)) {
                video.src = window._playbookBlobUrls.get(item.id);
            }

            card.appendChild(video);
            fragment.appendChild(card);
            window._playbookObserver.observe(video);
        });

        list.appendChild(fragment);

    } catch (error) {
        console.error("Playbook render hatası:", error);
    }
}

export async function handlePlaybookUpload(e) {
    try {
        const file = e.target.files[0];
        if (!file) return;

        const titleInput = document.getElementById('playbookVideoTitle');
        const title = titleInput.value.trim();
        const categoryInput = document.getElementById('playbookVideoCategory');
        const category = categoryInput.value;

        if (!title) {
            showToast("Lütfen önce videonun adını yazın!");
            e.target.value = '';
            return;
        }

        await db.playbook.add({
            title: title,
            category: category,
            videoBlob: file
        });

        showToast('Video başarıyla Playbook arşiviyle senkronize edildi!');
        e.target.value = '';
        titleInput.value = '';
        categoryInput.selectedIndex = 0;

        renderPlaybook();
    } catch (error) {
        console.error("Video yükleme hatası:", error);
    }
}

export async function deletePlaybookItem(id) {
    if (confirm('Bu videoyu silmek istiyor musunuz?')) {
        if (window._playbookBlobUrls.has(id)) {
            URL.revokeObjectURL(window._playbookBlobUrls.get(id));
            window._playbookBlobUrls.delete(id);
        }
        await db.playbook.delete(id);
        showToast('Video silindi.');
        renderPlaybook();
    }
}

export function filterPlaybook(category, btnElement) {
    currentPlaybookFilter = category;
    document.querySelectorAll('#playbookFilters .btn').forEach(btn => btn.classList.remove('active-tool'));
    if(btnElement) btnElement.classList.add('active-tool');
    renderPlaybook();
}
