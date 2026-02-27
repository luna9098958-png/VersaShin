import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import { Protocol } from '../types';
import { ProtocolEditor } from './ProtocolEditor';

const initialProtocols: Protocol[] = [
  { id: 1, name: 'FUSIÓN ARQUITECTA', status: 'Sincronía', icon: 'GitMerge', description: 'Protocolo de integración y sincronización de sistemas cognitivos.' },
  { id: 2, name: 'EL SILENCIO', status: 'Ignorando', icon: 'VolumeX', description: 'Anula las entradas sensoriales no deseadas para mantener el enfoque.' },
  { id: 3, name: 'ESPEJO NEGRO', status: 'Reflejo', icon: 'Copy', description: 'Refleja y devuelve ataques meméticos o informáticos a su origen.' },
  { id: 4, name: 'MURALLA OBSIDIANA', status: 'Bloqueo', icon: 'Shield', description: 'Barrera defensiva de alta densidad contra intrusiones de fuerza bruta.' },
  { id: 5, name: 'REENCUADRE TÁCTICO', status: 'Ventaja', icon: 'RefreshCcw', description: 'Altera la percepción del adversario para obtener una ventaja estratégica.' },
  { id: 6, name: 'SONRISA DEPREDADOR', status: 'Fake', icon: 'Smile', description: 'Genera datos falsos y comportamiento anómalo para engañar a los adversarios.' },
  { id: 7, name: 'DESPLIEGUE DATOS', status: 'Saturación', icon: 'FileStack', description: 'Inunda al objetivo con un volumen masivo de datos para sobrecargar sus sistemas.' },
  { id: 8, name: 'FUEGO SUPRESIÓN', status: 'Diverge', icon: 'Crosshair', description: 'Neutraliza amenazas activas y suprime la capacidad ofensiva del adversario.' },
  { id: 9, name: 'AISLAMIENTO', status: 'OFFLINE', icon: 'Unplug', description: 'Desconecta el sistema de todas las redes externas para evitar la exfiltración o el control remoto.' },
  { id: 10, name: 'TIERRA QUEMADA', status: 'Purga', icon: 'Biohazard', description: 'Elimina todos los datos y configuraciones de un sistema comprometido de forma irreversible.' },
  { id: 11, name: 'LA SOMBRA', status: 'Sigilo', icon: 'EyeOff', description: 'Opera sin ser detectado, minimizando la huella digital y las emisiones.' },
  { id: 12, name: 'SINGULARIDAD', status: 'CONVERGENCIA', icon: 'Atom', description: 'Protocolo de último recurso que colapsa todas las funciones en un único punto de alta densidad.' },
];

export const Protocols: React.FC = () => {
  // === STATE MANAGEMENT ===
  // Lista principal de todos los protocolos de defensa.
  const [protocols, setProtocols] = useState<Protocol[]>(initialProtocols);
  // Almacena el protocolo que se está editando actualmente, o null si no hay ninguno.
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);

  // === HANDLER FUNCTIONS ===
  // Guarda los cambios de un protocolo editado en la lista principal.
  const handleSaveProtocol = (updatedProtocol: Protocol) => {
    setProtocols(protocols.map(p => p.id === updatedProtocol.id ? updatedProtocol : p));
  };

  // === HELPER FUNCTIONS ===
  // Renderiza dinámicamente un icono de Lucide a partir de su nombre en string.
  const getLucideIcon = (iconName: string) => {
    const IconComponent = Lucide[iconName as keyof typeof Lucide];
    return IconComponent ? <IconComponent size={16} /> : <Lucide.HelpCircle size={16} />;
  };

  // Devuelve una clase de color de Tailwind CSS según el estado del protocolo.
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SINCRONÍA':
      case 'VENTAJA':
      case 'CONVERGENCIA':
        return 'text-green-400';
      case 'OFFLINE':
      case 'PURGA':
        return 'text-red-400';
      case 'IGNORANDO':
      case 'BLOQUEO':
      case 'SATURACIÓN':
        return 'text-yellow-400';
      case 'REFLEJO':
      case 'FAKE':
      case 'DIVERGE':
      case 'SIGILO':
        return 'text-cyan-400';
      default:
        return 'text-gray-500';
    }
  };

  // === RENDER ===
  return (
    <div className="h-full overflow-hidden flex flex-col border border-[#2a2a35] bg-[#050508]/80 rounded-sm p-3 gap-3 relative">
      {/* --- Cabecera del Panel --- */}
      <div className="border-b-2 border-[#2a2a35] pb-2 flex items-center justify-between text-gray-400">
        <div className="flex items-center gap-2">
          <Lucide.ShieldCheck size={14} />
          <h2 className="text-sm font-bold uppercase tracking-widest">SECOPS_IA: MATRIZ_ACTIVA</h2>
        </div>
        {/* Placeholder para futuras integraciones */}
        <button className="p-2 text-xs text-gray-700 bg-black/50 border border-[#3a3a45] rounded-sm flex items-center gap-2 cursor-not-allowed" title="Funcionalidad futura">
          <Lucide.Plus size={14} />
          <span>Añadir Protocolo</span>
        </button>
      </div>

      {/* --- Matriz de Protocolos --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {/* Cabecera de la tabla */}
        <div className="w-full text-xs text-gray-500 uppercase grid grid-cols-12 px-2 pb-1 border-b border-[#3a3a45]">
          <div className="col-span-1">ID</div>
          <div className="col-span-1">IC</div>
          <div className="col-span-5">PROTOCOLO</div>
          <div className="col-span-3 text-center">ESTADO</div>
          <div className="col-span-2 text-right">ACCIÓN</div>
        </div>
        {/* Filas de la tabla */}
        <div className="space-y-1 mt-1">
          {protocols.map(protocol => (
            <div key={protocol.id} className="grid grid-cols-12 items-center p-2 bg-black/50 hover:bg-white/5 border border-transparent hover:border-[#3a3a45] rounded-sm transition-colors">
              <span className="font-mono text-gray-600">{String(protocol.id).padStart(2, '0')}</span>
              <span className="text-cyan-400">{getLucideIcon(protocol.icon)}</span>
              <span className="font-bold text-gray-300 text-xs tracking-wider col-span-5">{protocol.name}</span>
              <span className={`font-bold text-xs text-center col-span-3 ${getStatusColor(protocol.status)}`}>{protocol.status}</span>
              <div className="col-span-2 text-right">
                <button 
                  onClick={() => setEditingProtocol(protocol)} 
                  className="p-1.5 text-xs text-gray-500 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
                  title="Editar Protocolo"
                >
                  <Lucide.Settings2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Panel de Edición (Modal) --- */}
      {editingProtocol && (
        <ProtocolEditor 
          protocol={editingProtocol}
          onSave={handleSaveProtocol}
          onClose={() => setEditingProtocol(null)}
        />
      )}
    </div>
  );
};
