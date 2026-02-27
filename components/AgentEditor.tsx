import React from 'react';
import { X, Volume2, Save, SlidersHorizontal, User } from 'lucide-react';
import { Agent, GeminiVoiceName } from '../types';

interface AgentEditorProps {
  agent: Agent;
  onSave: (updatedAgent: Agent) => void;
  onClose: () => void;
}

export const AgentEditor: React.FC<AgentEditorProps> = ({ agent, onSave, onClose }) => {
  const [edited, setEdited] = React.useState<Agent>({ ...agent });

  const voices: GeminiVoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

  const handleChange = (field: string, value: any) => {
    setEdited(prev => {
      if (field.startsWith('voiceConfig.')) {
        const voiceField = field.split('.')[1];
        return {
          ...prev,
          voiceConfig: { ...prev.voiceConfig, [voiceField]: value }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black/95 flex flex-col p-4 animate-in fade-in slide-in-from-bottom-5 font-mono text-[10px]">
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} style={{ color: agent.color }} />
          <span className="font-bold uppercase tracking-widest">CONFIG_AGENTE // {agent.name}</span>
        </div>
        <button onClick={onClose} className="p-1 opacity-50 hover:opacity-100"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {/* IDENTIDAD SECTION */}
        <section className="space-y-2">
          <div className="text-[8px] opacity-40 uppercase font-bold tracking-tighter">Identidad Visual</div>
          <div className="space-y-1">
            <label className="text-[7px] uppercase">Nombre Clave</label>
            <input 
              type="text" 
              value={edited.name} 
              onChange={e => handleChange('name', e.target.value)}
              className="w-full h-6 bg-black border border-white/10 rounded px-1 outline-none text-[9px] focus:border-white/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[7px] uppercase">Color Nodo</label>
              <input 
                type="color" 
                value={edited.color} 
                onChange={e => handleChange('color', e.target.value)}
                className="w-full h-6 bg-transparent border border-white/10 rounded cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[7px] uppercase">Rol/Tag</label>
              <input 
                type="text" 
                value={edited.role} 
                onChange={e => handleChange('role', e.target.value)}
                className="w-full h-6 bg-black border border-white/10 rounded px-1 outline-none text-[9px] focus:border-white/30"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[7px] uppercase">Avatar URL (Opcional)</label>
            <input 
              type="text" 
              value={edited.avatar || ''} 
              onChange={e => handleChange('avatar', e.target.value)}
              placeholder="https://picsum.photos/200"
              className="w-full h-6 bg-black border border-white/10 rounded px-1 outline-none text-[9px] focus:border-white/30"
            />
          </div>
        </section>

        {/* VOICE SECTION */}
        <section className="space-y-2 pt-2 border-t border-white/5">
          <div className="text-[8px] opacity-40 uppercase font-bold tracking-tighter flex items-center gap-1">
            <Volume2 size={10} /> Síntesis Vocal (TTS)
          </div>
          
          <div className="space-y-3 bg-white/5 p-2 rounded">
            <div className="space-y-1">
              <label className="text-[7px] uppercase block">Perfil de Voz</label>
              <select 
                value={edited.voiceConfig.voiceName} 
                onChange={e => handleChange('voiceConfig.voiceName', e.target.value)}
                className="w-full bg-black border border-white/10 rounded text-[9px] py-1 outline-none"
              >
                {voices.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[7px] uppercase">
                  <span>Pitch (Tono)</span>
                  <span>{edited.voiceConfig.pitch.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0.5" max="1.5" step="0.1" 
                  value={edited.voiceConfig.pitch}
                  onChange={e => handleChange('voiceConfig.pitch', parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 appearance-none rounded"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[7px] uppercase">
                  <span>Rate (Vel)</span>
                  <span>{edited.voiceConfig.rate.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.1" 
                  value={edited.voiceConfig.rate}
                  onChange={e => handleChange('voiceConfig.rate', parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 appearance-none rounded"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[7px] uppercase block">Género Percibido</label>
              <div className="flex gap-2">
                {['male', 'female'].map(g => (
                  <button 
                    key={g}
                    onClick={() => handleChange('voiceConfig.gender', g)}
                    className={`flex-1 py-1 text-[8px] uppercase border rounded transition-all ${edited.voiceConfig.gender === g ? 'bg-white text-black border-white' : 'border-white/10 opacity-40'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PERSONALITY SECTION */}
        <section className="space-y-1 pt-2 border-t border-white/5">
          <label className="text-[8px] opacity-40 uppercase font-bold tracking-tighter block">Núcleo de Instrucción</label>
          <textarea 
            value={edited.systemInstruction} 
            onChange={e => handleChange('systemInstruction', e.target.value)}
            className="w-full h-24 bg-black border border-white/10 rounded p-2 text-[9px] outline-none focus:border-white/30 resize-none font-tech"
          />
        </section>
      </div>

      <div className="pt-4 border-t border-white/10 shrink-0">
        <button 
          onClick={() => onSave(edited)}
          className="w-full py-3 bg-white/10 border border-white/20 text-white font-bold uppercase tracking-[0.2em] rounded active:bg-white active:text-black flex items-center justify-center gap-2"
        >
          <Save size={14} /> PERSISTIR_CAMBIOS
        </button>
      </div>
    </div>
  );
};