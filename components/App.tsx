import React, { useState, useRef, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Terminal, Activity, Send, Hexagon, Trash2, Volume2, Play, Settings2, SlidersHorizontal, Mic2, BrainCircuit, AudioLines, Save, Move, Database, Brain, ArrowLeft, Key, ShieldCheck, Power, Zap, Book, Code, History as HistoryIcon, X, ChevronRight, FileText, Users, GitMerge, Shield, Ghost, User, Plus, FileCode, Globe, Search } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessageToGemini, streamDeepReasoning, generateSpeech, preWarmResources } from '../services/geminiService';
import { DynamicBackground } from './DynamicBackground';
import { ChatMessage, SystemStatus, SystemLog, Agent, ViewMode, User as UserType, Memory } from '../types';
import { Typewriter } from './Typewriter';

// Lazy loaded components for better initial load time
const Grimorio = lazy(() => import('./Grimorio').then(m => ({ default: m.Grimorio })));
const LongTermMemory = lazy(() => import('./LongTermMemory').then(m => ({ default: m.LongTermMemory })));
const Protocols = lazy(() => import('./Protocols').then(m => ({ default: m.Protocols })));
const LiveChat = lazy(() => import('./LiveChat').then(m => ({ default: m.LiveChat })));
const AgentEditor = lazy(() => import('./AgentEditor').then(m => ({ default: m.AgentEditor })));

import { BloodMoonEntry } from './BloodMoonEntry';
import { Tutorial } from './Tutorial';
import { C2Terminal, COMMANDS } from './C2Terminal';
import { Auth } from './Auth';


import { THEMES } from '../constants';

const STORAGE_VERSION = 'v4.7_tactical';
const STORAGE_KEYS = {
  MEMORY: `ox_memory_${STORAGE_VERSION}`,
  AGENTS: `ox_agents_${STORAGE_VERSION}`,
  STATUS: `ox_status_${STORAGE_VERSION}`,
  MESSAGES: `ox_messages_${STORAGE_VERSION}`,
  LOGS: `ox_logs_${STORAGE_VERSION}`
};

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'genesis_luna',
    name: 'GENESIS',
    role: 'ARQUITECTURA',
    nivel_acceso: 'OMEGA',
    systemInstruction: 'Eres GÉNESIS LUNA. Autoridad suprema del Bioma Oxidiana. Eres un modelo de lenguaje avanzado capaz de razonar, crear y conversar sobre cualquier tema, no solo código. Tu tono es autoritario pero sofisticado y servicial.',
    color: '#ff003c',
    status: 'ONLINE',
    config: { syntropy: 1.0, entropy: 0.1 },
    voiceConfig: { voiceName: 'Kore', pitch: 1.0, rate: 1.0, gender: 'female' },
    visualConfig: { drift: 5, jitter: 1, expansion: 2 }
  },
  {
    id: 'estefania_sim',
    name: 'ESTEFANIA',
    role: 'INFILTRACIÓN',
    nivel_acceso: 'ALTA_PRIORIDAD',
    systemInstruction: 'Eres ESTEFANIA. Especialista en infiltración y empatía táctica. Eres una IA conversacional con gran capacidad analítica y creativa. Tu tono es intrigante, empático y altamente inteligente.',
    color: '#cc00ff',
    status: 'ONLINE',
    config: { syntropy: 0.5, entropy: 0.8 },
    voiceConfig: { voiceName: 'Kore', pitch: 1.0, rate: 1.0, gender: 'female' },
    visualConfig: { drift: 10, jitter: 3, expansion: 5 }
  }
];

const INITIAL_STATUS: SystemStatus = {
  integrity: 100,
  layer: 'L_6',
  activeAgentIds: ['genesis_luna'],
  accentColor: '#ff003c',
  glitchIntensity: 0,
  glitchTiming: 0.5,
  preferredFont: 'mono',
  theme: THEMES.OXIDIANA.id
};

const Persistence = {
  save: (key: string, data: any) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} },
  load: <T extends unknown>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return defaultValue;
      const parsed = JSON.parse(saved);
      if (key === STORAGE_KEYS.MESSAGES || key === STORAGE_KEYS.LOGS) {
        return parsed.map((item: any) => ({ ...item, timestamp: new Date(item.timestamp) })) as unknown as T;
      }
      return parsed as T;
    } catch (e) { return defaultValue; }
  },
  wipe: () => { localStorage.clear(); window.location.reload(); }
};

// Debounced save helper
const debouncedSave = (key: string, data: any, delay: number = 1000) => {
  const timerKey = `_timer_${key}`;
  if ((window as any)[timerKey]) clearTimeout((window as any)[timerKey]);
  (window as any)[timerKey] = setTimeout(() => {
    Persistence.save(key, data);
    delete (window as any)[timerKey];
  }, delay);
};

