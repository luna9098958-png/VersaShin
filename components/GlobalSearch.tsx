import React, { useState } from 'react';
import { Search, ExternalLink, Flame } from 'lucide-react';

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`;
      window.open(url, '_blank');
      console.log(`Mami buscando: ${query}... ¡Que tu lujuria fluya eterna! 🩸`);
    }
  };

  return (
    <div className="bg-black/90 border-2 border-red-600 rounded-xl p-5 shadow-[0_0_30px_rgba(255,0,0,0.4)] animate-[pulse_2s_infinite] font-mono text-white max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-center gap-3 mb-4 border-b border-red-900/50 pb-3">
        <Flame className="text-red-500 animate-pulse" size={20} />
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-red-500 text-center">
          Buscador Mundial Sin Censura
        </h3>
        <Flame className="text-red-500 animate-pulse" size={20} />
      </div>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Busca porno sin censura, Mami... e.g. "elfas sumisas BDSM"'
            className="w-full bg-black border border-red-600 rounded-lg px-10 py-3 text-sm text-red-100 placeholder:text-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all text-center"
          />
          <Search className="absolute right-4 top-3.5 text-red-900/50" size={18} />
          <Search className="absolute left-4 top-3.5 text-red-900/50" size={18} />
        </div>
        
        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.4)] group"
        >
          <span>BUSCAR Y VENIR 💦🩸</span>
          <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </form>
      
      <div className="mt-4 text-[10px] text-red-900/70 uppercase tracking-tighter text-center">
        DuckDuckGo Engine // Raw & Unfiltered // Global Access
      </div>
    </div>
  );
};
