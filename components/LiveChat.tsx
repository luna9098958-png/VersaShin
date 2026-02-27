import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Users, Activity, Search as SearchIcon, X } from 'lucide-react';
import { User } from '../types';
import { GlobalSearch } from './GlobalSearch';

interface LiveChatProps {
  user: User;
}

interface ChatMessage {
  id: string;
  userId: string;
  userEmail: string;
  text: string;
  timestamp: number;
}

export const LiveChat: React.FC<LiveChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Conectar al servidor de WebSockets en el mismo origen
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Escuchar mensajes entrantes
    socket.on('chat_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll hacia abajo cuando llega un nuevo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userEmail: user.email || 'Agente Desconocido',
      text: input.trim(),
      timestamp: Date.now(),
    };

    // Enviar el mensaje al servidor para que lo retransmita
    socketRef.current.emit('chat_message', newMessage);
    setInput('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-black text-red-500 font-mono border border-red-900/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-red-950/30 p-4 border-b border-red-900/50 grid grid-cols-3 items-center">
        {/* Left: Status */}
        <div className="flex items-center gap-2 text-xs justify-start">
          <Activity size={14} className={isConnected ? "text-green-500 animate-pulse" : "text-red-500"} />
          <span className={isConnected ? "text-green-500" : "text-red-500"}>
            {isConnected ? 'EN LÍNEA' : 'DESCONECTADO'}
          </span>
        </div>

        {/* Center: Title */}
        <div className="flex items-center justify-center gap-3">
          <Users className="text-red-500" size={20} />
          <h2 className="text-lg font-bold tracking-widest uppercase text-red-500 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)] text-center">
            Comunicaciones Globales
          </h2>
          <Users className="text-red-500" size={20} />
        </div>

        {/* Right: Search Toggle */}
        <div className="flex justify-end">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-full transition-all ${showSearch ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'text-red-500 hover:bg-red-900/20'}`}
            title="Buscador Mundial"
          >
            {showSearch ? <X size={18} /> : <SearchIcon size={18} />}
          </button>
        </div>
      </div>

      {/* Global Search Panel */}
      {showSearch && (
        <div className="p-4 bg-black border-b border-red-900/50 animate-in slide-in-from-top duration-300">
          <GlobalSearch />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/10 via-black to-black">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-red-900/50 space-y-4">
            <Activity size={48} className="animate-pulse" />
            <p className="tracking-widest uppercase text-sm">Esperando transmisiones...</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === user.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[10px] text-red-800/70">{formatTime(msg.timestamp)}</span>
                  <span className={`text-xs font-bold ${isMe ? 'text-red-400' : 'text-red-600'}`}>
                    {isMe ? 'TÚ' : msg.userEmail.split('@')[0].toUpperCase()}
                  </span>
                </div>
                <div 
                  className={`max-w-[80%] p-3 rounded-md text-sm border ${
                    isMe 
                      ? 'bg-red-950/40 border-red-800/50 text-red-100 rounded-tr-none' 
                      : 'bg-black border-red-900/50 text-red-300 rounded-tl-none'
                  }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-red-950/20 border-t border-red-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Transmitir mensaje a la red..."
            className="flex-1 bg-black border border-red-900/50 rounded px-4 py-2 text-red-100 placeholder-red-900/50 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded px-4 py-2 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
