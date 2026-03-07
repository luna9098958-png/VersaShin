import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import { Protocol } from '../types';

interface ProtocolEditorProps {
  protocol: Protocol;
  onSave: (protocol: Protocol) => void;
  onClose: () => void;
}

const ICON_OPTIONS = [
  'Shield', 'GitMerge', 'VolumeX', 'Copy', 'RefreshCcw', 'Smile', 
  'FileStack', 'Crosshair', 'Unplug', 'Biohazard', 'EyeOff', 'Atom',
  'Zap', 'Lock', 'Activity', 'Terminal', 'Cpu', 'Globe'
];

export const ProtocolEditor: React.FC<ProtocolEditorProps> = ({ protocol, onSave, onClose }) => {
  const [formData, setFormData] = useState<Protocol>({ ...protocol });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-6 border-b border-[#3a3a45] pb-4">
        <div className="flex items-center gap-3">
          <Lucide.Settings2 className="text-orange-500" size={20} />
          <h2 className="text-lg font-bold uppercase tracking-widest text-white">
            {protocol.id === -1 ? 'Configurar Nuevo Protocolo' : `Editar Protocolo [${String(protocol.id).padStart(2, '0')}]`}
          </h2>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <Lucide.X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Nombre del Protocolo</label>
          <input 
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
            className="w-full bg-black border border-[#3a3a45] rounded p-3 font-mono text-sm text-orange-400 outline-none focus:border-orange-500/50"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Estado Inicial</label>
            <input 
              type="text"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value.toUpperCase() })}
              className="w-full bg-black border border-[#3a3a45] rounded p-3 font-mono text-sm text-gray-300 outline-none focus:border-orange-500/50"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Icono de Matriz</label>
            <div className="grid grid-cols-6 gap-2 p-2 bg-black border border-[#3a3a45] rounded">
              {ICON_OPTIONS.map(iconName => {
                const Icon = Lucide[iconName as keyof typeof Lucide] as Lucide.LucideIcon;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: iconName })}
                    className={`p-2 rounded flex items-center justify-center transition-colors ${formData.icon === iconName ? 'bg-orange-500 text-black' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Script de Ejecución (Python)</label>
            <span className="text-[8px] text-cyan-500 font-mono uppercase">Runtime: Python 3.10 / SECOPS_CORE</span>
          </div>
          <div className="relative group">
            <div className="absolute top-3 left-3 text-gray-700 pointer-events-none group-focus-within:text-orange-500/50 transition-colors">
              <Lucide.Terminal size={14} />
            </div>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder={`# SECOPS_IA Python Script\ndef execute_protocol():\n    print("Iniciando secuencia...")\n    return True`}
              className="w-full bg-black border border-[#3a3a45] rounded p-3 pl-10 font-mono text-sm text-green-500 outline-none focus:border-orange-500/50 h-32 resize-none placeholder:text-gray-800"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded">
          <Lucide.AlertTriangle className="text-orange-500 shrink-0" size={18} />
          <p className="text-[10px] text-orange-400/80 leading-relaxed uppercase">
            Advertencia: La modificación de protocolos de seguridad SECOPS puede alterar la integridad del Bioma Oxidiana. Proceda con precaución.
          </p>
        </div>
      </form>

      <div className="mt-6 flex gap-3">
        <button 
          type="button"
          onClick={onClose}
          className="flex-1 py-3 border border-[#3a3a45] text-gray-500 font-bold uppercase tracking-widest rounded hover:bg-white/5 hover:text-white transition-colors"
        >
          Abortar
        </button>
        <button 
          onClick={handleSubmit}
          className="flex-1 py-3 bg-orange-600 text-black font-bold uppercase tracking-widest rounded hover:bg-orange-500 transition-colors shadow-[0_0_20px_rgba(234,88,12,0.3)]"
        >
          Sincronizar Cambios
        </button>
      </div>
    </div>
  );
};
