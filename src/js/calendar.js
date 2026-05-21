import db from './database';
import { showToast } from './ui_utils';

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function changeMonth(step) {
    currentMonth += step;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
}

export async function renderCalendar() {
    const monthYearDisplay = document.getElementById('monthYearDisplay');
    if (!monthYearDisplay) return;
    
    monthYearDisplay.innerText = `${monthNames[currentMonth]} ${currentYear}`;
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="cal-header">Pzt</div><div class="cal-header">Sal</div><div class="cal-header">Çar</div><div class="cal-header">Per</div><div class="cal-header">Cum</div><div class="cal-header">Cmt</div><div class="cal-header">Paz</div>';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const allEvents = await db.events.toArray();
    const todayStr = new Date().toDateString();

    // DocumentFragment ile DOM manipülasyonunu optimize et
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < startOffset; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'cal-day';
        emptyDay.style.cssText = 'opacity:0.1; cursor:default;';
        fragment.appendChild(emptyDay);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEvents = allEvents.filter(e => e.dateStr === dateStr);
        let eventsHtml = '';

        dayEvents.forEach(e => {
            let colorVar = "var(--info)";
            let bgVar = "rgba(69, 170, 242, 0.15)";
            let textColor = "#fff";

            if (e.category === "Maç") {
                colorVar = "var(--danger)";
                bgVar = "rgba(252, 92, 101, 0.15)";
            } else if (e.category === "Kuvvet") {
                colorVar = "var(--success)";
                bgVar = "rgba(43, 203, 186, 0.15)";
                textColor = "#000";
            }

            eventsHtml += `
            <div class="cal-event" style="background: ${bgVar}; color: ${colorVar}; border-left: 3px solid ${colorVar}; display: flex; flex-direction: column; align-items: flex-start; padding: 10px;" onclick="event.stopPropagation();">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 6px;">
                    <span style="background: ${colorVar}; color: ${textColor}; padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                        ${e.category || 'ANTRENMAN'}
                    </span>
                    <button class="del-btn" style="color: ${colorVar}; font-size: 18px; margin-top: -4px; padding: 0;" onclick="event.stopPropagation(); window.deleteEvent(${e.id})" title="Sil">×</button>
                </div>
                <span style="font-size: 11.5px; font-weight: 600; line-height: 1.3;">${e.title}</span>
            </div>`;
        });

        const isToday = todayStr === new Date(currentYear, currentMonth, i).toDateString() ? 'today' : '';
        const dayEl = document.createElement('div');
        dayEl.className = `cal-day ${isToday}`;
        dayEl.setAttribute('onclick', `window.addEvent('${dateStr}')`);
        dayEl.innerHTML = `<span class="cal-date">${i}</span>${eventsHtml}`;
        fragment.appendChild(dayEl);
    }

    grid.appendChild(fragment);
}

export function addEvent(dateStr) {
    const modal = document.getElementById('eventModal');
    if (!modal) return;
    document.getElementById('modalEventDateHidden').value = dateStr;
    document.getElementById('modalEventDate').innerText = dateStr + " tarihine etkinlik ekliyorsunuz.";
    modal.style.display = 'flex';
}

export function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) modal.style.display = 'none';
    document.getElementById('eTitle').value = '';
    document.getElementById('eTime').value = '';
}

export async function saveCalendarEvent() {
    const dateStr = document.getElementById('modalEventDateHidden').value;
    const title = document.getElementById('eTitle').value;
    const time = document.getElementById('eTime').value;
    const category = document.getElementById('eCategory').value;

    if (!title) {
        showToast("Lütfen etkinlik adını girin!");
        return;
    }

    const displayTitle = time ? `${time} - ${title}` : title;

    try {
        await db.events.add({
            dateStr: dateStr,
            title: displayTitle,
            category: category
        });

        showToast('Etkinlik takvime işlendi!');
        closeEventModal();
        renderCalendar();
    } catch (error) {
        console.error("Kaydetme hatası:", error);
    }
}

export async function deleteEvent(id) {
    if (confirm("Bu etkinliği takvimden silmek istediğinize emin misiniz?")) {
        try {
            await db.events.delete(Number(id));
            showToast("Etkinlik takvimden başarıyla silindi.");
            renderCalendar();
        } catch (error) {
            console.error("Silme hatası:", error);
        }
    }
}
