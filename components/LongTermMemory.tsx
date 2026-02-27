import React, { useState } from 'react';
import { Memory } from '../types';
import { Database, Plus, Trash2 } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

interface LongTermMemoryProps {
  memories: Memory[];
  onAddMemory: (content: string) => void;
  onDeleteMemory: (id: string) => void;
}

export const LongTermMemory: React.FC<LongTermMemoryProps> = ({ memories, onAddMemory, onDeleteMemory }) => {
  const [newMemoryContent, setNewMemoryContent] = useState('');

  const handleAddClick = () => {
    if (newMemoryContent.trim()) {
      onAddMemory(newMemoryContent.trim());
      setNewMemoryContent('');
    }
  };

  return (
    <div className="h-full overflow-hidden flex flex-col border border-[#2a2a35] bg-[#050508]/80 rounded-sm">
      <div className="p-3 border-b-2 border-[#2a2a35] bg-black/50 shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Database size={12} className="text-gray-400" />
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Memoria a Largo Plazo</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {memories.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="text-gray-700 italic text-xs">
              <p>El banco de memoria está vacío.</p>
              <p className="text-[10px] mt-1">Añade recuerdos para construir la base de conocimiento.</p>
            </div>
          </div>
        ) : (
          <Virtuoso
            data={memories}
            className="custom-scrollbar"
            itemContent={(index, memory) => (
              <div className="flex items-start gap-3 py-2 text-[11px] border-b border-white/5 last:border-b-0 font-mono transition-colors hover:bg-white/5 px-2">
                <div className="flex-1">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{memory.content}</p>
                  <div className="text-gray-600 text-[10px] mt-2 flex justify-between items-center">
                    <span>{new Date(memory.timestamp).toLocaleString()}</span>
                    <button 
                      onClick={() => onDeleteMemory(memory.id)}
                      className="p-1 text-gray-700 hover:text-red-500 transition-colors"
                      title="Olvidar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>

      <div className="p-2 border-t-2 border-[#2a2a35] bg-[#050508]">
        <div className="flex gap-2">
          <textarea
            value={newMemoryContent}
            onChange={e => setNewMemoryContent(e.target.value)}
            placeholder="Añadir nuevo recuerdo..."
            rows={2}
            className="flex-1 bg-black border border-[#3a3a45] p-2 text-xs text-gray-200 placeholder:text-gray-600 outline-none focus:border-green-500/50 transition-colors resize-none"
          />
          <button 
            onClick={handleAddClick} 
            className="p-2 bg-green-900/50 border border-green-500/60 text-green-300 hover:bg-green-800/50 rounded-sm transition-colors self-stretch"
            title="Memorizar"
          >
            <Plus size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
};
