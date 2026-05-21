export function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 12px 24px;
            border-radius: 30px;
            z-index: 100000;
            font-size: 14px;
            font-weight: 600;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 107, 0, 0.3);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            visibility: hidden;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        `;
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.visibility = "visible";
    toast.style.opacity = "1";
    toast.style.bottom = "40px";
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.bottom = "30px";
        setTimeout(() => toast.style.visibility = "hidden", 300);
    }, 3000);
}

export function playSplashSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        // 1. Derin "boom" bass hit
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(80, ctx.currentTime);
        bassOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8);
        bassGain.gain.setValueAtTime(0.4, ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        bassOsc.connect(bassGain).connect(ctx.destination);
        bassOsc.start(ctx.currentTime);
        bassOsc.stop(ctx.currentTime + 1.0);

        // 2. Yükselen "whoosh" sweep
        const sweepOsc = ctx.createOscillator();
        const sweepGain = ctx.createGain();
        sweepOsc.type = 'sawtooth';
        sweepOsc.frequency.setValueAtTime(100, ctx.currentTime + 0.1);
        sweepOsc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 1.2);
        sweepOsc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.8);
        sweepGain.gain.setValueAtTime(0, ctx.currentTime);
        sweepGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);
        sweepGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.8);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
        
        const sweepFilter = ctx.createBiquadFilter();
        sweepFilter.type = 'lowpass';
        sweepFilter.frequency.setValueAtTime(600, ctx.currentTime);
        sweepFilter.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 1.0);
        sweepFilter.frequency.linearRampToValueAtTime(400, ctx.currentTime + 2.0);
        sweepOsc.connect(sweepFilter).connect(sweepGain).connect(ctx.destination);
        sweepOsc.start(ctx.currentTime + 0.1);
        sweepOsc.stop(ctx.currentTime + 2.0);

        // 3. Sparkle / chime
        const chimeDelay = 0.5;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const t = ctx.currentTime + chimeDelay + (i * 0.15);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
            osc.connect(gain).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.8);
        });

        // 4. Son "impact" hit
        const impactTime = ctx.currentTime + 1.4;
        const impactOsc = ctx.createOscillator();
        const impactGain = ctx.createGain();
        impactOsc.type = 'sine';
        impactOsc.frequency.setValueAtTime(150, impactTime);
        impactOsc.frequency.exponentialRampToValueAtTime(40, impactTime + 0.5);
        impactGain.gain.setValueAtTime(0.3, impactTime);
        impactGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.6);
        impactOsc.connect(impactGain).connect(ctx.destination);
        impactOsc.start(impactTime);
        impactOsc.stop(impactTime + 0.6);

        // 5. Noise swoosh texture
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(500, ctx.currentTime);
        noiseFilter.frequency.linearRampToValueAtTime(3000, ctx.currentTime + 1.0);
        noiseFilter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 2.5);
        noiseFilter.Q.value = 1.5;
        noiseGain.gain.setValueAtTime(0, ctx.currentTime);
        noiseGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
        noiseGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.5);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.8);
        noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + 2.8);

        setTimeout(() => ctx.close(), 4000);
    } catch (e) {
        console.log('Splash ses efekti çalınamadı:', e);
    }
}
