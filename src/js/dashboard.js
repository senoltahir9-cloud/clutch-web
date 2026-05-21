import db from './database';
import Chart from 'chart.js/auto';

let trendChartInstance = null;

export async function renderDashboardData() {
    try {
        const totalPlayers = await db.players.count();
        const totalMatches = await db.matches.count();
        const playbookCount = await db.playbook.count();
        
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
        const events = await db.events.toArray();
        const weeklyEvents = events.filter(e => new Date(e.dateStr) >= startOfWeek).length;

        const statPlayers = document.getElementById('statTotalPlayers');
        if(statPlayers) statPlayers.innerText = totalPlayers;
        
        const statMatches = document.getElementById('statTotalMatches');
        if(statMatches) statMatches.innerText = totalMatches;
        
        const statPlaybook = document.getElementById('statPlaybookVideos');
        if(statPlaybook) statPlaybook.innerText = playbookCount;
        
        const statEvents = document.getElementById('statWeeklyEvents');
        if(statEvents) statEvents.innerText = weeklyEvents;

        renderRecentMatches();
        renderUpcomingEvents();
        startKosCountdown();
        renderTrendChart();
    } catch (error) {
        console.error("Dashboard render hatası:", error);
    }
}

async function renderRecentMatches() {
    const container = document.getElementById('dashRecentMatches');
    if (!container) return;
    
    const matches = await db.matches.orderBy('date').reverse().limit(5).toArray();
    if (matches.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Henüz maç kaydı bulunamadı.</p>';
        return;
    }

    container.innerHTML = matches.map(m => {
        const scoreArr = m.score ? m.score.split('-') : ['0', '0'];
        const isWin = (parseInt(scoreArr[0]) || 0) > (parseInt(scoreArr[1]) || 0);
        return `
            <div class="dash-match-item">
                <div>
                    <div class="dash-match-teams">${m.teamName} vs ${m.opponent}</div>
                    <div class="dash-match-date">${m.date} | ${m.generation} ${m.leagueLevel ? '- ' + m.leagueLevel : ''}</div>
                </div>
                <div class="dash-match-score ${isWin ? 'win' : 'loss'}">${m.score || '0-0'}</div>
            </div>
        `;
    }).join('');
}

async function renderUpcomingEvents() {
    const container = document.getElementById('dashUpcomingEvents');
    if (!container) return;

    const events = await db.events.toArray();
    const nowStr = new Date().toISOString().split('T')[0];
    const upcoming = events
        .filter(e => e.dateStr >= nowStr)
        .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
        .slice(0, 5);

    if (upcoming.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Yakın zamanda planlanmış etkinlik yok.</p>';
        return;
    }

    container.innerHTML = upcoming.map(e => {
        let dotColor = "var(--info)";
        if (e.category === "Maç") dotColor = "var(--danger)";
        else if (e.category === "Kuvvet") dotColor = "var(--success)";

        return `
            <div class="dash-event-item">
                <div class="dash-event-dot" style="background: ${dotColor};"></div>
                <div class="dash-event-text">${e.title}</div>
                <div class="dash-event-date-label">${e.dateStr}</div>
            </div>
        `;
    }).join('');
}

let _kosIntervalId = null;

function startKosCountdown() {
    const targetDate = new Date("June 23, 2026 00:00:00").getTime();
    const countdownEl = document.getElementById('kosCountdown');

    if (!countdownEl) return;

    // Önceki interval'ı temizle (memory leak önlemi)
    if (_kosIntervalId) {
        clearInterval(_kosIntervalId);
        _kosIntervalId = null;
    }

    const update = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            countdownEl.innerText = "KAMP BAŞLADI! 🚀";
            countdownEl.style.color = "var(--primary-orange)";
            if (_kosIntervalId) {
                clearInterval(_kosIntervalId);
                _kosIntervalId = null;
            }
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        countdownEl.innerText = `${days} Gün ${hours} Saat`;
    };

    update();
    _kosIntervalId = setInterval(update, 60000);
}

async function renderTrendChart() {
    const canvas = document.getElementById('dashTrendChart');
    if (!canvas) return;

    try {
        const matches = await db.matches.orderBy('date').toArray();
        if (matches.length < 2) {
            // Yeterli maç yoksa grafiği gizle veya mesaj göster
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Inter';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Grafik için en az 2 maç kaydı gerekiyor', canvas.width / 2, canvas.height / 2);
            return;
        }

        const labels = [];
        const usData = [];
        const themData = [];

        matches.slice(-10).forEach(m => { // Son 10 maç
            labels.push(m.opponent.length > 10 ? m.opponent.substring(0, 10) + '...' : m.opponent);
            const scores = (m.score || '0-0').split('-');
            usData.push(parseInt(scores[0]) || 0);
            themData.push(parseInt(scores[1]) || 0);
        });

        if (trendChartInstance) {
            trendChartInstance.destroy();
        }

        trendChartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Bizim Sayı',
                        data: usData,
                        borderColor: '#ff6b00',
                        backgroundColor: 'rgba(255, 107, 0, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#ff6b00',
                        pointRadius: 4
                    },
                    {
                        label: 'Rakip Sayı',
                        data: themData,
                        borderColor: '#45aaf2',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4,
                        borderDash: [5, 5],
                        pointBackgroundColor: '#45aaf2',
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ccc', font: { family: 'Inter', size: 12 } }
                    },
                    tooltip: {
                        mode: 'index', intersect: false, backgroundColor: 'rgba(20, 20, 25, 0.9)', titleColor: '#fff', bodyColor: '#ccc', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1
                    }
                },
                scales: {
                    x: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    y: { ticks: { color: '#888' }, grid: { color: 'rgba(255, 255, 255, 0.05)' }, beginAtZero: true }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });

    } catch (error) {
        console.error("Trend grafiği çizilemedi:", error);
    }
}
