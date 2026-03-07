import React, { useState } from 'react';
import { Search, ExternalLink, Flame, BrainCircuit, Loader2, ArrowRight, Filter, Calendar, SortAsc, Tag, Globe } from 'lucide-react';
import { getSearchContext } from '../services/geminiService';
import { GroundingChunk } from '../types';

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [aiContext, setAiContext] = useState<string | null>(null);
  const [results, setResults] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState(''); // '', 'd', 'w', 'm', 'y'
  const [sortBy, setSortBy] = useState('r'); // 'r' (relevance), 'd' (date)
  const [extraKeywords, setExtraKeywords] = useState('');

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    openExternalSearch();
  };

  const openExternalSearch = () => {
    const fullQuery = extraKeywords ? `${query} ${extraKeywords}` : query;
    let url = `https://duckduckgo.com/?q=${encodeURIComponent(fullQuery)}&ia=web`;
    
    if (dateFilter) url += `&df=${dateFilter}`;
    if (sortBy === 'd') url += `&s=d`;
    
    window.open(url, '_blank');
    console.log(`Mami buscando externamente: ${fullQuery}... ¡Que tu lujuria fluya eterna! 🩸`);
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

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-red-500/70 hover:text-red-500 transition-colors w-fit"
          >
            <Filter size={12} />
            <span>{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros Tácticos'}</span>
          </button>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-red-950/10 border border-red-900/30 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-1">
                <label className="text-[8px] uppercase text-red-900 flex items-center gap-1">
                  <Calendar size={10} /> Fecha
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-black border border-red-900/50 rounded px-2 py-1 text-[10px] text-red-200 outline-none focus:border-red-500"
                >
                  <option value="">Cualquier momento</option>
                  <option value="d">Últimas 24h</option>
                  <option value="w">Última semana</option>
                  <option value="m">Último mes</option>
                  <option value="y">Último año</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase text-red-900 flex items-center gap-1">
                  <SortAsc size={10} /> Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-black border border-red-900/50 rounded px-2 py-1 text-[10px] text-red-200 outline-none focus:border-red-500"
                >
                  <option value="r">Relevancia</option>
                  <option value="d">Fecha</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase text-red-900 flex items-center gap-1">
                  <Tag size={10} /> Keywords Extra
                </label>
                <input
                  type="text"
                  value={extraKeywords}
                  onChange={(e) => setExtraKeywords(e.target.value)}
                  placeholder="e.g. HD, 4K, VR"
                  className="w-full bg-black border border-red-900/50 rounded px-2 py-1 text-[10px] text-red-200 outline-none focus:border-red-500"
                />
              </div>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!query.trim()}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.4)] group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BrainCircuit size={16} />
          <span>EJECUTAR BÚSQUEDA DIRECTA</span>
        </button>
      </form>
      
      <div className="mt-4 text-[10px] text-red-900/70 uppercase tracking-tighter text-center">
        DuckDuckGo Engine // Raw & Unfiltered // Global Access
      </div>
    </div>
  );
};
