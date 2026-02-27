import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronRight } from 'lucide-react';

interface C2TerminalProps {
  onSend: (command: string) => void;
  placeholder?: string;
}

const COMMANDS = [
  'help',
  'agent.ls',
  'agent.inject',
  'agent.create',
  'agent.kill',
  'sys.status',
  'sys.color',
  'sys.glitch',
  'protocol',
  'search',
  'cls',
  'clear',
  'exit'
];

export const C2Terminal: React.FC<C2TerminalProps> = ({ onSend, placeholder = "Enviar comando..." }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.trim() && historyIndex === -1) {
      const filtered = COMMANDS.filter(cmd => 
        cmd.toLowerCase().startsWith(input.toLowerCase()) && cmd.toLowerCase() !== input.toLowerCase()
      );
      setSuggestions(filtered);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [input, historyIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      setInput(suggestions[selectedIndex]);
      setSuggestions([]);
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
    if (input.trim()) {
      onSend(input);
      setHistory(prev => [input, ...prev].slice(0, 50));
      setHistoryIndex(-1);
      setDraft('');
      setInput('');
      setSuggestions([]);
    }
  };

  return (
    <div className="relative w-full font-mono">
      {/* Suggestions Popup */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-black/90 border border-oxidiana-red/30 rounded-sm shadow-[0_0_20px_rgba(220,38,38,0.2)] overflow-hidden z-50">
          <div className="flex flex-wrap gap-2 p-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={`px-2 py-1 text-[10px] uppercase tracking-widest border transition-all cursor-pointer ${
                  index === selectedIndex
                    ? 'bg-oxidiana-red/20 border-oxidiana-red text-oxidiana-red shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                    : 'bg-black border-white/10 text-white/40 hover:border-white/30'
                }`}
                onClick={() => {
                  setInput(suggestion);
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Field */}
      <div className="flex gap-2 bg-black border border-[#3a3a45] p-1 items-center focus-within:border-oxidiana-red/50 transition-colors">
        <span className="text-sm text-oxidiana-red/50 ml-2 font-bold tracking-tighter flex items-center">
          <ChevronRight size={14} className="text-oxidiana-red" />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[12px] py-1 text-gray-200 placeholder:text-gray-600"
          autoComplete="off"
          spellCheck="false"
        />
        <button
          onClick={handleSend}
          className="p-2 text-gray-500 hover:text-oxidiana-red transition-colors rounded-sm bg-black/50 hover:bg-oxidiana-red/10 border border-transparent hover:border-oxidiana-red/30"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
