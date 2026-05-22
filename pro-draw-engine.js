// === PRO VIDEO OBJECT-BASED DRAWING ENGINE ===
// Tüm çizim araçları sürüklenebilir ve döndürülebilir nesneler olarak saklanır

(function() {
    'use strict';

    // Nesne deposu
    window.proObjects = [];
    window.proSelectedObject = null;
    window.proObjIdCounter = 0;

    // Yeni nesne oluştur
    window.createProObject = function(type, data) {
        var obj = {
            id: ++window.proObjIdCounter,
            type: type,
            x: data.x || 0,
            y: data.y || 0,
            x2: data.x2 || 0,
            y2: data.y2 || 0,
            w: data.w || 0,
            h: data.h || 0,
            radius: data.radius || 0,
            points: data.points || [],
            color: data.color || '#ff4757',
            thickness: data.thickness || 4,
            rotation: data.rotation || 0,
            opacity: data.opacity || 1,
            text: data.text || '',
            fontSize: data.fontSize || 16,
            selected: false
        };
        window.proObjects.push(obj);
        return obj;
    };

    // Nesneyi çiz
    window.drawProObject = function(ctx, obj) {
        ctx.save();
        var cx = obj.x, cy = obj.y;
        if (obj.type === 'rect' || obj.type === 'filledRect' || obj.type === 'zoneMark' || obj.type === 'blur' || obj.type === 'dimArea') {
            cx = obj.x + obj.w / 2;
            cy = obj.y + obj.h / 2;
        }
        if (obj.rotation) {
            ctx.translate(cx, cy);
            ctx.rotate(obj.rotation);
            ctx.translate(-cx, -cy);
        }
        ctx.globalAlpha = obj.opacity;
        ctx.strokeStyle = obj.color;
        ctx.fillStyle = obj.color;
        ctx.lineWidth = obj.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);

        switch (obj.type) {
            case 'pen': case 'telestrator':
                if (obj.points.length < 2) break;
                ctx.beginPath();
                ctx.moveTo(obj.points[0].x, obj.points[0].y);
                for (var i = 1; i < obj.points.length; i++) ctx.lineTo(obj.points[i].x, obj.points[i].y);
                ctx.stroke();
                break;
            case 'highlight':
                if (obj.points.length < 2) break;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = obj.thickness * 5;
                ctx.beginPath();
                ctx.moveTo(obj.points[0].x, obj.points[0].y);
                for (var i = 1; i < obj.points.length; i++) ctx.lineTo(obj.points[i].x, obj.points[i].y);
                ctx.stroke();
                break;
            case 'line':
                ctx.beginPath();
                ctx.moveTo(obj.x, obj.y);
                ctx.lineTo(obj.x2, obj.y2);
                ctx.stroke();
                break;
            case 'dashedLine':
                ctx.setLineDash([10, 6]);
                ctx.beginPath();
                ctx.moveTo(obj.x, obj.y);
                ctx.lineTo(obj.x2, obj.y2);
                ctx.stroke();
                ctx.setLineDash([]);
                break;
            case 'wavyLine':
                var dx = obj.x2 - obj.x, dy = obj.y2 - obj.y;
                var dist = Math.hypot(dx, dy);
                var angle = Math.atan2(dy, dx);
                ctx.beginPath();
                for (var i = 0; i <= dist; i += 2) {
                    var t = i / dist;
                    var px = obj.x + dx * t, py = obj.y + dy * t;
                    var w = Math.sin(i / 10 * Math.PI * 2) * 6;
                    var wx = px + w * Math.cos(angle + Math.PI / 2);
                    var wy = py + w * Math.sin(angle + Math.PI / 2);
                    if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
                }
                ctx.stroke();
                break;
            case 'arrow':
                ctx.beginPath();
                ctx.moveTo(obj.x, obj.y);
                ctx.lineTo(obj.x2, obj.y2);
                var hl = obj.thickness * 4;
                var a = Math.atan2(obj.y2 - obj.y, obj.x2 - obj.x);
                ctx.moveTo(obj.x2, obj.y2);
                ctx.lineTo(obj.x2 - hl * Math.cos(a - Math.PI / 6), obj.y2 - hl * Math.sin(a - Math.PI / 6));
                ctx.moveTo(obj.x2, obj.y2);
                ctx.lineTo(obj.x2 - hl * Math.cos(a + Math.PI / 6), obj.y2 - hl * Math.sin(a + Math.PI / 6));
                ctx.stroke();
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'filledCircle':
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.globalAlpha = 0.35;
                ctx.fill();
                ctx.globalAlpha = obj.opacity;
                ctx.stroke();
                break;
            case 'rect':
                ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
                break;
            case 'filledRect':
                ctx.globalAlpha = 0.35;
                ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
                ctx.globalAlpha = obj.opacity;
                ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
                break;
            case 'triangle':
                var mx = (obj.x + obj.x2) / 2;
                ctx.beginPath();
                ctx.moveTo(mx, obj.y);
                ctx.lineTo(obj.x2, obj.y2);
                ctx.lineTo(obj.x, obj.y2);
                ctx.closePath();
                ctx.stroke();
                break;
            case 'playerCircle':
                var r = obj.radius || 20;
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(69,170,242,0.15)';
                ctx.fill();
                ctx.strokeStyle = '#45aaf2';
                ctx.lineWidth = 3;
                ctx.stroke();
                break;
            case 'movementPath':
                ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(obj.x, obj.y);
                ctx.lineTo(obj.x2, obj.y2);
                ctx.stroke();
                var a = Math.atan2(obj.y2 - obj.y, obj.x2 - obj.x);
                ctx.beginPath();
                ctx.moveTo(obj.x2, obj.y2);
                ctx.lineTo(obj.x2 - 12 * Math.cos(a - 0.5), obj.y2 - 12 * Math.sin(a - 0.5));
                ctx.moveTo(obj.x2, obj.y2);
                ctx.lineTo(obj.x2 - 12 * Math.cos(a + 0.5), obj.y2 - 12 * Math.sin(a + 0.5));
                ctx.stroke();
                break;
            case 'passLine':
                ctx.setLineDash([10, 6]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(obj.x, obj.y); ctx.lineTo(obj.x2, obj.y2);
                ctx.stroke(); ctx.setLineDash([]);
                var a = Math.atan2(obj.y2 - obj.y, obj.x2 - obj.x);
                ctx.beginPath();
                ctx.moveTo(obj.x2, obj.y2);
                ctx.lineTo(obj.x2 - 10 * Math.cos(a - 0.5), obj.y2 - 10 * Math.sin(a - 0.5));
                ctx.moveTo(obj.x2, obj.y2);
                ctx.lineTo(obj.x2 - 10 * Math.cos(a + 0.5), obj.y2 - 10 * Math.sin(a + 0.5));
                ctx.stroke();
                break;
            case 'screenMark':
                ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(obj.x, obj.y); ctx.lineTo(obj.x2, obj.y2);
                ctx.stroke();
                var a = Math.atan2(obj.y2 - obj.y, obj.x2 - obj.x);
                ctx.beginPath();
                ctx.moveTo(obj.x2 - 14 * Math.cos(a + Math.PI / 2), obj.y2 - 14 * Math.sin(a + Math.PI / 2));
                ctx.lineTo(obj.x2 + 14 * Math.cos(a + Math.PI / 2), obj.y2 + 14 * Math.sin(a + Math.PI / 2));
                ctx.stroke();
                break;
            case 'shotMark':
                ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(obj.x, obj.y); ctx.lineTo(obj.x2, obj.y2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(obj.x2, obj.y2, 8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(46,204,113,0.5)'; ctx.fill(); ctx.stroke();
                break;
            case 'zoneMark':
                ctx.globalAlpha = 0.15;
                ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
                ctx.globalAlpha = obj.opacity;
                ctx.setLineDash([6, 4]);
                ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
                ctx.setLineDash([]);
                break;
            case 'spotlight':
                ctx.fillStyle = 'rgba(0,0,0,0.75)';
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.strokeStyle = obj.color; ctx.lineWidth = 3; ctx.stroke();
                break;
            case 'glow':
                ctx.shadowColor = obj.color; ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.strokeStyle = obj.color; ctx.lineWidth = 3; ctx.stroke();
                ctx.shadowBlur = 0;
                break;
            case 'blur': case 'dimArea':
                var alpha2 = obj.type === 'blur' ? 0.6 : 0.7;
                ctx.fillStyle = obj.type === 'blur' ? 'rgba(200,200,200,' + alpha2 + ')' : 'rgba(0,0,0,' + alpha2 + ')';
                ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
                break;
            case 'angleTool':
                if (obj.points.length >= 3) {
                    ctx.beginPath();
                    ctx.moveTo(obj.points[0].x, obj.points[0].y);
                    ctx.lineTo(obj.points[1].x, obj.points[1].y);
                    ctx.lineTo(obj.points[2].x, obj.points[2].y);
                    ctx.stroke();
                    var a1 = Math.atan2(obj.points[0].y - obj.points[1].y, obj.points[0].x - obj.points[1].x);
                    var a2 = Math.atan2(obj.points[2].y - obj.points[1].y, obj.points[2].x - obj.points[1].x);
                    var deg = Math.abs((a2 - a1) * 180 / Math.PI);
                    if (deg > 180) deg = 360 - deg;
                    ctx.font = 'bold 14px Inter'; ctx.fillStyle = obj.color;
                    ctx.fillText(Math.round(deg) + '°', obj.points[1].x + 10, obj.points[1].y - 10);
                }
                break;
            case 'distanceTool':
                ctx.beginPath();
                ctx.moveTo(obj.x, obj.y); ctx.lineTo(obj.x2, obj.y2);
                ctx.stroke();
                var d = Math.round(Math.hypot(obj.x2 - obj.x, obj.y2 - obj.y));
                ctx.font = 'bold 13px Inter'; ctx.fillStyle = obj.color;
                ctx.fillText(d + 'px', (obj.x + obj.x2) / 2 + 5, (obj.y + obj.y2) / 2 - 8);
                break;
            case 'text':
                ctx.font = 'bold ' + obj.fontSize + 'px Inter';
                ctx.fillStyle = obj.color;
                ctx.strokeStyle = 'black'; ctx.lineWidth = 1;
                ctx.strokeText(obj.text, obj.x, obj.y);
                ctx.fillText(obj.text, obj.x, obj.y);
                break;
            case 'zoom':
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.strokeStyle = obj.color; ctx.lineWidth = 3; ctx.stroke();
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius + 2, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.stroke();
                break;
        }

        // Seçim göstergesi
        if (obj.selected) {
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 1;
            var bb = window.getProObjBounds(obj);
            var bx = bb.x - 5, by = bb.y - 5, bw = bb.w + 10, bh = bb.h + 10;
            ctx.strokeRect(bx, by, bw, bh);
            ctx.setLineDash([]);

            // Döndürme tutamacı (üst orta)
            var rcx = bx + bw / 2, rcy = by - 25;
            ctx.beginPath();
            ctx.arc(rcx, rcy, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#00ff88'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(rcx, rcy + 8); ctx.lineTo(rcx, by);
            ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 1; ctx.stroke();

            // 4 Köşe boyutlandırma tutamakları
            var corners = [
                { x: bx, y: by },           // Sol üst
                { x: bx + bw, y: by },      // Sağ üst
                { x: bx, y: by + bh },      // Sol alt
                { x: bx + bw, y: by + bh }  // Sağ alt
            ];
            var hs = 6; // tutamak yarıçapı
            corners.forEach(function(c) {
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 2;
                ctx.fillRect(c.x - hs, c.y - hs, hs * 2, hs * 2);
                ctx.strokeRect(c.x - hs, c.y - hs, hs * 2, hs * 2);
            });

            // Kenar orta noktaları
            var edges = [
                { x: bx + bw / 2, y: by },       // Üst orta
                { x: bx + bw / 2, y: by + bh },  // Alt orta
                { x: bx, y: by + bh / 2 },        // Sol orta
                { x: bx + bw, y: by + bh / 2 }   // Sağ orta
            ];
            var es = 5;
            edges.forEach(function(c) {
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 1.5;
                ctx.fillRect(c.x - es, c.y - es, es * 2, es * 2);
                ctx.strokeRect(c.x - es, c.y - es, es * 2, es * 2);
            });
        }

        ctx.restore();
    };

    // Nesne sınırlarını al
    window.getProObjBounds = function(obj) {
        var pad = 5;
        switch (obj.type) {
            case 'pen': case 'highlight': case 'telestrator':
                if (!obj.points.length) return { x: obj.x, y: obj.y, w: 10, h: 10 };
                var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                obj.points.forEach(function(p) {
                    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
                    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
                });
                return { x: minX, y: minY, w: maxX - minX || 10, h: maxY - minY || 10 };
            case 'circle': case 'filledCircle': case 'playerCircle': case 'spotlight': case 'glow': case 'zoom':
                var r = obj.radius || 20;
                return { x: obj.x - r, y: obj.y - r, w: r * 2, h: r * 2 };
            case 'rect': case 'filledRect': case 'zoneMark': case 'blur': case 'dimArea':
                return { x: Math.min(obj.x, obj.x + obj.w), y: Math.min(obj.y, obj.y + obj.h), w: Math.abs(obj.w), h: Math.abs(obj.h) };
            case 'line': case 'dashedLine': case 'wavyLine': case 'arrow': case 'movementPath': case 'passLine': case 'screenMark': case 'shotMark': case 'distanceTool':
                return { x: Math.min(obj.x, obj.x2), y: Math.min(obj.y, obj.y2), w: Math.abs(obj.x2 - obj.x) || 10, h: Math.abs(obj.y2 - obj.y) || 10 };
            case 'triangle':
                return { x: Math.min(obj.x, obj.x2), y: Math.min(obj.y, obj.y2), w: Math.abs(obj.x2 - obj.x) || 10, h: Math.abs(obj.y2 - obj.y) || 10 };
            case 'angleTool':
                if (!obj.points.length) return { x: 0, y: 0, w: 10, h: 10 };
                var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                obj.points.forEach(function(p) {
                    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
                    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
                });
                return { x: minX, y: minY, w: maxX - minX || 10, h: maxY - minY || 10 };
            case 'text':
                return { x: obj.x, y: obj.y - obj.fontSize, w: obj.text.length * obj.fontSize * 0.6, h: obj.fontSize * 1.2 };
            default:
                return { x: obj.x - 10, y: obj.y - 10, w: 20, h: 20 };
        }
    };

    // Nokta nesne üzerinde mi
    window.hitTestProObj = function(obj, px, py) {
        var bb = window.getProObjBounds(obj);
        return px >= bb.x - 8 && px <= bb.x + bb.w + 8 && py >= bb.y - 8 && py <= bb.y + bb.h + 8;
    };

    // Döndürme tutamacına tıklanıp tıklanmadığını kontrol et
    window.hitTestRotateHandle = function(obj, px, py) {
        var bb = window.getProObjBounds(obj);
        var rcx = bb.x + bb.w / 2, rcy = bb.y - 25;
        return Math.hypot(px - rcx, py - rcy) < 12;
    };

    // Köşe boyutlandırma tutamacına tıklanıp tıklanmadığını kontrol et
    // Döndürülen değer: 'tl', 'tr', 'bl', 'br', 'tc', 'bc', 'ml', 'mr' veya null
    window.hitTestResizeHandle = function(obj, px, py) {
        var bb = window.getProObjBounds(obj);
        var bx = bb.x - 5, by = bb.y - 5, bw = bb.w + 10, bh = bb.h + 10;
        var hs = 10; // hit alanı

        // Köşeler
        if (Math.abs(px - bx) < hs && Math.abs(py - by) < hs) return 'tl';
        if (Math.abs(px - (bx + bw)) < hs && Math.abs(py - by) < hs) return 'tr';
        if (Math.abs(px - bx) < hs && Math.abs(py - (by + bh)) < hs) return 'bl';
        if (Math.abs(px - (bx + bw)) < hs && Math.abs(py - (by + bh)) < hs) return 'br';

        // Kenar ortaları
        if (Math.abs(px - (bx + bw / 2)) < hs && Math.abs(py - by) < hs) return 'tc';
        if (Math.abs(px - (bx + bw / 2)) < hs && Math.abs(py - (by + bh)) < hs) return 'bc';
        if (Math.abs(px - bx) < hs && Math.abs(py - (by + bh / 2)) < hs) return 'ml';
        if (Math.abs(px - (bx + bw)) < hs && Math.abs(py - (by + bh / 2)) < hs) return 'mr';

        return null;
    };

    // Nesneyi boyutlandır (ölçekle)
    window.resizeProObject = function(obj, handle, dx, dy) {
        var bb = window.getProObjBounds(obj);
        var oldW = bb.w || 1;
        var oldH = bb.h || 1;
        var cx = bb.x + bb.w / 2;
        var cy = bb.y + bb.h / 2;

        // Yeni boyutu hesapla
        var scaleX = 1, scaleY = 1;
        if (handle === 'br') { scaleX = (oldW + dx) / oldW; scaleY = (oldH + dy) / oldH; }
        else if (handle === 'bl') { scaleX = (oldW - dx) / oldW; scaleY = (oldH + dy) / oldH; }
        else if (handle === 'tr') { scaleX = (oldW + dx) / oldW; scaleY = (oldH - dy) / oldH; }
        else if (handle === 'tl') { scaleX = (oldW - dx) / oldW; scaleY = (oldH - dy) / oldH; }
        else if (handle === 'tc') { scaleY = (oldH - dy) / oldH; }
        else if (handle === 'bc') { scaleY = (oldH + dy) / oldH; }
        else if (handle === 'ml') { scaleX = (oldW - dx) / oldW; }
        else if (handle === 'mr') { scaleX = (oldW + dx) / oldW; }

        // Min boyut sınırı
        if (scaleX < 0.1) scaleX = 0.1;
        if (scaleY < 0.1) scaleY = 0.1;

        // Tip bazlı boyutlandırma
        var type = obj.type;

        // Daire türleri (radius ölçekle)
        if (['circle', 'filledCircle', 'playerCircle', 'spotlight', 'glow', 'zoom'].indexOf(type) >= 0) {
            var avgScale = (scaleX + scaleY) / 2;
            obj.radius = Math.max(5, (obj.radius || 20) * avgScale);
            return;
        }

        // Dikdörtgen türleri (w, h ölçekle)
        if (['rect', 'filledRect', 'zoneMark', 'blur', 'dimArea'].indexOf(type) >= 0) {
            var newW = obj.w * scaleX;
            var newH = obj.h * scaleY;
            // Anchor noktasına göre pozisyon ayarla
            if (handle === 'tl' || handle === 'ml' || handle === 'bl') obj.x += obj.w - newW;
            if (handle === 'tl' || handle === 'tc' || handle === 'tr') obj.y += obj.h - newH;
            obj.w = newW;
            obj.h = newH;
            return;
        }

        // Çizgi türleri (x2, y2 ölçekle)
        if (['line', 'dashedLine', 'wavyLine', 'arrow', 'movementPath', 'passLine', 'screenMark', 'shotMark', 'distanceTool', 'triangle'].indexOf(type) >= 0) {
            var midX = (obj.x + obj.x2) / 2;
            var midY = (obj.y + obj.y2) / 2;
            obj.x = midX + (obj.x - midX) * scaleX;
            obj.y = midY + (obj.y - midY) * scaleY;
            obj.x2 = midX + (obj.x2 - midX) * scaleX;
            obj.y2 = midY + (obj.y2 - midY) * scaleY;
            return;
        }

        // Freehand türleri (noktaları ölçekle)
        if (['pen', 'highlight', 'telestrator'].indexOf(type) >= 0 && obj.points && obj.points.length) {
            obj.points.forEach(function(p) {
                p.x = cx + (p.x - cx) * scaleX;
                p.y = cy + (p.y - cy) * scaleY;
            });
            return;
        }

        // Text (font size ölçekle)
        if (type === 'text') {
            var avgScale = (scaleX + scaleY) / 2;
            obj.fontSize = Math.max(8, Math.round(obj.fontSize * avgScale));
            return;
        }

        // AngleTool (noktaları ölçekle)
        if (type === 'angleTool' && obj.points && obj.points.length) {
            obj.points.forEach(function(p) {
                p.x = cx + (p.x - cx) * scaleX;
                p.y = cy + (p.y - cy) * scaleY;
            });
            return;
        }
    };

    // Nesneyi taşı
    window.moveProObject = function(obj, dx, dy) {
        obj.x += dx; obj.y += dy;
        if ('x2' in obj) { obj.x2 += dx; obj.y2 += dy; }
        if (obj.points && obj.points.length) {
            obj.points.forEach(function(p) { p.x += dx; p.y += dy; });
        }
    };

    // Tüm nesneleri çiz
    window.renderAllProObjects = function(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.proObjects.forEach(function(obj) {
            window.drawProObject(ctx, obj);
        });
    };

    // Nesneyi sil
    window.deleteProObject = function(id) {
        window.proObjects = window.proObjects.filter(function(o) { return o.id !== id; });
        window.proSelectedObject = null;
    };

    // Son nesneyi geri al
    window.undoLastProObject = function() {
        if (window.proObjects.length > 0) {
            window.proObjects.pop();
            window.proSelectedObject = null;
        }
    };

    // Tüm nesneleri temizle
    window.clearAllProObjects = function() {
        window.proObjects = [];
        window.proSelectedObject = null;
    };

    // Seçimi kaldır
    window.deselectAllProObjects = function() {
        window.proObjects.forEach(function(o) { o.selected = false; });
        window.proSelectedObject = null;
    };

    // Nesne seç (en üstteki)
    window.selectProObjectAt = function(px, py) {
        window.deselectAllProObjects();
        for (var i = window.proObjects.length - 1; i >= 0; i--) {
            if (window.hitTestProObj(window.proObjects[i], px, py)) {
                window.proObjects[i].selected = true;
                window.proSelectedObject = window.proObjects[i];
                return window.proObjects[i];
            }
        }
        return null;
    };

})();
