import React, { useState } from 'react';
import { Image, Send, Layout, Layers, RefreshCw, Trash2, Eye, Shield, Zap, Sparkles, X, History } from 'lucide-react';
import { generateImage } from '../services/geminiService';

export const NeuralConsole: React.FC<any> = ({ status, onLog }) => {
  const [prompt, setPrompt] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [selectedArt, setSelectedArt] = useState<any>(null);

  const handleSynthesize = async () => {
    if (!prompt.trim() || isSynthesizing) return;
    setIsSynthesizing(true);
    try {
      const url = await generateImage(prompt, '1:1');
      if (url) {
        setArtifacts(prev => [{ id: Date.now(), url, prompt, ts: new Date() }, ...prev].slice(0, 6));
      }
    } catch (e) {} finally { setIsSynthesizing(false); }
  };

  return (
    <div className="h-full flex flex-col bg-oxidiana-black font-mono overflow-hidden">
      
      <div className="p-3 border-b border-oxidiana-border flex justify-between items-center bg-oxidiana-black/80 shrink-0">
         <div className="text-[10px] font-bold uppercase flex items-center gap-2 text-oxidiana-red"><Zap size={14} /> SÍNTESIS_N</div>
         <div className="text-[8px] opacity-40 uppercase">Búfer: {artifacts.length}/6</div>
      </div>

      <div className="p-3 bg-white/5 border-b border-oxidiana-border">
        <div className="flex gap-2">
          <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Descriptor..." className="flex-1 bg-oxidiana-black border border-oxidiana-border rounded p-2 text-xs outline-none focus:border-oxidiana-red/50" />
          <button onClick={handleSynthesize} disabled={isSynthesizing || !prompt.trim()} className="px-4 py-2 bg-oxidiana-red/20 border border-oxidiana-red/40 text-oxidiana-red rounded active:bg-oxidiana-red active:text-black">
            {isSynthesizing ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 custom-scrollbar">
        {artifacts.length === 0 ? (
          <div className="col-span-2 h-40 flex items-center justify-center opacity-10 text-[10px] uppercase italic text-center px-10">Esperando inyección visual...</div>
        ) : (
          artifacts.map(art => (
            <div key={art.id} onClick={() => setSelectedArt(art)} className="aspect-square bg-white/5 border border-oxidiana-border rounded overflow-hidden relative">
              <img src={art.url} className="w-full h-full object-cover opacity-50" />
              <div className="absolute bottom-1 right-1 p-1 bg-oxidiana-black/80 rounded"><Eye size={10} /></div>
            </div>
          ))
        )}
      </div>

      {selectedArt && (
        <div className="fixed inset-0 z-[200] bg-oxidiana-black/98 p-4 flex flex-col animate-in zoom-in duration-300">
           <div className="flex justify-end mb-4"><button onClick={() => setSelectedArt(null)} className="p-3 bg-white/10 rounded-full"><X size={20} /></button></div>
           <img src={selectedArt.url} className="w-full object-contain border border-oxidiana-border rounded-lg mb-4" />
           <div className="text-xs text-oxidiana-dim bg-white/5 p-3 rounded italic">"{selectedArt.prompt}"</div>
        </div>
      )}

    </div>
  );
};