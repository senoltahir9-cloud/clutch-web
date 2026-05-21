import { showToast } from './ui_utils';

let isDrawing = false;
let startX = 0;
let startY = 0;
let lastX = 0;
let lastY = 0;
let drawType = 'run';
let tacticalDrawings = [];
let selectedObject = null;
let selectedHandle = null;
let dragStartX, dragStartY;

export function initTacticalBoard(canvas, draggablesContainer, boardWrapper) {
    const ctx = canvas.getContext('2d');

    function renderTacticalCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        tacticalDrawings.forEach(draw => {
            const isSelected = (selectedObject === draw);
            drawBasketballLine(ctx, draw, isSelected);
        });

        if (selectedObject) {
            drawHandles(ctx, selectedObject);
        }
    }

    function drawHandles(ctx, obj) {
        const points = [];
        if (obj.x1 !== undefined) points.push({ x: obj.x1, y: obj.y1, type: 'p1' });
        if (obj.x2 !== undefined) points.push({ x: obj.x2, y: obj.y2, type: 'p2' });
        if (obj.cpx !== undefined) points.push({ x: obj.cpx, y: obj.cpy, type: 'cp' });

        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.type === 'cp' ? 5 : 6, 0, Math.PI * 2);
            ctx.fillStyle = p.type === 'cp' ? '#f1c40f' : '#fff';
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    }

    // Canvas Events
    canvas.addEventListener('mousedown', (e) => {
        const x = e.offsetX, y = e.offsetY;
        
        selectedHandle = getHandleAt(x, y);
        if (selectedHandle) {
            isDrawing = true;
            canvas.style.cursor = 'crosshair';
            return;
        }

        const obj = getObjectAt(x, y);
        if (obj) {
            selectedObject = obj;
            isDrawing = true;
            dragStartX = x; dragStartY = y;
            canvas.style.cursor = 'grabbing';
            renderTacticalCanvas();
            return;
        }

        if (drawType !== 'select') {
            selectedObject = null;
            isDrawing = true;
            const isShape = (drawType === 'drawCircle' || drawType === 'drawRect' || drawType === 'highlight' || drawType === 'shot');
            if (isShape) {
                startX = x; startY = y;
            } else {
                const snap = getSnappedPoint(x, y);
                startX = snap.x; startY = snap.y;
            }
            lastX = x; lastY = y;
        } else {
            selectedObject = null;
            renderTacticalCanvas();
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const x = e.offsetX, y = e.offsetY;
        if (!isDrawing) {
            if (getHandleAt(x, y)) canvas.style.cursor = 'pointer';
            else if (getObjectAt(x, y)) canvas.style.cursor = 'grab';
            else if (drawType !== 'select') canvas.style.cursor = 'crosshair';
            else canvas.style.cursor = 'default';
            return;
        }

        if (selectedHandle) {
            const { obj, type } = selectedHandle;
            if (type === 'p1') { obj.x1 = x; obj.y1 = y; }
            else if (type === 'p2') { obj.x2 = x; obj.y2 = y; }
            else if (type === 'cp') { obj.cpx = x; obj.cpy = y; }
            renderTacticalCanvas();
            return;
        }

        if (selectedObject && dragStartX !== undefined) {
             const dx = x - dragStartX;
             const dy = y - dragStartY;
             selectedObject.x1 += dx; selectedObject.y1 += dy;
             selectedObject.x2 += dx; selectedObject.y2 += dy;
             if (selectedObject.cpx !== undefined) {
                 selectedObject.cpx += dx; selectedObject.cpy += dy;
             }
             dragStartX = x; dragStartY = y;
             renderTacticalCanvas();
             return;
        }

        if (drawType === 'select') return;

        renderTacticalCanvas();
        const isShape = (drawType === 'drawCircle' || drawType === 'drawRect' || drawType === 'highlight');
        if (isShape) {
            drawBasketballLine(ctx, { type: drawType, x1: startX, y1: startY, x2: x, y2: y });
        } else {
            const snap = getSnappedPoint(x, y);
            const midX = (startX + snap.x) / 2;
            const midY = (startY + snap.y) / 2;
            drawBasketballLine(ctx, { type: drawType, x1: startX, y1: startY, x2: snap.x, y2: snap.y, cpx: midX, cpy: midY });
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!isDrawing) return;
        isDrawing = false;
        const x = e.offsetX, y = e.offsetY;

        if (selectedHandle || (selectedObject && dragStartX !== undefined)) {
            selectedHandle = null;
            dragStartX = undefined;
            if (selectedObject) canvas.style.cursor = 'grab';
            return;
        }

        if (drawType === 'select') return;

        const isShape = (drawType === 'drawCircle' || drawType === 'drawRect' || drawType === 'highlight');
        let endX = x, endY = y;
        if (!isShape) {
            const snap = getSnappedPoint(x, y);
            endX = snap.x; endY = snap.y;
        }

        if (Math.hypot(endX - startX, endY - startY) > 5 || isShape) {
            const newObj = {
                type: drawType,
                x1: startX, y1: startY,
                x2: endX, y2: endY
            };
            
            if (['run', 'pass', 'dribble', 'screen', 'highlight', 'handoff', 'shot'].includes(drawType)) {
                newObj.cpx = (startX + endX) / 2;
                newObj.cpy = (startY + endY) / 2;
            }
            
            tacticalDrawings.push(newObj);
            selectedObject = newObj; 
        }
        renderTacticalCanvas();
    });

    canvas.addEventListener('contextmenu', (e) => {
        if (drawType === 'select') {
            e.preventDefault();
            const obj = getObjectAt(e.offsetX, e.offsetY);
            if (obj) {
                tacticalDrawings = tacticalDrawings.filter(o => o !== obj);
                renderTacticalCanvas();
                showToast('Çizim silindi.');
            }
        }
    });

    // Piece Interaction Logic
    let activePiece = null;
    let isRotating = false;
    let startPieceAngle = 0;
    let startPieceRotation = 0;

    const handlePieceMouseDown = (e) => {
        const piece = e.target.closest('.draggable-piece');
        if (!piece) return;

        activePiece = piece;
        const id = piece.dataset.id;
        const pieceData = tacticalDrawings.find(d => d.id === id);

        if (e.target.classList.contains('rotate-handle')) {
            isRotating = true;
            const rect = piece.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            startPieceAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            startPieceRotation = pieceData.rotation || 0;
        } else {
            piece.style.cursor = 'grabbing';
            const rect = boardWrapper.getBoundingClientRect();
            dragStartX = e.clientX - rect.left - pieceData.x;
            dragStartY = e.clientY - rect.top - pieceData.y;
        }

        const onMouseMove = (moveEvent) => {
            if (!activePiece) return;
            const data = tacticalDrawings.find(d => d.id === activePiece.dataset.id);

            if (isRotating) {
                const rect = activePiece.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                const rotation = startPieceRotation + (currentAngle - startPieceAngle) * (180 / Math.PI);
                data.rotation = rotation;
            } else {
                const rect = boardWrapper.getBoundingClientRect();
                data.x = moveEvent.clientX - rect.left - dragStartX;
                data.y = moveEvent.clientY - rect.top - dragStartY;
            }
            updatePiecePosition(activePiece, data);
        };

        const onMouseUp = () => {
            if (activePiece) activePiece.style.cursor = 'grab';
            activePiece = null;
            isRotating = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    draggablesContainer.addEventListener('mousedown', handlePieceMouseDown);

    const updatePiecePosition = (el, data) => {
        el.style.left = `${data.x}px`;
        el.style.top = `${data.y}px`;
        el.style.transform = `rotate(${data.rotation || 0}deg)`;
    };

    const addPiece = (text, type, x = 100, y = 100) => {
        const id = 'piece_' + Date.now();
        const drawing = { id, type: 'piece', pieceType: type, text, x, y, rotation: 0 };
        tacticalDrawings.push(drawing);

        const el = document.createElement('div');
        el.className = `draggable-piece piece-${type}`;
        el.dataset.id = id;
        el.innerText = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        
        const handle = document.createElement('div');
        handle.className = 'rotate-handle';
        el.appendChild(handle);

        draggablesContainer.appendChild(el);
        return el;
    };

    const clearBoard = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draggablesContainer.innerHTML = '';
        tacticalDrawings = [];
        showToast('Taktik tahtası temizlendi.');
    };

    const applyFormation = (name) => {
        draggablesContainer.innerHTML = '';
        tacticalDrawings = [];
        const w = canvas.width, h = canvas.height;
        
        if (name === '5out') {
            addPiece('1', 'offense', w * 0.45, h * 0.75);
            addPiece('2', 'offense', w * 0.20, h * 0.60);
            addPiece('3', 'offense', w * 0.70, h * 0.60);
            addPiece('4', 'offense', w * 0.15, h * 0.35);
            addPiece('5', 'offense', w * 0.75, h * 0.35);
        } else if (name === 'zone23') {
            addPiece('X1', 'defense', w * 0.35, h * 0.60);
            addPiece('X2', 'defense', w * 0.55, h * 0.60);
            addPiece('X3', 'defense', w * 0.20, h * 0.35);
            addPiece('X4', 'defense', w * 0.45, h * 0.30);
            addPiece('X5', 'defense', w * 0.70, h * 0.35);
        }
        renderTacticalCanvas();
    };

    return {
        setDrawType: (type, btn) => {
            drawType = type;
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active-tool'));
            if (btn) btn.classList.add('active-tool');
            canvas.style.cursor = (type === 'select') ? 'default' : 'crosshair';
            if (type !== 'select') {
                selectedObject = null;
                renderTacticalCanvas();
            }
        },
        addPiece,
        clearBoard,
        applyFormation,
        render: renderTacticalCanvas
    };
}

function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = Math.hypot(x1 - x2, y1 - y2) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function getPointOnBezier(t, p1, cp, p2) {
    const x = (1 - t) ** 2 * p1.x + 2 * (1 - t) * t * cp.x + t ** 2 * p2.x;
    const y = (1 - t) ** 2 * p1.y + 2 * (1 - t) * t * cp.y + t ** 2 * p2.y;
    return { x, y };
}

function getHandleAt(x, y) {
    if (!selectedObject) return null;
    const obj = selectedObject;
    if (Math.hypot(obj.x1 - x, obj.y1 - y) < 10) return { obj, type: 'p1' };
    if (Math.hypot(obj.x2 - x, obj.y2 - y) < 10) return { obj, type: 'p2' };
    if (obj.cpx !== undefined && Math.hypot(obj.cpx - x, obj.cpy - y) < 10) return { obj, type: 'cp' };
    return null;
}

function getObjectAt(x, y) {
    for (let i = tacticalDrawings.length - 1; i >= 0; i--) {
        const obj = tacticalDrawings[i];
        if (obj.type === 'piece') continue;
        if (obj.type === 'drawCircle') {
            const dist = Math.hypot(obj.x1 - x, obj.y1 - y);
            const radius = Math.max(Math.abs(obj.x2 - obj.x1), Math.abs(obj.y2 - obj.y1));
            if (dist <= radius) return obj;
        } else if (obj.type === 'drawRect') {
            const minX = Math.min(obj.x1, obj.x2), maxX = Math.max(obj.x1, obj.x2);
            const minY = Math.min(obj.y1, obj.y2), maxY = Math.max(obj.y1, obj.y2);
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) return obj;
        } else if (obj.cpx !== undefined) {
            for (let t = 0; t <= 1; t += 0.1) {
                const p = getPointOnBezier(t, { x: obj.x1, y: obj.y1 }, { x: obj.cpx, y: obj.cpy }, { x: obj.x2, y: obj.y2 });
                if (Math.hypot(p.x - x, p.y - y) < 15) return obj;
            }
        } else {
            const dist = distToSegment(x, y, obj.x1, obj.y1, obj.x2, obj.y2);
            if (dist < 12) return obj;
        }
    }
    return null;
}

