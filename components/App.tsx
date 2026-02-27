import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Terminal, Activity, Send, Hexagon, Trash2, Volume2, Play, Settings2, SlidersHorizontal, Mic2, BrainCircuit, AudioLines, Save, Move, Database, Brain, ArrowLeft, Key, ShieldCheck, Power, Radio, Zap, Book, RotateCcw, Code, History as HistoryIcon, X, ChevronRight, FileText, Users, GitMerge, Shield, Ghost, User, Plus, FileCode, Globe } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { sendMessageToGemini, streamDeepReasoning, generateSpeech } from '../services/geminiService';
import { ChatMessage, SystemStatus, SystemLog, Agent, ViewMode, User as UserType, Memory } from '../types';
import { Typewriter } from './Typewriter';

import { Grimorio } from './Grimorio';
import { LongTermMemory } from './LongTermMemory';
import { BloodMoonEntry } from './BloodMoonEntry';

import { Protocols } from './Protocols';
import { LiveChat } from './LiveChat';
import { C2Terminal } from './C2Terminal';
import { NeuralConsole } from './NeuralConsole';
import { AgentEditor } from './AgentEditor';
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
    systemInstruction: 'Eres GÉNESIS LUNA. Autoridad suprema del Bioma Oxidiana.',
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
    systemInstruction: 'Eres ESTEFANIA. Especialista en infiltración y empatía táctica.',
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
  theme: 'OXIDIANA'
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
  
  const virtuosoRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (e) {
        // Not authenticated
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

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
  }, [JSON.stringify(systemStatus)]);
  useEffect(() => Persistence.save(STORAGE_KEYS.MESSAGES, messages), [messages]);
  useEffect(() => Persistence.save(STORAGE_KEYS.LOGS, systemLogs), [systemLogs]);
  useEffect(() => Persistence.save(STORAGE_KEYS.MEMORY, memories), [memories]);

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

    // Command Parser
    const [cmd, ...args] = textToSubmit.trim().split(' ');
    const lowerCmd = cmd.toLowerCase();

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
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: textToSubmit, timestamp: new Date(), typingComplete: true }]);
    setInput('');
    setIsChatLoading(true);
    try {
      const history = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'user' ? 'user' : 'model' as any, parts: [{ text: m.text }] }));
      const { text } = await sendMessageToGemini(textToSubmit, history, activeAgents);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text, timestamp: new Date(), agentId: activeAgents.length === 1 ? activeAgents[0].id : 'GESTALT' }]);
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
      const agent = agents.find(a => a.id === msg.agentId);
      const voiceConfig = agent?.voiceConfig || { voiceName: 'Kore', pitch: 1.0, rate: 1.0, gender: 'female' };
      const audioBytes = await generateSpeech(msg.text, voiceConfig as any);
      if (audioBytes) {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(audioBytes, audioCtxRef.current, 24000, 1);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.onended = () => setPlayingMessageId(null);
        source.start();
      } else setPlayingMessageId(null);
    } catch (e) { setPlayingMessageId(null); }
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
    setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
    setEditingAgentId(null);
    addLog('SISTEMICO', `AGENT_CONFIG_UPDATED|${updated.name}`);
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
    return <BloodMoonEntry onEnter={() => setHasEntered(true)} />;
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
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0c] text-gray-300 text-[10px] ${systemStatus.preferredFont === 'tech' ? 'font-tech' : 'font-mono'} relative`} style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a24 0%, #050505 100%)' }}>
      {/* Background texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'#ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
      
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
        <div className="flex items-center gap-2">
          <Hexagon size={12} style={{ color: primaryActiveColor }} className="animate-pulse" />
          <span className="font-bold tracking-tighter uppercase text-[8px]">OXIDIANA // L-{systemStatus.layer}</span>
          <div className="h-3 w-[1px] bg-white/10 mx-1"></div>
          <span className="text-[7px] opacity-60 uppercase tracking-widest">{user.email}</span>
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
        {view === ViewMode.CHAT && (
          <div className="flex flex-col h-full border border-[#2a2a35] bg-[#050508]/80 rounded-sm">
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
                    <div className={`flex py-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className="relative max-w-[85%] p-3 border bg-black/50 shadow-md"
                        style={{ 
                          borderColor: `${color}40`,
                          boxShadow: `0 2px 15px -5px ${color}20`,
                          borderLeft: isUser ? '1px solid' : '3px solid',
                          borderRight: isUser ? '3px solid' : '1px solid',
                          borderLeftColor: isUser ? `${color}40` : color,
                          borderRightColor: isUser ? color : `${color}40`,
                        }}
                      >
                        <div className="text-[8px] uppercase opacity-60 mb-2 flex justify-between gap-4 font-bold tracking-widest" style={{ color }}>
                           <span>{msg.agentId === 'GESTALT' ? 'GESTALT' : (agent?.name || msg.role)}</span>
                           <div className="flex gap-2 items-center">
                             {msg.role === 'model' && (
                               <button onClick={() => handlePlayVoice(msg)} className={`${playingMessageId === msg.id ? 'text-green-400 animate-pulse' : 'text-gray-500 hover:text-green-400'}`}>
                                 <Volume2 size={10} />
                               </button>
                             )}
                             <span className="opacity-50">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           </div>
                        </div>
                        <div className="text-[11px] font-tech leading-relaxed whitespace-pre-wrap text-gray-300">
                          {msg.role === 'model' && !msg.typingComplete ? (
                            <Typewriter text={msg.text} speed={5} onComplete={useCallback(() => {
                              setMessages(prev => prev.map(m => m.id === msg.id ? {...m, typingComplete: true} : m));
                            }, [msg.id])} />
                          ) : <span>{msg.text}</span>}
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
            </div>
            <div className="p-2 border-t-2 border-[#2a2a35] bg-[#050508]">
              <C2Terminal onSend={handleSendMessage} />
            </div>
          </div>
        )}



        
        {view === ViewMode.AGENTS && (
          <div className="h-full overflow-hidden flex flex-col border border-[#2a2a35] bg-[#050508]/80 rounded-sm relative">
            <div className="p-3 border-b-2 border-[#2a2a35] flex justify-between items-center bg-black/50 shrink-0">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Panel Táctico: Unidades Activas</span>
              <div className="flex gap-2">
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
                        className={`w-full grid grid-cols-12 p-3 border-b border-[#2a2a35] items-center transition-all duration-300`}
                        style={{ 
                          backgroundColor: isActive ? `${a.color}15` : 'transparent',
                          borderLeft: isActive ? `4px solid ${a.color}`: '4px solid transparent',
                          opacity: isActive ? 1 : 0.5,
                        }}
                      >
                        <div className="col-span-1 flex items-center justify-center" style={{ color: a.color }}>{getAgentIcon(a)}</div>
                        <div className="col-span-4 font-bold text-left truncate pl-2 text-sm" style={{ color: isActive ? a.color : '#a0a0a0' }}>{a.name}</div>
                        <div className="col-span-4 text-left opacity-70 truncate text-[10px] uppercase tracking-wider">{a.role}</div>
                        <div className="col-span-3 flex justify-end gap-2">
                          <button onClick={() => setEditingAgentId(a.id)} className="p-2 rounded-sm hover:bg-white/10 text-gray-500 hover:text-white transition-colors"><Settings2 size={14} /></button>
                          <button onClick={() => setSystemStatus(p => ({...p, activeAgentIds: [a.id]}))} className={`p-2 rounded-sm border transition-colors ${isActive ? 'bg-white/10 border-white/50 text-white' : 'border-[#3a3a45] text-gray-600 hover:text-white'}`}><Zap size={14} /></button>
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
            
            {(editingAgentId && editingAgentId !== 'new') && (
              <AgentEditor 
                agent={agents.find(a => a.id === editingAgentId)!}
                onSave={handleUpdateAgent}
                onClose={() => setEditingAgentId(null)}
              />
            )}
          </div>
        )}

        {view === ViewMode.GRIMORIO && <Grimorio logs={systemLogs} status={systemStatus} onExecuteScript={handleExecuteScript} onClearLogs={handleClearLogs} />}
        {view === ViewMode.CONSOLE && <NeuralConsole status={systemStatus} onLog={addLog} />}
        
        {view === ViewMode.PROTOCOLS && <Protocols />}
        {view === ViewMode.MEMORY && <LongTermMemory memories={memories} onAddMemory={handleAddMemory} onDeleteMemory={handleDeleteMemory} />}
        {view === ViewMode.LIVE_CHAT && (
          <div className="h-full p-4">
            <LiveChat user={user} />
          </div>
        )}
      </main>

      <nav className="h-14 border-t-2 border-[#2a2a35] bg-[#050508]/80 backdrop-blur-sm flex items-center justify-around shrink-0 z-50">
        <button onClick={() => setView(ViewMode.CHAT)} className={`p-2 rounded-md transition-colors ${view === ViewMode.CHAT ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Terminal"><Terminal size={18} /></button>
        <button onClick={() => setView(ViewMode.AGENTS)} className={`p-2 rounded-md transition-colors ${view === ViewMode.AGENTS ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Agentes"><Users size={18} /></button>
        
        <button onClick={() => setView(ViewMode.GRIMORIO)} className={`p-2 rounded-md transition-colors ${view === ViewMode.GRIMORIO ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Grimorio"><Book size={18} /></button>
        <button onClick={() => setView(ViewMode.CONSOLE)} className={`p-2 rounded-md transition-colors ${view === ViewMode.CONSOLE ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Consola"><Radio size={18} /></button>
        <button onClick={() => setView(ViewMode.PROTOCOLS)} className={`p-2 rounded-md transition-colors ${view === ViewMode.PROTOCOLS ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Protocolos"><Shield size={18} /></button>
        <button onClick={() => setView(ViewMode.MEMORY)} className={`p-2 rounded-md transition-colors ${view === ViewMode.MEMORY ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Memoria"><Database size={18} /></button>
        <button onClick={() => setView(ViewMode.LIVE_CHAT)} className={`p-2 rounded-md transition-colors ${view === ViewMode.LIVE_CHAT ? 'text-orange-400 bg-orange-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}`} title="Comunicaciones Globales"><Globe size={18} /></button>
      </nav>
    </div>
  );
}