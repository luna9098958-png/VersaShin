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
        <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
          <button
            onClick={onEnter}
            className="group flex flex-col items-center justify-center p-12 rounded-full outline-none cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-red-600 rounded-full blur-[60px] opacity-0 group-hover:opacity-80 transition-opacity duration-1000 animate-pulse scale-150"></div>
              
              <Moon 
                size={140} 
                strokeWidth={1}
                fill="currentColor"
                className="text-white relative z-10 group-hover:scale-110 transition-all duration-1000 drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] group-hover:drop-shadow-[0_0_50px_rgba(220,38,38,1)]" 
              />
            </div>
            <span className="mt-10 text-white font-bold tracking-[0.5em] uppercase text-xl md:text-3xl group-hover:text-red-100 group-hover:drop-shadow-[0_0_25px_rgba(220,38,38,1)] transition-all duration-1000">
              Luna de Sangre
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
