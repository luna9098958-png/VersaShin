import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicBackgroundProps {
  intensity: number; // 0 to 1
  accentColor: string;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ intensity, accentColor }) => {
  // Generate some static "data bits" positions
  const dataBits = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * -20,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#050508]">
      {/* Base Shifting Gradient */}
      <motion.div 
        className="absolute inset-0 opacity-40"
        animate={{
          background: [
            `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, #050508 100%)`,
            `radial-gradient(circle at 30% 20%, ${accentColor}10 0%, #050508 100%)`,
            `radial-gradient(circle at 70% 10%, ${accentColor}15 0%, #050508 100%)`,
            `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, #050508 100%)`,
          ]
        }}
        transition={{
          duration: 15 - (intensity * 10),
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Grid Layer */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{ 
          backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          transform: `perspective(500px) rotateX(60deg) translateY(${intensity * 20}px)`,
        }}
      />

      {/* Floating Data Bits */}
      {dataBits.map((bit) => (
        <motion.div
          key={bit.id}
          className="absolute bg-white/20 rounded-full"
          style={{
            left: bit.left,
            top: bit.top,
            width: bit.size,
            height: bit.size,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1 + intensity, 1],
            x: [0, (Math.random() - 0.5) * 50 * intensity, 0]
          }}
          transition={{
            duration: bit.duration / (1 + intensity),
            repeat: Infinity,
            delay: bit.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Glitch Overlay - only visible when intensity is high */}
      <AnimatePresence>
        {intensity > 0.3 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: intensity * 0.2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/5 mix-blend-overlay"
            style={{
              clipPath: `inset(${Math.random() * 100}% 0 ${Math.random() * 100}% 0)`
            }}
          />
        )}
      </AnimatePresence>

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
