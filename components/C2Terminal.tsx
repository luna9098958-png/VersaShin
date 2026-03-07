import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronRight } from 'lucide-react';
import { Agent } from '../types';

interface C2TerminalProps {
  onSend: (command: string) => void;
  placeholder?: string;
  agents?: Agent[];
}

export const COMMANDS = [
  'help',
  'agent.ls',
  'agent.inject',
  'agent.create',
  'agent.kill',
  'sys.status',
  'sys.color',
  'sys.glitch',
  'sys.integrity',
  'sys.wipe',
  'protocol',
  'status_check',
  'run',
  'search',
  'cls',
  'clear',
  'exit'
];

export const C2Terminal: React.FC<C2TerminalProps> = ({ onSend, placeholder = "Escribe un mensaje al Bioma Multi-Agente iAAS...", agents }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (input.startsWith('/') && historyIndex === -1) {
      const fullCommand = input.substring(1);
      const parts = fullCommand.split(' ');
      const lastPart = parts[parts.length - 1];
      const isFirstWord = parts.length === 1;

      let newSuggestions: string[] = [];

      if (isFirstWord) {
        // Sugerir comandos base
        const cmdMatches = COMMANDS.filter(cmd => 
          cmd.toLowerCase().startsWith(fullCommand.toLowerCase())
        ).map(cmd => `/${cmd}`);
        
        // Sugerir desde el historial (contexto reciente)
        const historyMatches = (Array.from(new Set(history)) as string[])
          .filter(cmd => 
            cmd.startsWith('/') &&
            cmd.toLowerCase().substring(1).startsWith(fullCommand.toLowerCase()) && 
            !cmdMatches.includes(cmd)
          )
          .slice(0, 3);

        // Si el input coincide con un nombre de agente, sugerir comandos para ese agente
        let agentCmdMatches: string[] = [];
        if (agents) {
          const matchingAgents = agents.filter(a => 
            a.name.toLowerCase().startsWith(fullCommand.toLowerCase())
          );
          
          matchingAgents.forEach(a => {
            // Sugerir el nombre del agente solo
            if (!newSuggestions.includes(`/${a.name}`)) {
              agentCmdMatches.push(`/${a.name}`);
            }
            // Y comandos comunes con ese agente
            ['agent.kill', 'agent.inject', 'agent.ls'].forEach(cmd => {
              agentCmdMatches.push(`/${cmd} ${a.name}`);
            });
          });
        }

        newSuggestions = [...cmdMatches, ...historyMatches, ...agentCmdMatches] as string[];
      } else {
        // Sugerir comandos si la palabra anterior es un nombre de agente
        const prevWord = parts[parts.length - 2].toLowerCase();
        const isPrevWordAgent = agents?.some(a => a.name.toLowerCase() === prevWord);

        if (isPrevWordAgent) {
          COMMANDS.filter(cmd => cmd.toLowerCase().startsWith(lastPart.toLowerCase()))
            .forEach(cmd => {
              newSuggestions.push(`/${parts.slice(0, -1).join(' ')} ${cmd}`);
            });
        }

        // Sugerir nombres de agentes si estamos en el segundo parámetro (comportamiento estándar)
        if (agents && agents.length > 0) {
          const agentMatches = agents
            .map(a => a.name)
            .filter(name => name.toLowerCase().startsWith(lastPart.toLowerCase()))
            .map(name => {
              const prefix = parts.slice(0, -1).join(' ');
              return `/${prefix} ${name}`;
            });
          newSuggestions = [...newSuggestions, ...agentMatches];
        }
      }

      // Eliminar duplicados y limitar
      setSuggestions(Array.from(new Set(newSuggestions)).slice(0, 10));
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [input, historyIndex, history, agents]);

  const ghostText = suggestions.length > 0 && input.length > 0 && suggestions[selectedIndex].toLowerCase().startsWith(input.toLowerCase())
    ? suggestions[selectedIndex].slice(input.length)
    : '';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (suggestions.length > 0) {
        e.preventDefault();
        setInput(suggestions[selectedIndex]);
        setSuggestions([]);
      }
    } else if (e.key === 'ArrowDown') {
      if (suggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      } else if (historyIndex > -1) {
        e.preventDefault();
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        if (nextIndex === -1) {
          setInput(draft);
        } else {
          setInput(history[nextIndex]);
        }
      }
    } else if (e.key === 'ArrowUp') {
      if (suggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (history.length > 0 && historyIndex < history.length - 1) {
        e.preventDefault();
        if (historyIndex === -1) {
          setDraft(input);
        }
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    } else if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return;
    }

    onSend(trimmedInput);
    setHistory(prev => [trimmedInput, ...prev].slice(0, 50));
    setHistoryIndex(-1);
    setDraft('');
    setInput('');
    setSuggestions([]);
    setError(null);
  };

  return (
    <div className="relative w-full font-mono">
      {/* Error Message */}
      {error && (
        <div className="absolute bottom-full left-0 mb-1 px-2 py-0.5 bg-red-900/80 border border-red-500 text-[8px] text-white uppercase tracking-widest animate-in fade-in slide-in-from-bottom-1 z-[60]">
          ERROR: {error}
        </div>
      )}

      {/* Multi-Agent Presence Indicator */}
      {agents && agents.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 flex gap-1.5 items-center px-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex -space-x-2">
            {agents.map(agent => (
              <div 
                key={agent.id}
                className="w-5 h-5 rounded-full border border-black flex items-center justify-center overflow-hidden shadow-lg ring-1 ring-white/10"
                style={{ backgroundColor: agent.color, borderColor: `${agent.color}40` }}
                title={`${agent.name} (${agent.role})`}
              >
                {agent.avatar ? (
                  <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-[6px] font-bold text-white">{agent.name[0]}</span>
                )}
              </div>
            ))}
          </div>
          <span className="text-[7px] uppercase font-black tracking-[0.2em] text-orange-500/60 ml-1">
            {agents.length === 1 ? `UPLINK: ${agents[0].name}` : `GESTALT_UPLINK: ${agents.length} AGENTES`}
          </span>
        </div>
      )}

      {/* Suggestions Popup */}
      {suggestions.length > 0 && !error && (
        <div className="absolute bottom-full left-0 mb-1 w-full bg-[#0a0a0f] border border-[#FF8C00]/30 rounded-sm shadow-[0_-10px_30px_rgba(0,0,0,0.8)] overflow-hidden z-50">
          <div className="flex flex-col">
            <div className="bg-[#FF8C00]/10 px-2 py-1 border-b border-[#FF8C00]/20 text-[7px] uppercase tracking-[0.2em] text-[#FF8C00]/60 flex justify-between">
              <span>Sugerencias de Comando</span>
              <div className="flex gap-3">
                <span>[↑/↓] navegar</span>
                <span>[TAB] completar</span>
              </div>
            </div>
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                  index === selectedIndex
                    ? 'bg-[#FF8C00]/20 text-white border-l-2 border-[#FF8C00] pl-2'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                }`}
                onClick={() => {
                  setInput(suggestion);
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
              >
                <ChevronRight size={10} className={index === selectedIndex ? 'text-[#FF8C00]' : 'text-transparent'} />
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Field */}
      <div className="flex gap-2 bg-black/60 backdrop-blur-xl border border-white/10 p-2 items-end focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all relative rounded-xl shadow-2xl">
        <div className="flex-1 relative flex items-center min-h-[40px]">
          <textarea
            ref={inputRef as any}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              if (error) setError(null);
              
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              } else {
                handleKeyDown(e);
              }
            }}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-transparent outline-none text-[14px] py-2 px-3 text-gray-100 placeholder:text-gray-700 z-10 resize-none custom-scrollbar font-tech tracking-wide"
            autoComplete="off"
            spellCheck="false"
          />
          {ghostText && !input.includes('\n') && (
            <div className="absolute left-0 pointer-events-none text-[14px] py-2 px-3 text-gray-800 whitespace-pre font-tech tracking-wide">
              <span className="opacity-0">{input}</span>
              {ghostText}
            </div>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className={`p-3 rounded-xl transition-all flex items-center justify-center ${
            input.trim() 
              ? 'bg-orange-600 text-white hover:bg-orange-500 shadow-[0_0_20px_rgba(255,140,0,0.4)] hover:scale-105 active:scale-95' 
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          }`}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