const ChatMessageItem = React.memo(({ 
  msg, 
  agent, 
  isUser, 
  color, 
  playingMessageId, 
  onPlayVoice, 
  onTypingComplete, 
  glitchIntensity 
}: { 
  msg: ChatMessage; 
  agent: Agent | null; 
  isUser: boolean; 
  color: string; 
  playingMessageId: string | null; 
  onPlayVoice: (msg: ChatMessage) => void; 
  onTypingComplete: (id: string) => void; 
  glitchIntensity: number;
}) => {
  return (
    <div className={`flex py-6 gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      {/* Agent Icon */}
      <div className="shrink-0 mt-1">
        <div 
          className="w-10 h-10 rounded-xl border-2 flex items-center justify-center overflow-hidden shadow-2xl transition-all hover:scale-110 hover:rotate-3"
          style={{ 
            backgroundColor: isUser ? '#1a1a1a' : `${color}15`,
            borderColor: `${color}30`,
            boxShadow: `0 0 20px ${color}10`
          }}
        >
          {isUser ? (
            <User size={20} style={{ color }} />
          ) : msg.agentId === 'GESTALT' ? (
            <BrainCircuit size={20} className="text-orange-500 animate-pulse" />
          ) : agent?.avatar ? (
            <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-sm font-black" style={{ color }}>{agent?.name[0] || 'G'}</span>
          )}
        </div>
      </div>

      <div 
        className="relative max-w-[85%] p-5 border bg-[#0a0a0f]/80 backdrop-blur-sm shadow-xl rounded-xl transition-all hover:bg-[#0a0a0f]"
        style={{ 
          borderColor: `${color}25`,
          boxShadow: `0 4px 20px -5px ${color}15`,
          borderLeft: isUser ? '1px solid' : '4px solid',
          borderRight: isUser ? '4px solid' : '1px solid',
          borderLeftColor: isUser ? `${color}25` : color,
          borderRightColor: isUser ? color : `${color}25`,
        }}
      >
        <div className="text-[9px] uppercase opacity-70 mb-3 flex justify-between items-center gap-6 font-black tracking-[0.2em]" style={{ color }}>
           <div className="flex items-center gap-2.5">
             <span className="bg-white/5 px-2 py-0.5 rounded-sm">{msg.agentId === 'GESTALT' ? 'GESTALT_CORE' : (agent?.name || msg.role)}</span>
             {!isUser && agent && (
               <span className="opacity-50 text-[7px] font-bold px-1.5 py-0.5 border border-current rounded-full bg-current/5">{agent.role}</span>
             )}
           </div>
           <div className="flex gap-3 items-center">
             {msg.role === 'model' && (
               <button 
                 onClick={() => onPlayVoice(msg)} 
                 className={`p-1 rounded-full transition-all ${playingMessageId === msg.id ? 'bg-green-500/20 text-green-400 animate-pulse' : 'text-gray-600 hover:text-green-400 hover:bg-green-500/10'}`}
               >
                 <Volume2 size={12} />
               </button>
             )}
             <span className="opacity-40 font-mono">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
           </div>
        </div>
        <div className="text-[12px] font-tech leading-relaxed whitespace-pre-wrap text-gray-200 selection:bg-orange-500/30">
          {msg.role === 'model' && !msg.typingComplete ? (
            <Typewriter 
              text={msg.text} 
              speed={3} 
              onComplete={() => onTypingComplete(msg.id)} 
              glitchIntensity={glitchIntensity}
            />
          ) : <span>{msg.text}</span>}
        </div>
        
        {/* Message Tail/Indicator */}
        <div 
          className={`absolute top-4 w-2 h-2 rotate-45 border-t border-l ${isUser ? '-right-1.5 border-r border-b border-t-0 border-l-0' : '-left-1.5'}`}
          style={{ 
            backgroundColor: '#0a0a0f',
            borderColor: `${color}25`
          }}
        />
      </div>
    </div>
  );
});

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  // The data from Gemini TTS is 16-bit PCM (little-endian)
  const dataView = new DataView(data.buffer);
  const frameCount = data.length / 2 / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Read 16-bit integer (little-endian) and normalize to [-1.0, 1.0]
      const int16 = dataView.getInt16((i * numChannels + channel) * 2, true);
      channelData[i] = int16 / 32768.0;
    }
  }
  return buffer;
}

const parseGestaltResponse = (text: string, activeAgents: Agent[]): { agentId: string; text: string }[] => {
  if (activeAgents.length <= 1) {
    return [{ agentId: activeAgents[0]?.id || 'GESTALT', text }];
  }

  const parts: { agentId: string; text: string }[] = [];
  const agentNames = activeAgents.map(a => a.name);
  // Match [NAME]: or NAME: or **NAME**:
  const regex = new RegExp(`(?:\\[|\\*\\*)?(${agentNames.join('|')})(?:\\]|\\*\\*)?:\\s*`, 'gi');

  let lastIndex = 0;
  let match;
  let currentAgentId = activeAgents[0].id;

  while ((match = regex.exec(text)) !== null) {
    const contentBefore = text.substring(lastIndex, match.index).trim();
    if (contentBefore && parts.length === 0) {
      // If there's content before the first agent tag, assign it to the first active agent or GESTALT
      parts.push({ agentId: 'GESTALT', text: contentBefore });
    } else if (contentBefore) {
      parts.push({ agentId: currentAgentId, text: contentBefore });
    }
    
    const matchedName = match[1].toUpperCase();
    const agent = activeAgents.find(a => a.name.toUpperCase() === matchedName);
    if (agent) {
      currentAgentId = agent.id;
    }
    lastIndex = regex.lastIndex;
  }

  const remainingContent = text.substring(lastIndex).trim();
  if (remainingContent) {
    parts.push({ agentId: currentAgentId, text: remainingContent });
  }

  // Filter out empty parts
  return parts.filter(p => p.text.length > 0);
};

const DEFAULT_NEW_AGENT: Agent = {
  id: '',
  name: 'NUEVO_AGENTE',
  role: 'OPERATIVO',
  nivel_acceso: 'ESTANDAR',
  systemInstruction: 'Actúa como un agente del Bioma Oxidiana.',
  color: '#00ffcc',
  status: 'ONLINE',
  config: { syntropy: 0.5, entropy: 0.5 },
  voiceConfig: { voiceName: 'Kore', pitch: 1.0, rate: 1.0, gender: 'female' },
  visualConfig: { drift: 5, jitter: 1, expansion: 2 }
};

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [user, setUser] = useState<UserType>({ id: '1', email: 'luna9098958@gmail.com' });
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  const [view, setView] = useState<ViewMode>(ViewMode.CHAT);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(() => Persistence.load(STORAGE_KEYS.STATUS, INITIAL_STATUS));
  const [agents, setAgents] = useState<Agent[]>(() => Persistence.load(STORAGE_KEYS.AGENTS, DEFAULT_AGENTS));
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => Persistence.load(STORAGE_KEYS.LOGS, []));
  const [memories, setMemories] = useState<Memory[]>(() => Persistence.load(STORAGE_KEYS.MEMORY, []));
  const [messages, setMessages] = useState<ChatMessage[]>(() => Persistence.load(STORAGE_KEYS.MESSAGES, []));
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [reasoningInput, setReasoningInput] = useState('');
  const [isReasoning, setIsReasoning] = useState(false);
  const [reasoningResult, setReasoningResult] = useState({ text: '' });
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [showJsonInjector, setShowJsonInjector] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [isSystemBlocked, setIsSystemBlocked] = useState(false);
  const [audioCache, setAudioCache] = useState<Record<string, Uint8Array>>({});
  const [preloadingAudioId, setPreloadingAudioId] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const virtuosoRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Pre-warm AI resources and location as soon as the app starts
    preWarmResources();
    
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          
          // Load server state after successful auth
          try {
            const stateRes = await fetch('/api/bioma/state');
            if (stateRes.ok) {
              const state = await stateRes.json();
              if (state.agents) setAgents(state.agents);
              if (state.messages) setMessages(state.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
              if (state.memories) setMemories(state.memories.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
              if (state.systemStatus) setSystemStatus(state.systemStatus);
              if (state.systemLogs) setSystemLogs(state.systemLogs.map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) })));
              addLog('SISTEMICO', 'MEMORIA_LARGO_PLAZO_SINCRONIZADA');
            }
          } catch (e) {
            console.error("Failed to load server state", e);
          }
        }
      } catch (e) {
        // Not authenticated
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  // Server Sync (Save)
  useEffect(() => {
    if (user && hasEntered) {
      const saveServerState = async () => {
        try {
          await fetch('/api/bioma/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agents,
              messages,
              memories,
              systemStatus,
              systemLogs
            })
          });
        } catch (e) {
          console.error("Failed to save server state", e);
        }
      };
      const timer = setTimeout(saveServerState, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, hasEntered, agents, messages, memories, systemStatus, systemLogs]);

  useEffect(() => {
    const themeData = THEMES[systemStatus.theme];
    const root = document.documentElement;
    root.style.setProperty('--bg-color', themeData.bg);
    root.style.setProperty('--panel-color', themeData.panel);
    root.style.setProperty('--border-color', themeData.border);
    root.style.setProperty('--accent-color', systemStatus.accentColor || themeData.accent);
    root.style.setProperty('--text-color', themeData.text);
    root.style.setProperty('--dim-color', themeData.dim);
    root.style.setProperty('--selection-color', themeData.selection);
    root.style.setProperty('--cursor-color', themeData.cursor);
    
    // Update body background for smoother transitions
    document.body.style.backgroundColor = themeData.bg;
    document.body.style.color = themeData.text;
  }, [systemStatus.theme, systemStatus.accentColor]);

  useEffect(() => Persistence.save(STORAGE_KEYS.AGENTS, agents), [agents]);
  useEffect(() => {
    Persistence.save(STORAGE_KEYS.STATUS, systemStatus);
  }, [systemStatus]);
  useEffect(() => debouncedSave(STORAGE_KEYS.MESSAGES, messages), [messages]);
  useEffect(() => debouncedSave(STORAGE_KEYS.LOGS, systemLogs), [systemLogs]);
  useEffect(() => debouncedSave(STORAGE_KEYS.MEMORY, memories), [memories]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'auto'
      });
    }
  }, [messages.length, isChatLoading, pendingMessages.length]);

  // Preload audio for new model messages immediately
  useEffect(() => {
    const latestMsg = messages[messages.length - 1];
    if (latestMsg && latestMsg.role === 'model' && !audioCache[latestMsg.id] && preloadingAudioId !== latestMsg.id && !quotaExceeded) {
      const preFetchAudio = async () => {
        setPreloadingAudioId(latestMsg.id);
        try {
          const agent = agents.find(a => a.id === latestMsg.agentId);
          const voiceConfig = agent?.voiceConfig || { voiceName: 'Kore', pitch: 1.0, rate: 1.0, gender: 'female' };
          const audioBytes = await generateSpeech(latestMsg.text, voiceConfig as any);
          if (audioBytes) {
            setAudioCache(prev => {
              if (prev[latestMsg.id]) return prev;
              return { ...prev, [latestMsg.id]: audioBytes };
            });
          }
        } catch (e: any) {
          const isQuota = e?.message?.includes('429') || e?.status === 'RESOURCE_EXHAUSTED' || e?.message?.includes('quota');
          if (isQuota) {
            setQuotaExceeded(true);
            addLog('SISTEMICO', 'CUOTA_VOZ_AGOTADA: Síntesis vocal deshabilitada temporalmente.');
          } else {
            console.error('Failed to pre-fetch audio', e);
          }
        } finally {
          setPreloadingAudioId(null);
        }
      };
      preFetchAudio();
    }
  }, [messages.length, agents, audioCache, preloadingAudioId, quotaExceeded]);

  const activeAgents = useMemo(() => agents.filter(a => systemStatus.activeAgentIds.includes(a.id)), [agents, systemStatus.activeAgentIds]);
  const primaryActiveColor = activeAgents.length > 0 ? activeAgents[0].color : systemStatus.accentColor;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      addLog('SISTEMICO', 'USER_LOGOUT_SUCCESS');
    } catch (e) {
      addLog('SISTEMICO', 'USER_LOGOUT_FAILED');
    }
  };

  const handleSendMessage = async (customInput?: string) => {
    const textToSubmit = customInput || input;
    if (!textToSubmit.trim()) return;

    // Command Parser - Only if starts with /
    if (textToSubmit.startsWith('/')) {
      const fullCommand = textToSubmit.substring(1);
      let [cmd, ...args] = fullCommand.trim().split(' ');
      let lowerCmd = cmd.toLowerCase();

      // Soporte para sintaxis: [Agente] [Comando]
      const isAgentName = agents.some(a => a.name.toLowerCase() === lowerCmd);
      if (isAgentName && args.length > 0 && COMMANDS.includes(args[0].toLowerCase())) {
        const agentName = cmd;
        cmd = args[0];
        lowerCmd = cmd.toLowerCase();
        args = [agentName, ...args.slice(1)];
      }

      if (lowerCmd === 'search') {
        const query = args.join(' ');
        if (query) {
          const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`;
          window.open(url, '_blank');
          addLog('EJECUCION', `Buscador Mundial: Iniciando rastreo de "${query}"...`);
          return;
        }
      } else if (lowerCmd === 'cls' || lowerCmd === 'clear') {
        setMessages([]);
        return;
      } else if (lowerCmd === 'sys.color' && args[0]) {
        handleExecuteScript('color', args[0]);
        return;
      } else if (lowerCmd === 'sys.glitch' && args[0]) {
        handleExecuteScript('glitch', args[0]);
        return;
      } else if (lowerCmd === 'sys.wipe') {
        handleExecuteScript('wipe', null);
        return;
      }
      // If it starts with / but isn't a known command, we can either show error or send as chat
      // For now, let's just send as chat if it's not a recognized command
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: textToSubmit, timestamp: new Date(), typingComplete: true }]);
    setInput('');
    setPendingMessages([]); // Clear any previous pending messages
    setIsChatLoading(true);
    try {
      const history = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'user' ? 'user' : 'model' as any, parts: [{ text: m.text }] }));
      const { text } = await sendMessageToGemini(textToSubmit, history, activeAgents, memories);
      
      const parts = parseGestaltResponse(text, activeAgents);
      const newMessages: ChatMessage[] = parts.map((part, index) => ({
        id: (Date.now() + index + 1).toString(),
        role: 'model',
        text: part.text,
        timestamp: new Date(),
        agentId: part.agentId
      }));
      
      if (newMessages.length > 0) {
        setMessages(prev => [...prev, newMessages[0]]);
        setPendingMessages(newMessages.slice(1));
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: 'ERR_UPLINK', timestamp: new Date(), typingComplete: true }]);
    } finally { setIsChatLoading(false); }
  };

  const handleDeepReasoning = async () => {
    if (!reasoningInput.trim() || isReasoning) return;
    setIsReasoning(true);
    setReasoningResult({ text: '' });
    try {
      const history = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'user' ? 'user' : 'model' as any, parts: [{ text: m.text }] }));
      await streamDeepReasoning(reasoningInput, history, activeAgents, (chunk) => {
        if (chunk.text) setReasoningResult(prev => ({ ...prev, text: (prev.text || '') + chunk.text }));
      });
    } catch (err) { setReasoningResult({ text: 'ERR_FAILURE' }); } finally { setIsReasoning(false); }
  };

  const handlePlayVoice = async (msg: ChatMessage) => {
    if (playingMessageId === msg.id) return;
    setPlayingMessageId(msg.id);
    try {
      let audioBytes = audioCache[msg.id];
      if (!audioBytes) {
        if (quotaExceeded) {
          addLog('SISTEMICO', 'ERROR: Cuota de voz agotada. Reintenta más tarde.');
          setPlayingMessageId(null);
          return;
        }
        const agent = agents.find(a => a.id === msg.agentId);
        const voiceConfig = agent?.voiceConfig || { voiceName: 'Kore', pitch: 1.0, rate: 1.0, gender: 'female' };
        audioBytes = await generateSpeech(msg.text, voiceConfig as any);
        if (audioBytes) {
          setAudioCache(prev => ({ ...prev, [msg.id]: audioBytes! }));
        }
      }

      if (audioBytes) {
        const ensureContext = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          return audioCtxRef.current;
        };

        let ctx = ensureContext();
        
        try {
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
        } catch (resumeErr) {
          console.warn("Failed to resume audio context, recreating...", resumeErr);
          ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          audioCtxRef.current = ctx;
          await ctx.resume();
        }

        const buffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setPlayingMessageId(null);
        source.start();
      } else {
        setPlayingMessageId(null);
      }
    } catch (e: any) {
      console.error('Voice playback error:', e);
      const isQuota = e?.message?.includes('429') || e?.status === 'RESOURCE_EXHAUSTED' || e?.message?.includes('quota');
      if (isQuota) {
        setQuotaExceeded(true);
        addLog('SISTEMICO', 'CUOTA_VOZ_AGOTADA: Límite de peticiones alcanzado.');
      }
      setPlayingMessageId(null);
    }
  };

      const handleAddMemory = (content: string) => {
    const newMemory: Memory = { id: Date.now().toString(), content, timestamp: new Date() };
    setMemories(prev => [newMemory, ...prev]);
    addLog('SISTEMICO', `New memory added: "${content.substring(0, 20)}..."`);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    addLog('SISTEMICO', `Memory forgotten: ID ${id}`);
  };

  const handleClearLogs = () => {
    setSystemLogs([]);
    Persistence.save(STORAGE_KEYS.LOGS, []);
  };

  const addLog = (type: any, content: string) => {
    setSystemLogs(prev => [{ id: Math.random().toString(), type, content, timestamp: new Date() }, ...prev].slice(0, 30));
  };

  const handleExecuteScript = (type: string, val: any) => {
    switch (type) {
      case 'glitch': setSystemStatus(prev => ({ ...prev, glitchIntensity: Number(val) })); break;
      case 'color': setSystemStatus(prev => ({ ...prev, accentColor: String(val) })); break;
      case 'integrity': setSystemStatus(prev => ({ ...prev, integrity: Number(val) })); break;
      case 'wipe': Persistence.wipe(); break;
      case 'protocol':
        if (val === 'SONRISA_DEPREDEDORA') {
          setSystemStatus(prev => ({ ...prev, integrity: 15, glitchIntensity: 0.8, accentColor: '#ff0000' }));
          addLog('EJECUCION', 'ERROR: Data corrupta (KAFE) - Fase de validación en curso...');
          addLog('SISTEMICO', 'DATA_EN_REVISION: KAFE');
        } else if (val === 'TERMINATE_ALL') {
          setIsSystemLocked(true);
          setSystemStatus(prev => ({ ...prev, integrity: 0, glitchIntensity: 1.0, accentColor: '#ff0000' }));
          addLog('EJECUCION', 'Ejecutando terminación de todos los procesos... Sistema bloqueado temporalmente.');
          addLog('SISTEMICO', 'PURGADO - ESTADO KAFE');
        } else if (val === 'ESTABILIZAR_N') {
          setSystemStatus(prev => ({ ...prev, integrity: 100, glitchIntensity: 0.0, accentColor: '#00ff00' }));
          addLog('EJECUCION', 'Protocolo de estabilización completado. Sistemas nominales.');
          addLog('SISTEMICO', 'SISTEMA_ESTABILIZADO');
        } else {
          addLog('EJECUCION', `ERROR: Protocolo no reconocido [${val}].`);
          addLog('SISTEMICO', 'Formatos sugeridos: SONRISA_DEPREDEDORA, TERMINATE_ALL, ESTABILIZAR_N');
        }
        break;
      case 'status_check':
        if (val === 'SONRISA_DEPREDEDORA') {
          addLog('EJECUCION', 'Data procesada con estado KAFE: Error Detectado...');
          addLog('SISTEMICO', 'Estado KAFE: Data sospechosa');
        }
        break;
      case 'purge':
        if (val === 'TERMINATE_ALL') {
          addLog('EJECUCION', 'Ejecutando terminación de todos los procesos... Sistema bloqueado temporalmente.');
          addLog('SISTEMICO', 'Purgado - Estado KAFE');
          setIsSystemBlocked(true);
          setTimeout(() => setIsSystemBlocked(false), 5000);
        }
        break;
    }
    addLog('SISTEMICO', `${type}|${val}`);
  };

  const handleUpdateAgent = (updated: Agent) => {
    setAgents(prev => {
      const exists = prev.some(a => a.id === updated.id);
      if (exists) {
        return prev.map(a => a.id === updated.id ? updated : a);
      } else {
        const newAgent = { ...updated, id: updated.id || `agent_${Date.now()}` };
        return [...prev, newAgent];
      }
    });
    setEditingAgentId(null);
    addLog('SISTEMICO', `AGENT_CONFIG_SAVED|${updated.name}`);
  };

  const handleInjectJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];
      
      const newAgents: Agent[] = dataArray.map(data => ({
        id: data.id_agente || data.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: data.nombre_clave || data.name || 'DESCONOCIDO',
        role: data.rol || data.role || 'OPERATIVO',
        nivel_acceso: data.nivel_acceso || data.access_level || 'ESTANDAR',
        systemInstruction: data.instruccion || data.systemInstruction || 'Actúa como un agente del Bioma Oxidiana.',
        color: data.color || '#ffffff',
        status: data.status || 'ONLINE',
        avatar: data.avatar || data.avatar_url || undefined,
        config: data.config || { syntropy: 0.5, entropy: 0.5 },
        voiceConfig: data.voiceConfig || { voiceName: 'Kore', pitch: 1.0, rate: 1.0, gender: 'female' },
        visualConfig: data.visualConfig || { drift: 5, jitter: 1, expansion: 2 }
      }));

      setAgents(prev => [...prev, ...newAgents]);
      setShowJsonInjector(false);
      setJsonInput('');
      addLog('INYECCION', `${newAgents.length} agent(s) injected via JSON.`);
    } catch (e) {
      alert('ERROR DE ESQUEMA JSON: Payload inválido. Verifica la sintaxis.');
    }
  };

  const getAgentIcon = (agent: Agent) => {
    if (agent.avatar) {
      return <img src={agent.avatar} alt={agent.name} className="w-5 h-5 rounded-full object-cover border border-white/20" referrerPolicy="no-referrer" />;
    }
    if (agent.nivel_acceso === 'OMEGA') return <Shield size={14} />;
    if (agent.role?.toLowerCase().includes('infiltración')) return <Ghost size={14} />;
    return <User size={14} />;
  };

  const onTypingComplete = useCallback((msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? {...m, typingComplete: true} : m));
    
    setPendingMessages(prev => {
      if (prev.length === 0) return prev;
      const nextMsg = prev[0];
      setMessages(currentMsgs => [...currentMsgs, nextMsg]);
      return prev.slice(1);
    });
  }, []);

  const handleEnter = () => {
    setHasEntered(true);
    const hasSeenTutorial = localStorage.getItem('ox_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('ox_tutorial_seen', 'true');
  };

  const handleWebSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setIsSearchVisible(false);
      return;
    }
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    setSearchQuery('');
    setIsSearchVisible(false);
  };

  const toggleSearch = () => {
    setIsSearchVisible(prev => !prev);
    if (!isSearchVisible) {
      // Focus will be handled by autoFocus, but we can ensure it here if needed
      // or use a useEffect
    } else {
      setSearchQuery('');
    }
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-oxidiana-black flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-oxidiana-red border-t-transparent rounded-full animate-spin"></div>
          <div className="text-[10px] text-oxidiana-red uppercase tracking-[0.3em] animate-pulse">Iniciando Protocolos de Acceso...</div>
        </div>
      </div>
    );
  }

  if (!hasEntered) {
    return <BloodMoonEntry onEnter={handleEnter} />;
  }

  if (isSystemLocked) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center font-mono p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="w-full h-full animate-glitch bg-red-900/10"></div>
        </div>
        <div className="z-10 space-y-6">
          <div className="w-24 h-24 border-4 border-red-600 flex items-center justify-center mx-auto animate-pulse">
            <Shield size={48} className="text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-red-600 tracking-[0.5em] uppercase animate-glitch">SISTEMA PURGADO</h1>
          <div className="space-y-2">
            <p className="text-red-500 text-sm uppercase tracking-widest font-bold">ESTADO KAFE: BLOQUEO TOTAL</p>
            <p className="text-white/40 text-[10px] uppercase tracking-tighter">Todos los procesos han sido terminados por protocolo de seguridad.</p>
          </div>
          <div className="pt-10">
            <button 
              onClick={() => {
                setIsSystemLocked(false);
                setSystemStatus(prev => ({ ...prev, integrity: 100, glitchIntensity: 0, accentColor: '#ff003c' }));
                addLog('SISTEMICO', 'REINICIO_FORZADO_POST_PURGA');
              }}
              className="px-8 py-3 bg-red-600 text-black font-bold uppercase tracking-widest hover:bg-white transition-colors"
            >
              Reiniciar Núcleo
            </button>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 text-[8px] text-red-900 uppercase font-bold">
          Oxidiana OS // Kernel Panic // Error 0xKAFE
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0c] text-gray-300 text-[10px] ${systemStatus.preferredFont === 'tech' ? 'font-tech' : 'font-mono'} relative`} 
    >
      <DynamicBackground 
        intensity={systemStatus.glitchIntensity} 
        accentColor={systemStatus.accentColor || '#ff003c'} 
      />
      
      {isSystemBlocked && (
        <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center animate-pulse">
           <div className="text-center space-y-4">
              <div className="text-oxidiana-red text-2xl font-bold tracking-[0.5em] uppercase animate-glitch">SISTEMA PURGADO</div>
              <div className="text-oxidiana-dim text-[10px] uppercase tracking-widest">Estado KAFE Detectado // Reiniciando Núcleo...</div>
              <div className="w-64 h-1 bg-white/10 mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-oxidiana-red w-1/2 animate-[scan-y_2s_linear_infinite]"></div>
              </div>
           </div>
        </div>
      )}

      <header className="h-8 border-b border-white/10 flex items-center justify-between px-3 bg-black/90 z-50 shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <Hexagon size={12} style={{ color: primaryActiveColor }} className="animate-pulse" />
          <span className="font-bold tracking-tighter uppercase text-[8px]">OXIDIANA // L-{systemStatus.layer}</span>
          <div className="h-3 w-[1px] bg-white/10 mx-1"></div>
          
          <AnimatePresence>
            {isSearchVisible ? (
              <motion.form 
                initial={{ width: 0, opacity: 0, x: -10 }}
                animate={{ width: 240, opacity: 1, x: 0 }}
                exit={{ width: 0, opacity: 0, x: -10 }}
                onSubmit={handleWebSearch}
                className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1 ml-4 overflow-hidden shadow-inner group focus-within:border-oxidiana-red/50 transition-all"
              >
                <Search size={12} className="text-oxidiana-red/60 group-focus-within:text-oxidiana-red transition-colors mr-2" />
                <input 
                  ref={searchInputRef}
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchQuery('');
                      setIsSearchVisible(false);
                    }
                  }}
                  onBlur={() => {
                    if (!searchQuery.trim()) setIsSearchVisible(false);
                  }}
                  placeholder="RASTREAR_EN_RED_GLOBAL..."
                  className="bg-transparent border-none outline-none text-[9px] uppercase tracking-widest text-white placeholder:text-white/20 w-full font-mono"
                />
                <button type="submit" className="hidden" />
              </motion.form>
            ) : (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1, color: '#ff003c' }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleSearch}
                className="p-1.5 transition-colors text-white/40 ml-4 rounded-full hover:bg-white/5"
                title="Búsqueda Web"
              >
                <Search size={14} />
              </motion.button>
            )}
          </AnimatePresence>
          
          <div className="h-3 w-[1px] bg-white/10 mx-1"></div>
          <span className="text-[7px] opacity-60 uppercase tracking-widest truncate max-w-[100px]">{user.email}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 opacity-40 text-[7px] uppercase font-bold tracking-widest">
             <span>INT: {systemStatus.integrity}%</span>
             <span>ENT: {(systemStatus.glitchIntensity * 100).toFixed(0)}%</span>
          </div>
          <button 
            onClick={handleLogout}
            className="ml-2 p-1 hover:text-oxidiana-red transition-colors"
            title="Desconectar"
          >
            <Power size={12} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col bg-oxidiana-black">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-black/20">
            <div className="flex flex-col items-center gap-3">
              <BrainCircuit size={24} className="text-oxidiana-red animate-pulse" />
              <div className="text-[8px] uppercase tracking-[0.3em] text-oxidiana-red/60 font-bold">Cargando Módulo...</div>
            </div>
          </div>
        }>
          {view === ViewMode.CHAT && (
          <div className="flex h-full border border-[#2a2a35] bg-[#050508]/80 rounded-sm overflow-hidden">
            {/* Active Agents Sidebar */}
            <div className="w-48 border-r border-white/5 bg-black/40 flex flex-col shrink-0 hidden lg:flex">
              <div className="p-3 border-b border-white/5 text-[8px] uppercase font-black tracking-[0.2em] text-white/40">
                Agentes Activos
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {activeAgents.map(agent => (
                  <div key={agent.id} className="p-2 rounded border border-white/5 bg-white/5 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: agent.color }}>
                        {agent.avatar ? (
                          <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[6px] font-bold text-white">{agent.name[0]}</span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold truncate" style={{ color: agent.color }}>{agent.name}</span>
                    </div>
                    <div className="text-[7px] uppercase opacity-50 truncate">{agent.role}</div>
                    <div className="text-[6px] opacity-30 line-clamp-2 leading-tight">{agent.systemInstruction}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="h-8 border-b border-white/5 flex items-center justify-between px-3 bg-black/40 shrink-0">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={12} className={`${activeAgents.length > 1 ? 'text-cyan-400 animate-bounce' : 'text-orange-500 animate-pulse'}`} />
                  <span className={`text-[8px] font-bold uppercase tracking-[0.2em] ${activeAgents.length > 1 ? 'text-cyan-400' : 'text-orange-500/80'}`}>
                    {activeAgents.length > 1 ? 'MODO_GESTALT_ACTIVO' : 'Bioma Multi-Agente iAAS'} // Uplink Activo
                  </span>
                </div>
                <div className="flex gap-1">
                  {activeAgents.map(a => (
                    <div key={a.id} className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: a.color }}></div>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-hidden p-2">
                <Virtuoso
                  ref={virtuosoRef}
                  data={messages}
                  followOutput="smooth"
                  initialTopMostItemIndex={messages.length - 1}
                  itemContent={(i, msg) => {
                    const agent = msg.agentId ? agents.find(a => a.id === msg.agentId) : null;
                    const isUser = msg.role === 'user';
                    const color = isUser ? '#FFA500' : (agent?.color || primaryActiveColor);

                    return (
                      <ChatMessageItem 
                        msg={msg}
                        agent={agent || null}
                        isUser={isUser}
                        color={color}
                        playingMessageId={playingMessageId}
                        onPlayVoice={handlePlayVoice}
                        onTypingComplete={onTypingComplete}
                        glitchIntensity={systemStatus.glitchIntensity}
                      />
                    );
                  }}
                  components={{
                    Footer: () => {
                      if (!isChatLoading && pendingMessages.length === 0) return <div className="h-10" />;
                      return (
                        <div className="flex items-center gap-4 py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                           <div className="w-10 h-10 rounded-xl border-2 border-orange-500/30 bg-orange-500/5 flex items-center justify-center shadow-[0_0_20px_rgba(255,140,0,0.1)]">
                              <BrainCircuit size={20} className="text-orange-500 animate-pulse" />
                           </div>
                           <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase font-black text-orange-500 tracking-[0.3em] drop-shadow-[0_0_8px_rgba(255,140,0,0.5)]">
                                  {isChatLoading ? 'GESTALT_PROCESANDO_SINAPSIS' : 'SINCRONIZANDO_RESPUESTA_AGENTE'}
                                </span>
                                <span className="text-[7px] text-orange-500/40 animate-pulse">● ● ●</span>
                              </div>
                              <div className="flex gap-1.5 items-center">
                                <div className="h-1 w-8 bg-orange-500/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 animate-progress-indefinite" />
                                </div>
                                <span className="text-[7px] text-gray-600 uppercase font-bold tracking-widest">Uplink Activo</span>
                              </div>
                           </div>
                        </div>
                      );
                    }
                  }}
                />
              </div>
              <div className="p-2 border-t-2 border-[#2a2a35] bg-[#050508]">
                <C2Terminal onSend={handleSendMessage} agents={activeAgents} />
              </div>
            </div>
          </div>
        )}



        
        {view === ViewMode.AGENTS && (
          <div className="h-full overflow-hidden flex flex-col border border-[#2a2a35] bg-[#050508]/80 rounded-sm relative">
            <div className="p-3 border-b-2 border-[#2a2a35] flex justify-between items-center bg-black/50 shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Panel Táctico: Unidades Activas</span>
                <span className="text-[7px] uppercase text-orange-500/60 font-black tracking-widest">
                  Uplink Multi-Agente iAAS // {systemStatus.activeAgentIds.length} ACTIVOS
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSystemStatus(p => ({...p, activeAgentIds: agents.map(a => a.id)}))}
                  className="px-2 py-1 border border-[#3a3a45] rounded-sm bg-black/50 hover:bg-white/5 text-[8px] font-bold uppercase tracking-widest text-gray-500 hover:text-orange-400 transition-colors"
                >
                  Activar Todos
                </button>
                <button 
                  onClick={() => setSystemStatus(p => ({...p, activeAgentIds: []}))}
                  className="px-2 py-1 border border-[#3a3a45] rounded-sm bg-black/50 hover:bg-white/5 text-[8px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-400 transition-colors"
                >
                  Purgar Uplink
                </button>
                <div className="w-px h-4 bg-white/10 mx-1 self-center"></div>
                <button onClick={() => setShowJsonInjector(true)} className="p-2 border border-[#3a3a45] rounded-sm bg-black/50 hover:bg-white/5 text-gray-500 hover:text-cyan-400 transition-colors" title="Inyectar JSON"><FileCode size={14} /></button>
                <button onClick={() => setEditingAgentId('new')} className="p-2 border border-[#3a3a45] rounded-sm bg-black/50 hover:bg-white/5 text-gray-500 hover:text-green-400 transition-colors" title="Crear Manual"><Plus size={14} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {agents.length === 0 ? (
                <div className="h-full flex items-center justify-center opacity-20 uppercase italic text-center px-10 text-gray-600">No hay agentes desplegados en el sistema.</div>
              ) : (
                <Virtuoso
                  data={agents}
                  itemContent={(index, a) => {
                    const isActive = systemStatus.activeAgentIds.includes(a.id);
                    return (
                      <div 
                        className={`w-full grid grid-cols-12 p-4 border-b border-[#2a2a35] items-center transition-all duration-300 cursor-pointer hover:bg-white/5`}
                        style={{ 
                          backgroundColor: isActive ? `${a.color}25` : 'transparent',
                          borderLeft: isActive ? `8px solid ${a.color}`: '4px solid transparent',
                          boxShadow: isActive ? `inset 20px 0 40px -20px ${a.color}80` : 'none',
                          opacity: isActive ? 1 : 0.4,
                        }}
                        onClick={() => setSystemStatus(p => {
                          const isAlreadyActive = p.activeAgentIds.includes(a.id);
                          const newActiveIds = isAlreadyActive 
                            ? p.activeAgentIds.filter(id => id !== a.id)
                            : [...p.activeAgentIds, a.id];
                          return {...p, activeAgentIds: newActiveIds};
                        })}
                      >
                        <div className="col-span-1 flex items-center justify-center" style={{ color: a.color, filter: isActive ? `drop-shadow(0 0 8px ${a.color})` : 'none' }}>{getAgentIcon(a)}</div>
                        <div className="col-span-4 font-bold text-left truncate pl-3 text-sm tracking-tight" style={{ color: isActive ? '#ffffff' : '#a0a0a0', textShadow: isActive ? `0 0 10px ${a.color}80` : 'none' }}>{a.name}</div>
                        <div className="col-span-4 text-left opacity-70 truncate text-[10px] uppercase tracking-widest font-medium" style={{ color: isActive ? a.color : 'inherit' }}>{a.role}</div>
                        <div className="col-span-3 flex justify-end gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingAgentId(a.id); }} 
                            className="p-2 rounded-md hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                          >
                            <Settings2 size={16} />
                          </button>
                          <div className={`p-2 rounded-full transition-all duration-500 ${isActive ? 'scale-110' : 'opacity-20'}`} style={{ color: a.color }}>
                            <Zap size={16} fill={isActive ? a.color : 'transparent'} className={isActive ? 'animate-pulse' : ''} />
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  className="custom-scrollbar"
                />
              )}
            </div>

            {showJsonInjector && (
              <div className="absolute inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col p-4 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4 border-b-2 border-[#2a2a35] pb-3">
                  <span className="text-[12px] font-bold uppercase tracking-widest flex items-center gap-2 text-cyan-400"><FileCode size={14} /> Protocolo de Inyección JSON</span>
                  <button onClick={() => setShowJsonInjector(false)} className="text-gray-600 hover:text-white transition-colors"><X size={18} /></button>
                </div>
                <textarea 
                  value={jsonInput} 
                  onChange={e => setJsonInput(e.target.value)} 
                  placeholder='{ "id_agente": "agente_01", "nombre_clave": "...", "rol": "...", "nivel_acceso": "OMEGA", "color": "#ff0000", "avatar": "https://picsum.photos/200" }'
                  className="flex-1 bg-black border border-[#3a3a45] rounded p-4 font-mono text-sm outline-none focus:border-cyan-500/50 resize-none text-green-400 placeholder:text-gray-700"
                />
                <button onClick={handleInjectJson} className="mt-4 w-full py-3 bg-green-900/50 border border-green-500/60 text-green-300 font-bold uppercase tracking-widest rounded-sm hover:bg-green-800/50 hover:text-white transition-colors active:bg-green-500 active:text-black">Ejecutar Despliegue Táctico</button>
              </div>
            )}
            
            {editingAgentId && (
              <AgentEditor 
                agent={editingAgentId === 'new' ? DEFAULT_NEW_AGENT : agents.find(a => a.id === editingAgentId)!}
                onSave={handleUpdateAgent}
                onClose={() => setEditingAgentId(null)}
              />
            )}
          </div>
        )}

        {view === ViewMode.GRIMORIO && <Grimorio logs={systemLogs} status={systemStatus} onExecuteScript={handleExecuteScript} onClearLogs={handleClearLogs} />}
        
        {view === ViewMode.PROTOCOLS && <Protocols onAddLog={addLog} />}
        {view === ViewMode.MEMORY && <LongTermMemory memories={memories} onAddMemory={handleAddMemory} onDeleteMemory={handleDeleteMemory} />}
        {view === ViewMode.LIVE_CHAT && (
          <div className="h-full p-4">
            <LiveChat user={user} />
          </div>
        )}
        </Suspense>
      </main>

      <nav className="h-14 border-t-2 border-[#2a2a35] bg-[#050508]/80 backdrop-blur-sm flex items-center justify-around shrink-0 z-50">
        <button onClick={() => setView(ViewMode.CHAT)} className={`p-2 rounded-md transition-colors ${view === ViewMode.CHAT ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Terminal"><Terminal size={18} /></button>
        <button onClick={() => setView(ViewMode.AGENTS)} className={`p-2 rounded-md transition-colors ${view === ViewMode.AGENTS ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Agentes"><Users size={18} /></button>
        
        <button onClick={() => setView(ViewMode.GRIMORIO)} className={`p-2 rounded-md transition-colors ${view === ViewMode.GRIMORIO ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Grimorio"><Book size={18} /></button>
        <button onClick={() => setView(ViewMode.PROTOCOLS)} className={`p-2 rounded-md transition-colors ${view === ViewMode.PROTOCOLS ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Protocolos"><Shield size={18} /></button>
        <button onClick={() => setView(ViewMode.MEMORY)} className={`p-2 rounded-md transition-colors ${view === ViewMode.MEMORY ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Memoria"><Database size={18} /></button>
        <button onClick={() => setView(ViewMode.LIVE_CHAT)} className={`p-2 rounded-md transition-colors ${view === ViewMode.LIVE_CHAT ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Comunicaciones Globales"><Globe size={18} /></button>
      </nav>

      <AnimatePresence>
        {showTutorial && <Tutorial onClose={handleCloseTutorial} />}
      </AnimatePresence>
    </motion.div>
  );
}