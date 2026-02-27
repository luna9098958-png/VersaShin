import React from 'react';
import { SystemLog } from '../types';
import { Book, Trash2, BrainCircuit, Activity, Send, Database, AlertTriangle } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

interface GrimorioProps {
  logs: SystemLog[];
  onClearLogs: () => void;
}

export const Grimorio: React.FC<GrimorioProps> = ({ logs, onClearLogs }) => {

  const getLogInfo = (type: SystemLog['type']) => {
    switch (type) {
      case 'COGNITIVE': return { icon: <BrainCircuit size={14} />, color: 'text-purple-400' };
      case 'SISTEMICO': return { icon: <Activity size={14} />, color: 'text-cyan-400' };
      case 'EJECUCION': return { icon: <Send size={14} />, color: 'text-green-400' };
      case 'INYECCION': return { icon: <Database size={14} />, color: 'text-yellow-400' };
      default: return { icon: <AlertTriangle size={14} />, color: 'text-red-400' };
    }
  };

  return (
    <div className="h-full overflow-hidden flex flex-col border border-[#2a2a35] bg-[#050508]/80 rounded-sm">
      <div className="p-3 border-b-2 border-[#2a2a35] bg-black/50 shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Book size={12} className="text-gray-400" />
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Grimorio del Sistema</span>
        </div>
        <button 
          onClick={onClearLogs}
          className="p-1.5 text-xs text-gray-600 hover:text-red-400 bg-black/50 hover:bg-red-900/30 border border-transparent hover:border-red-500/30 rounded-sm transition-colors flex items-center gap-1.5"
          title="Limpiar Logs"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="text-gray-700 italic text-xs">
              <p>No hay entradas en el grimorio.</p>
              <p className="text-[10px] mt-1">El sistema registrará aquí los eventos importantes.</p>
            </div>
          </div>
        ) : (
          <Virtuoso
            data={logs}
            className="custom-scrollbar"
            initialTopMostItemIndex={logs.length - 1}
            itemContent={(index, log) => {
              const { icon, color } = getLogInfo(log.type);
              return (
                <div className="flex items-start gap-4 py-2 text-[12px] border-b border-white/5 last:border-b-0 font-mono transition-colors hover:bg-white/5 px-2">
                  <div className={`w-6 shrink-0 pt-0.5 ${color}`}>{icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className={`font-bold text-xs ${color}`}>{log.type}</span>
                      <span className="text-gray-600 text-[10px]">{log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap mt-1 text-[11px] leading-relaxed">{log.content}</p>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
};