function getSnappedPoint(x, y) {
    const pieces = document.querySelectorAll('.draggable-piece');
    let closestDist = 35;
    let snapX = x, snapY = y;
    pieces.forEach(p => {
        const px = parseFloat(p.style.left) + 17;
        const py = parseFloat(p.style.top) + 17;
        const dist = Math.hypot(px - x, py - y);
        if (dist < closestDist) { closestDist = dist; snapX = px; snapY = py; }
    });
    return { x: snapX, y: snapY };
}

function drawArrow(ctx, x, y, angle) {
    const headlen = 14;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 7), y - headlen * Math.sin(angle - Math.PI / 7));
    ctx.moveTo(x, y);
    ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 7), y - headlen * Math.sin(angle + Math.PI / 7));
    ctx.stroke();
}

function drawBasketballLine(ctx, obj, isSelected = false) {
    const { x1, y1, x2, y2, cpx, cpy, type } = obj;
    if (type === 'piece') return;
    const dist = Math.hypot(x2 - x1, y2 - y1);
    
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    
    if (isSelected) {
        ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(255, 107, 0, 0.8)';
    }

    const hasCP = cpx !== undefined;

    if (type === 'pass') {
        ctx.setLineDash([10, 6]); 
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); 
        ctx.moveTo(x1, y1);
        if (hasCP) ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        else ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]); 
        const arrowAngle = hasCP ? Math.atan2(y2 - cpy, x2 - cpx) : Math.atan2(y2 - y1, x2 - x1);
        drawArrow(ctx, x2, y2, arrowAngle);
    } else if (type === 'dribble') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        const steps = Math.max(20, Math.floor(dist / 2));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            let p;
            if (hasCP) p = getPointOnBezier(t, { x: x1, y: y1 }, { x: cpx, y: cpy }, { x: x2, y: y2 });
            else p = { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
            
            const nextT = (i + 1) / steps;
            let nextP;
            if (hasCP) nextP = getPointOnBezier(nextT, { x: x1, y: y1 }, { x: cpx, y: cpy }, { x: x2, y: y2 });
            else nextP = { x: x1 + (x2 - x1) * nextT, y: y1 + (y2 - y1) * nextT };

            const segmentAngle = Math.atan2(nextP.y - p.y, nextP.x - p.x);
            const waveOffset = Math.sin(i * 0.8) * 6;
            const wx = p.x + waveOffset * Math.cos(segmentAngle + Math.PI / 2);
            const wy = p.y + waveOffset * Math.sin(segmentAngle + Math.PI / 2);
            if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
        }
        ctx.stroke(); 
        const arrowAngle = hasCP ? Math.atan2(y2 - cpy, x2 - cpx) : Math.atan2(y2 - y1, x2 - x1);
        drawArrow(ctx, x2, y2, arrowAngle);
    } else if (type === 'screen') {
        ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x1, y1);
        if (hasCP) ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        else ctx.lineTo(x2, y2);
        ctx.stroke();
        const barLen = 14;
        const endAngle = hasCP ? Math.atan2(y2 - cpy, x2 - cpx) : Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2 - barLen * Math.cos(endAngle + Math.PI / 2), y2 - barLen * Math.sin(endAngle + Math.PI / 2));
        ctx.lineTo(x2 + barLen * Math.cos(endAngle + Math.PI / 2), y2 + barLen * Math.sin(endAngle + Math.PI / 2));
        ctx.stroke();
    } else if (type === 'run') {
        ctx.strokeStyle = '#000000'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x1, y1);
        if (hasCP) ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        else ctx.lineTo(x2, y2);
        ctx.stroke();
        const arrowAngle = hasCP ? Math.atan2(y2 - cpy, x2 - cpx) : Math.atan2(y2 - y1, x2 - x1);
        drawArrow(ctx, x2, y2, arrowAngle);
    } else if (type === 'handoff') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x1, y1);
        if (hasCP) ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        else ctx.lineTo(x2, y2);
        ctx.stroke();
        const hAngle = hasCP ? Math.atan2(y2 - cpy, x2 - cpx) : Math.atan2(y2 - y1, x2 - x1);
        ctx.save();
        ctx.translate(x2, y2);
        ctx.rotate(hAngle);
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('#', -8, 8);
        ctx.restore();
    } else if (type === 'shot') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x1, y1);
        if (hasCP) ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        else ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(x2, y2, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.8)'; ctx.fill(); ctx.stroke();
    } else if (type === 'highlight') {
        ctx.strokeStyle = 'rgba(255, 107, 0, 0.35)'; ctx.lineWidth = 24;
        ctx.beginPath(); ctx.moveTo(x1, y1);
        if (hasCP) ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        else ctx.lineTo(x2, y2);
        ctx.stroke();
    } else if (type === 'drawCircle') {
        const radius = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
        ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(x1, y1, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(230, 126, 34, 0.12)'; ctx.fill(); ctx.stroke();
    } else if (type === 'drawRect') {
        ctx.strokeStyle = '#9b59b6'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.rect(x1, y1, x2 - x1, y2 - y1);
        ctx.fillStyle = 'rgba(155, 89, 182, 0.12)'; ctx.fill(); ctx.stroke();
    }
    ctx.restore();
}
