import React from 'react';
import { X, Volume2, Save, SlidersHorizontal, User, Activity, BrainCircuit } from 'lucide-react';
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
      if (field.startsWith('visualConfig.')) {
        const visualField = field.split('.')[1];
        return {
          ...prev,
          visualConfig: { ...prev.visualConfig, [visualField]: value }
        };
      }
      if (field.startsWith('config.')) {
        const configField = field.split('.')[1];
        return {
          ...prev,
          config: { ...prev.config, [configField]: value }
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

      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        {/* IDENTIDAD SECTION */}
        <section className="space-y-3">
          <div className="text-[10px] opacity-60 uppercase font-black tracking-widest mb-2 border-b border-white/5 pb-1">Identidad Visual</div>
          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-bold text-gray-500">Nombre Clave</label>
            <input 
              type="text" 
              value={edited.name} 
              onChange={e => handleChange('name', e.target.value)}
              className="w-full h-8 bg-black border border-white/10 rounded px-2 outline-none text-[11px] focus:border-white/30 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-bold text-gray-500">Color Nodo</label>
              <input 
                type="color" 
                value={edited.color} 
                onChange={e => handleChange('color', e.target.value)}
                className="w-full h-8 bg-transparent border border-white/10 rounded cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-bold text-gray-500">Rol/Tag</label>
              <input 
                type="text" 
                value={edited.role} 
                onChange={e => handleChange('role', e.target.value)}
                className="w-full h-8 bg-black border border-white/10 rounded px-2 outline-none text-[11px] focus:border-white/30 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-bold text-gray-500">Nivel Acceso</label>
              <select 
                value={edited.nivel_acceso || 'ESTANDAR'} 
                onChange={e => handleChange('nivel_acceso', e.target.value)}
                className="w-full h-8 bg-black border border-white/10 rounded px-2 outline-none text-[11px] focus:border-white/30 transition-all"
              >
                <option value="ESTANDAR">ESTANDAR</option>
                <option value="ALTA_PRIORIDAD">ALTA_PRIORIDAD</option>
                <option value="OMEGA">OMEGA</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-bold text-gray-500">Estado</label>
              <select 
                value={edited.status} 
                onChange={e => handleChange('status', e.target.value)}
                className="w-full h-8 bg-black border border-white/10 rounded px-2 outline-none text-[11px] focus:border-white/30 transition-all"
              >
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
                <option value="CORRUPTED">CORRUPTED</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-bold text-gray-500">Avatar URL (Opcional)</label>
            <input 
              type="text" 
              value={edited.avatar || ''} 
              onChange={e => handleChange('avatar', e.target.value)}
              placeholder="https://picsum.photos/200"
              className="w-full h-8 bg-black border border-white/10 rounded px-2 outline-none text-[11px] focus:border-white/30 transition-all"
            />
          </div>
        </section>

        {/* VOICE SECTION */}
        <section className="space-y-3 pt-2">
          <div className="text-[10px] opacity-60 uppercase font-black tracking-widest mb-2 border-b border-white/5 pb-1 flex items-center gap-2">
            <Volume2 size={12} /> Síntesis Vocal (TTS)
          </div>
          
          <div className="space-y-4 bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-bold text-gray-500 block">Perfil de Voz</label>
              <select 
                value={edited.voiceConfig.voiceName} 
                onChange={e => handleChange('voiceConfig.voiceName', e.target.value)}
                className="w-full bg-black border border-white/10 rounded text-[11px] py-1.5 px-2 outline-none focus:border-white/30 transition-all"
              >
                {voices.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] uppercase font-bold text-gray-400">
                  <span>Pitch (Tono)</span>
                  <span className="text-orange-500">{edited.voiceConfig.pitch.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0.5" max="1.5" step="0.1" 
                  value={edited.voiceConfig.pitch}
                  onChange={e => handleChange('voiceConfig.pitch', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 appearance-none rounded-full accent-orange-500 cursor-pointer"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] uppercase font-bold text-gray-400">
                  <span>Rate (Vel)</span>
                  <span className="text-orange-500">{edited.voiceConfig.rate.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.1" 
                  value={edited.voiceConfig.rate}
                  onChange={e => handleChange('voiceConfig.rate', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 appearance-none rounded-full accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-bold text-gray-500 block">Género Percibido</label>
              <div className="flex gap-2">
                {['male', 'female'].map(g => (
                  <button 
                    key={g}
                    onClick={() => handleChange('voiceConfig.gender', g)}
                    className={`flex-1 py-2 text-[9px] uppercase font-black border rounded-lg transition-all ${edited.voiceConfig.gender === g ? 'bg-white text-black border-white shadow-lg' : 'border-white/10 opacity-40 hover:opacity-60'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* COGNITIVE CONFIG SECTION */}
        <section className="space-y-3 pt-2">
          <div className="text-[10px] opacity-60 uppercase font-black tracking-widest mb-2 border-b border-white/5 pb-1 flex items-center gap-2">
            <BrainCircuit size={12} /> Configuración Cognitiva
          </div>
          
          <div className="space-y-4 bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] uppercase font-bold text-gray-400">
                <span>Syntropy (Lógica)</span>
                <span className="text-cyan-400">{(edited.config.syntropy * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={edited.config.syntropy}
                onChange={e => handleChange('config.syntropy', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 appearance-none rounded-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] uppercase font-bold text-gray-400">
                <span>Entropy (Caos)</span>
                <span className="text-red-500">{(edited.config.entropy * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={edited.config.entropy}
                onChange={e => handleChange('config.entropy', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 appearance-none rounded-full accent-red-500 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* VISUAL CONFIG SECTION */}
        <section className="space-y-3 pt-2">
          <div className="text-[10px] opacity-60 uppercase font-black tracking-widest mb-2 border-b border-white/5 pb-1 flex items-center gap-2">
            <Activity size={12} /> Configuración Visual (FX)
          </div>
          
          <div className="space-y-4 bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] uppercase font-bold text-gray-400">
                <span>Drift (Deriva)</span>
                <span className="text-orange-500">{edited.visualConfig?.drift || 0}px</span>
              </div>
              <input 
                type="range" min="0" max="20" step="1" 
                value={edited.visualConfig?.drift || 0}
                onChange={e => handleChange('visualConfig.drift', parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 appearance-none rounded-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] uppercase font-bold text-gray-400">
                <span>Jitter (Vibración)</span>
                <span className="text-orange-500">{edited.visualConfig?.jitter || 0}px</span>
              </div>
              <input 
                type="range" min="0" max="5" step="0.5" 
                value={edited.visualConfig?.jitter || 0}
                onChange={e => handleChange('visualConfig.jitter', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 appearance-none rounded-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] uppercase font-bold text-gray-400">
                <span>Expansion (Espaciado)</span>
                <span className="text-orange-500">{edited.visualConfig?.expansion || 0}px</span>
              </div>
              <input 
                type="range" min="0" max="10" step="1" 
                value={edited.visualConfig?.expansion || 0}
                onChange={e => handleChange('visualConfig.expansion', parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 appearance-none rounded-full accent-orange-500 cursor-pointer"
              />
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