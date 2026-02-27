import React, { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
  glitchIntensity?: number;
  glitchTiming?: number;
}

const GLITCH_CHARS = '¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const Typewriter: React.FC<TypewriterProps> = ({ 
  text, 
  speed = 10, 
  onComplete, 
  className,
  style,
  glitchIntensity = 0,
  glitchTiming = 0.5
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [glitchIndices, setGlitchIndices] = useState<Record<number, string>>({});
  const timeoutRef = useRef<any>(null);
  const indexRef = useRef(0);
  const glitchTimeoutRef = useRef<any>(null);

  // Typewriter logic
  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText('');

    const type = () => {
      if (indexRef.current < text.length) {
        let charDelay = speed;
        const currentChar = text[indexRef.current];

        // Organic timing adjustments
        if (currentChar === '.' || currentChar === '?' || currentChar === '!') charDelay = speed * 12;
        else if (currentChar === ',') charDelay = speed * 6;
        else if (currentChar === ' ') charDelay = speed * 0.5;
        else charDelay = speed + (Math.random() * speed * 0.5);

        setDisplayedText(text.substring(0, indexRef.current + 1));
        indexRef.current++;
        
        timeoutRef.current = setTimeout(type, charDelay);
      } else {
        if (onComplete) onComplete();
      }
    };

    type();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed]);

  // Glitch effect logic
  useEffect(() => {
    if (glitchIntensity <= 0) {
      setGlitchIndices({});
      return;
    }

    const runGlitch = () => {
      // Probability of glitching depends on intensity
      if (Math.random() < glitchIntensity * 0.4) {
        const newGlitches: Record<number, string> = {};
        const count = Math.floor(Math.random() * (displayedText.length * glitchIntensity * 0.2)) + 1;
        
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * displayedText.length);
          if (displayedText[idx] !== ' ' && displayedText[idx] !== '\n') {
            newGlitches[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          }
        }
        setGlitchIndices(newGlitches);
        
        // Reset glitches shortly after
        setTimeout(() => setGlitchIndices({}), 50 + Math.random() * 150);
      }

      const nextInterval = (1000 - (glitchTiming * 800)) + (Math.random() * 500);
      glitchTimeoutRef.current = setTimeout(runGlitch, nextInterval);
    };

    runGlitch();

    return () => {
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
    };
  }, [glitchIntensity, glitchTiming, displayedText]);

  // Combined style for shimmer and intensity-based effects
  const shimmerStyle: React.CSSProperties = {
    ...style,
    background: glitchIntensity > 0.1 
      ? `linear-gradient(90deg, transparent, rgba(255,255,255,${0.1 + glitchIntensity * 0.2}), transparent)`
      : 'none',
    backgroundSize: '200% 100%',
    animation: glitchIntensity > 0.1 ? `shimmer ${10 - glitchTiming * 8}s linear infinite` : 'none',
    WebkitBackgroundClip: glitchIntensity > 0.1 ? 'text' : 'initial',
    display: 'inline',
    whiteSpace: 'pre-wrap',
    transition: 'all 0.1s ease-out',
    position: 'relative'
  };

  return (
    <span className={`${className} inline`} style={shimmerStyle}>
      {displayedText.split('').map((char, i) => {
        const isGlitching = glitchIndices[i] !== undefined;
        const glitchChar = glitchIndices[i];
        
        return (
          <span 
            key={i} 
            style={{
              color: isGlitching ? 'var(--accent-color)' : 'inherit',
              transform: isGlitching ? `translate(${Math.random() * 4 * glitchIntensity - 2 * glitchIntensity}px, ${Math.random() * 2 * glitchIntensity - 1 * glitchIntensity}px)` : 'none',
              filter: isGlitching ? `hue-rotate(${Math.random() * 360}deg) brightness(1.5)` : 'none',
              opacity: isGlitching ? 0.8 : 1,
              display: 'inline-block',
              transition: 'transform 0.05s ease-out'
            }}
          >
            {isGlitching ? glitchChar : char}
          </span>
        );
      })}
      <span 
        className="terminal-cursor animate-terminal-blink"
        style={{
          boxShadow: `0 0 ${10 + glitchIntensity * 20}px var(--cursor-glow)`,
          transform: `scale(${1 + glitchIntensity * 0.2})`
        }}
      ></span>
    </span>
  );
};