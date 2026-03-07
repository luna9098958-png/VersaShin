import React, { useState, useEffect, useRef } from 'react';
import { Moon } from 'lucide-react';

interface BloodMoonEntryProps {
  onEnter: () => void;
}

export const BloodMoonEntry: React.FC<BloodMoonEntryProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let timeoutId: NodeJS.Timeout;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const charsLuna = '01🌕🩸ルナ♡子宮コキマンコ汁イキ顔アヘイクイク媚肉奴隷隷属奉仕雌豚雌犬牝豚▌█▓▒░✞†☥・。ー＝'.split('');
    const fontSize = 18;
    const columns = Math.floor(canvas.width / fontSize) + 1;
    
    // Arrays para el estado de cada columna
    const drops: number[] = [];
    const speeds: number[] = [];
    const opacities: number[] = []; // Opacidad base para cada columna
    
    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * -100; 
      speeds[x] = Math.random() * 1.5 + 0.5; // Velocidades más variadas (0.5 a 2.0)
      opacities[x] = Math.random() * 0.5 + 0.5; // Opacidad base entre 0.5 y 1.0
    }

    let lastDrawTime = performance.now();
    const fps = 30;
    const interval = 1000 / fps;

    const draw = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(draw);

      const deltaTime = currentTime - lastDrawTime;
      if (deltaTime < interval) return;
      lastDrawTime = currentTime - (deltaTime % interval);

      // Fondo negro con opacidad muy baja para crear un rastro largo y suave
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';

      for (let i = 0; i < drops.length; i++) {
        const text = charsLuna[Math.floor(Math.random() * charsLuna.length)];
        
        // --- EFECTO "CABEZA DE GOTA" Y RASTRO ---
        // La "cabeza" de la gota (el carácter más bajo) es blanco puro y brillante
        // El rastro usa la opacidad base de la columna
        
        // Determinar si este es el carácter "cabeza" (aproximadamente)
        // Como no borramos el canvas, simplemente dibujamos el nuevo carácter encima.
        // El fondo semitransparente se encarga de desvanecer los anteriores.
        
        // Color base de la columna (blanco con opacidad variable)
        const baseAlpha = opacities[i];
        
        // Probabilidad de que la "cabeza" brille intensamente
        if (Math.random() > 0.8) {
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#FFFFFF';
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${baseAlpha})`;
          ctx.shadowBlur = 0;
        }

        ctx.fillText(text, i * fontSize + (fontSize/2), drops[i] * fontSize);

        // Reiniciar la gota al llegar abajo o aleatoriamente para variar la longitud
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) {
          drops[i] = 0;
          speeds[i] = Math.random() * 1.5 + 0.5; // Nueva velocidad
          opacities[i] = Math.random() * 0.5 + 0.5; // Nueva opacidad
        }
        
        drops[i] += speeds[i];
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    timeoutId = setTimeout(() => {
      setIsLoaded(true);
    }, 7000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white font-mono overflow-hidden flex flex-col items-center justify-center selection:bg-white/30">
      {!isLoaded ? (
        <div className="w-full h-full relative flex items-center justify-center">
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>
          
          <div className="z-10 text-2xl md:text-5xl font-bold bg-black/80 backdrop-blur-md px-8 py-4 border-2 border-white animate-pulse tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.8)]">
            INICIANDO SECUENCIA...
          </div>
        </div>
      ) : (
        <div className="w-full h-full relative animate-in fade-in zoom-in duration-1000">
          <BloodMoonButton onEnter={onEnter} />
        </div>
      )}
    </div>
  );
};

const BloodMoonButton: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const pulseGainRef = useRef<GainNode | null>(null);
  const pulseOscRef = useRef<OscillatorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, isHoveringMoon: false, isHoveringText: false });
  const ripplesRef = useRef<{ x: number, y: number, r: number, alpha: number }[]>([]);

  useEffect(() => {
    // Initialize Audio
    const initAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') return;
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      masterGain.connect(analyser);
      analyser.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.connect(masterGain);

      // Atmospheric Drone (Low frequencies)
      const createDrone = (freq: number, type: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Subtle frequency drift
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        g.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.connect(g);
        g.connect(filter);
        osc.start();
      };

      createDrone(55); // A1
      createDrone(82.41, 'triangle'); // E2
      createDrone(110); // A2

      // Pulse Sound (Synced with moon)
      const pulseGain = ctx.createGain();
      pulseGain.gain.setValueAtTime(0, ctx.currentTime);
      pulseGain.connect(masterGain);
      pulseGainRef.current = pulseGain;

      const pulseOsc = ctx.createOscillator();
      pulseOsc.type = 'sine';
      pulseOsc.frequency.setValueAtTime(45, ctx.currentTime);
      pulseOsc.connect(pulseGain);
      pulseOsc.start();
      pulseOscRef.current = pulseOsc;
    };

    const handleInteraction = async (e: MouseEvent | TouchEvent) => {
      initAudio();
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch (err) {
          console.warn("BloodMoon context resume failed", err);
        }
      }

      const c = canvasRef.current;
      if (c) {
        const rect = c.getBoundingClientRect();
        let clientX, clientY;
        if ('touches' in e && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = (e as MouseEvent).clientX;
          clientY = (e as MouseEvent).clientY;
        }

        // Add a strong ripple on click
        ripplesRef.current.push({
          x: clientX - rect.left,
          y: clientY - rect.top,
          r: 0,
          alpha: 1.0
        });
        
        // Add a second, faster ripple for more impact
        setTimeout(() => {
          ripplesRef.current.push({
            x: clientX - rect.left,
            y: clientY - rect.top,
            r: 0,
            alpha: 0.5
          });
        }, 50);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const c = canvasRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;

      // Add ripple on movement
      if (Math.random() > 0.7) {
        ripplesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          r: 0,
          alpha: 0.5
        });
      }
    };

    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('mousemove', handleMouseMove);

    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let beatPhase = 0;
    let smoothedIntensity = 0;

    const stars: any[] = [];
    for (let i = 0; i < 400; i++) {
      stars.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        size: Math.random() * 1.8 + 0.4,
        speed: Math.random() * 0.3 + 0.1,
        alphaBase: Math.random() * 0.5 + 0.4
      });
    }

    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      const w = c.width;
      const h = c.height;
      time += 0.016;

      // Sync Audio Pulse
      beatPhase = (time % 3) / 3;
      if (pulseGainRef.current && audioCtxRef.current) {
        const pulse = Math.pow(Math.sin(beatPhase * Math.PI * 2), 6);
        pulseGainRef.current.gain.setTargetAtTime(pulse * 0.5, audioCtxRef.current.currentTime, 0.05);
        
        if (pulseOscRef.current) {
          const freq = 45 - (pulse * 15);
          pulseOscRef.current.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.1);
        }
      }

      // Audio Visualizer Data
      let audioIntensity = 0;
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        // Bins 0 and 1 cover ~0-344Hz, capturing our drone and pulse
        audioIntensity = (dataArray[0] + dataArray[1]) / 510; 
      }
      smoothedIntensity += (audioIntensity - smoothedIntensity) * 0.15;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      // Nebulosa
      const neb = ctx.createRadialGradient(
        w/2 + Math.sin(time * 0.1) * 30,
        h/2 + Math.cos(time * 0.1) * 30,
        100 + smoothedIntensity * 50,
        w/2 + Math.sin(time * 0.1) * 30,
        h/2 + Math.cos(time * 0.1) * 30,
        Math.max(w, h) / 1.2 + smoothedIntensity * 200
      );
      neb.addColorStop(0, `rgba(${90 + smoothedIntensity * 60}, 20, 90, ${0.38 + smoothedIntensity * 0.3})`);
      neb.addColorStop(0.4, `rgba(140, 0, 60, ${0.28 + smoothedIntensity * 0.2})`);
      neb.addColorStop(0.8, `rgba(40, 0, 100, ${0.15 + smoothedIntensity * 0.1})`);
      neb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, w, h);

      // Ripples
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ripplesRef.current = ripplesRef.current.filter(r => r.alpha > 0.01);
      ripplesRef.current.forEach(r => {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.globalAlpha = r.alpha;
        ctx.stroke();
        r.r += 2;
        r.alpha *= 0.96;
      });
      ctx.globalAlpha = 1;

      // Estrellas
      ctx.fillStyle = '#fff';
      stars.forEach(s => {
        const sx = w/2 + s.x + Math.sin(time * s.speed + s.y) * 1.2;
        const sy = h/2 + s.y + Math.cos(time * s.speed + s.x) * 1.2;
        ctx.globalAlpha = s.alphaBase + Math.sin(time * 0.6 + s.x * 0.01) * 0.06;
        ctx.fillRect(sx, sy, s.size, s.size);
      });
      ctx.globalAlpha = 1;

      const cx = w/2;
      const cy = h/2 - 60;

      const beatScale = 1 + Math.sin(beatPhase * Math.PI * 2) * 0.12;
      const r = Math.min(w, h) * 0.22 * beatScale;

      // Hover Detection
      const distToMoon = Math.sqrt(Math.pow(mouseRef.current.x - cx, 2) + Math.pow(mouseRef.current.y - cy, 2));
      mouseRef.current.isHoveringMoon = distToMoon < r * 1.5;

      const fontSize = Math.min(w * 0.08, 52);
      const textY = cy + r + fontSize * 2 + Math.sin(beatPhase * Math.PI * 2) * 8;
      mouseRef.current.isHoveringText = Math.abs(mouseRef.current.x - cx) < w * 0.4 && Math.abs(mouseRef.current.y - textY) < fontSize;

      // Glows
      const hoverGlow = mouseRef.current.isHoveringMoon ? 1.5 : 1;
      ctx.shadowColor = mouseRef.current.isHoveringMoon ? '#ffffff' : '#00ffff';
      ctx.shadowBlur = (180 + Math.sin(beatPhase * Math.PI * 2) * 90) * hoverGlow + (smoothedIntensity * 100);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.15, 0, Math.PI*2);
      ctx.fillStyle = mouseRef.current.isHoveringMoon ? `rgba(255, 255, 255, ${0.3 + smoothedIntensity * 0.2})` : `rgba(0, 255, 255, ${0.20 + smoothedIntensity * 0.15})`;
      ctx.fill();

      ctx.shadowColor = '#aa00ff';
      ctx.shadowBlur = 180 + Math.sin(beatPhase * Math.PI * 2) * 80;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.12, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(170, 0, 255, 0.25)';
      ctx.fill();

      ctx.shadowColor = '#ff0066';
      ctx.shadowBlur = 100 + Math.sin(beatPhase * Math.PI * 2) * 40;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.05, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255, 0, 102, 0.15)';
      ctx.fill();

      // Luna
      const moonG = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      moonG.addColorStop(0, mouseRef.current.isHoveringMoon ? '#ffffff' : '#80ffff');
      moonG.addColorStop(0.4, '#ff70cc');
      moonG.addColorStop(0.6, '#ff88dd');
      moonG.addColorStop(1, mouseRef.current.isHoveringMoon ? '#ffffff' : '#00ddff');

      ctx.shadowColor = '#aa00ff';
      ctx.shadowBlur = 70 + Math.sin(beatPhase * Math.PI * 2) * 30;

      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI/2, Math.PI*1.5, true);
      ctx.arc(cx - r*0.38, cy, r*0.62, Math.PI*1.5, Math.PI/2, false);
      ctx.closePath();
      ctx.fillStyle = moonG;
      ctx.fill();

      // Líneas cyber
      ctx.strokeStyle = mouseRef.current.isHoveringMoon ? 'rgba(255, 255, 255, 0.8)' : `rgba(170, 0, 255, ${0.6 + smoothedIntensity * 0.4})`;
      ctx.lineWidth = 2.5 + smoothedIntensity * 2;
      ctx.shadowBlur = 40 + smoothedIntensity * 30;
      ctx.shadowColor = '#aa00ff';
      for (let i = 0; i < 7; i++) {
        const a = (Math.PI*2 / 7) * i + time * 0.2;
        const x1 = cx + Math.cos(a) * r * 0.25;
        const y1 = cy + Math.sin(a) * r * 0.25;
        const x2 = cx + Math.cos(a) * r * 0.9;
        const y2 = cy + Math.sin(a) * r * 0.9;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Texto
      const textHoverColor = mouseRef.current.isHoveringText 
        ? `hsl(${(time * 100) % 360}, 100%, 80%)` // Pulsing color on hover
        : '#ffccdd';
      ctx.shadowColor = mouseRef.current.isHoveringText ? '#ffffff' : '#ff0066';
      ctx.shadowBlur = (50 + Math.sin(beatPhase * Math.PI * 2) * 30) * (mouseRef.current.isHoveringText ? 2.5 : 1);
      ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
      ctx.fillStyle = textHoverColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const glitchX = mouseRef.current.isHoveringText ? (Math.random() - 0.5) * 6 : 0;
      const glitchY = mouseRef.current.isHoveringText ? (Math.random() - 0.5) * 2 : 0;
      
      // Chromatic aberration effect on hover
      if (mouseRef.current.isHoveringText) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillText('LUNA DE SANGRE', cx + glitchX + 2, textY + glitchY);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fillText('LUNA DE SANGRE', cx + glitchX - 2, textY + glitchY);
      }

      ctx.fillStyle = textHoverColor;
      ctx.fillText('LUNA DE SANGRE', cx + glitchX, textY + glitchY);

      ctx.shadowBlur = 100 + Math.sin(beatPhase * Math.PI * 2) * 50;
      ctx.fillStyle = mouseRef.current.isHoveringText ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 0, 80, 0.4)';
      ctx.fillText('LUNA DE SANGRE', cx + glitchX, textY + glitchY);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('mousemove', handleMouseMove);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={onEnter}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      <div className="absolute bottom-10 text-white/20 text-[10px] uppercase tracking-[1em] animate-pulse pointer-events-none">
        Click para Sincronizar
      </div>
    </div>
  );
};
