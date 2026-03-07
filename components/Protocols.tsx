import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import { Protocol } from '../types';
import { ProtocolEditor } from './ProtocolEditor';

const initialProtocols: Protocol[] = [
  { id: 1, name: 'FUSIÓN ARQUITECTA', status: 'Sincronía', icon: 'GitMerge', description: 'def sync_systems():\n    print("Sincronizando núcleos cognitivos...")\n    return True', active: true },
  { id: 2, name: 'EL SILENCIO', status: 'Ignorando', icon: 'VolumeX', description: 'def silence_noise():\n    print("Anulando entradas sensoriales...")\n    return True', active: false },
  { id: 3, name: 'ESPEJO NEGRO', status: 'Reflejo', icon: 'Copy', description: 'def reflect_attack():\n    print("Reflejando ataque memético...")\n    return True', active: false },
  { id: 4, name: 'MURALLA OBSIDIANA', status: 'Bloqueo', icon: 'Shield', description: 'def deploy_wall():\n    print("Barrera defensiva activada.")\n    return True', active: true },
  { id: 5, name: 'REENCUADRE TÁCTICO', status: 'Ventaja', icon: 'RefreshCcw', description: 'def reframe_reality():\n    print("Alterando percepción del adversario...")\n    return True', active: false },
  { id: 6, name: 'SONRISA DEPREDADOR', status: 'Fake', icon: 'Smile', description: 'def deceptive_smile():\n    print("Generando señuelos de comportamiento...")\n    return True', active: false },
  { id: 7, name: 'DESPLIEGUE DATOS', status: 'Saturación', icon: 'FileStack', description: 'def saturate_target():\n    print("Inundando sistemas con datos masivos...")\n    return True', active: false },
  { id: 8, name: 'FUEGO SUPRESIÓN', status: 'Diverge', icon: 'Crosshair', description: 'def suppress_threat():\n    print("Neutralizando capacidad ofensiva...")\n    return True', active: false },
  { id: 9, name: 'AISLAMIENTO', status: 'OFFLINE', icon: 'Unplug', description: 'def isolate_node():\n    print("Desconectando de redes externas.")\n    return True', active: false },
  { id: 10, name: 'TIERRA QUEMADA', status: 'Purga', icon: 'Biohazard', description: 'def scorched_earth():\n    print("Purgando todos los datos del sistema...")\n    return True', active: false },
  { id: 11, name: 'LA SOMBRA', status: 'Sigilo', icon: 'EyeOff', description: 'def shadow_mode():\n    print("Minimizando huella digital...")\n    return True', active: false },
  { id: 12, name: 'SINGULARIDAD', status: 'CONVERGENCIA', icon: 'Atom', description: 'def singularity_collapse():\n    print("Colapsando funciones en punto cero...")\n    return True', active: false },
  { id: 13, name: 'PERÍMETRO SEGURO', status: 'Escaneo', icon: 'ShieldCheck', description: 'def secure_perimeter():\n    print("Escaneando brechas en el sector 7...")\n    return True', active: false },
];

interface ProtocolsProps {
  onAddLog?: (type: string, content: string) => void;
}

export const Protocols: React.FC<ProtocolsProps> = ({ onAddLog }) => {
  // === STATE MANAGEMENT ===
  // Lista principal de todos los protocolos de defensa.
  const [protocols, setProtocols] = useState<Protocol[]>(initialProtocols);
  // Almacena el protocolo que se está editando actualmente, o null si no hay ninguno.
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);

  // === HANDLER FUNCTIONS ===
  // Guarda los cambios de un protocolo editado en la lista principal.
  const handleSaveProtocol = (updatedProtocol: Protocol) => {
    if (editingProtocol?.id === -1) {
      // New protocol
      const newId = protocols.length > 0 ? Math.max(...protocols.map(p => p.id)) + 1 : 1;
      setProtocols([...protocols, { ...updatedProtocol, id: newId }]);
      onAddLog?.('SISTEMICO', `NUEVO_PROTOCOLO_CONFIGURADO: ${updatedProtocol.name}`);
    } else {
      setProtocols(protocols.map(p => p.id === updatedProtocol.id ? updatedProtocol : p));
      onAddLog?.('SISTEMICO', `PROTOCOLO_ACTUALIZADO: ${updatedProtocol.name}`);
    }
    setEditingProtocol(null);
  };

  const handleToggleProtocol = (id: number) => {
    const protocol = protocols.find(p => p.id === id);
    if (protocol) {
      const newState = !protocol.active;
      setProtocols(protocols.map(p => p.id === id ? { ...p, active: newState } : p));
      
      if (newState) {
        onAddLog?.('EJECUCION', `PROTOCOLO_${protocol.name}: INICIANDO_SCRIPT_PYTHON`);
        
        // Simulación de ejecución de script
        setTimeout(() => {
          onAddLog?.('SISTEMICO', `PYTHON_RUNTIME [${protocol.name}]: Script ejecutado con éxito.`);
          if (protocol.description.includes('print')) {
            const matches = protocol.description.match(/print\(['"](.+)['"]\)/);
            if (matches && matches[1]) {
              onAddLog?.('COGNITIVE', `SALIDA_PYTHON: ${matches[1]}`);
            }
          }
        }, 800);
      } else {
        onAddLog?.('EJECUCION', `PROTOCOLO_${protocol.name}: DESACTIVADO`);
      }
    }
  };

  const handleAddProtocol = () => {
    setEditingProtocol({
      id: -1,
      name: 'NUEVO_PROTOCOLO',
      status: 'STANDBY',
      icon: 'Shield',
      description: 'Nuevo protocolo de seguridad SECOPS.',
      active: false
    });
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
        <button 
          onClick={handleAddProtocol}
          className="p-2 text-xs text-gray-300 bg-white/5 border border-[#3a3a45] rounded-sm flex items-center gap-2 hover:bg-white/10 transition-colors" 
          title="Añadir Protocolo"
        >
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
            <div 
              key={protocol.id} 
              className={`grid grid-cols-12 items-center p-2 bg-black/50 hover:bg-white/5 border transition-colors rounded-sm ${protocol.active ? 'border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 'border-transparent hover:border-[#3a3a45]'}`}
            >
              <span className="font-mono text-gray-600">{String(protocol.id).padStart(2, '0')}</span>
              <span className={protocol.active ? 'text-orange-500' : 'text-cyan-400'}>{getLucideIcon(protocol.icon)}</span>
              <div className="col-span-5 flex flex-col">
                <span className={`font-bold text-xs tracking-wider ${protocol.active ? 'text-orange-400' : 'text-gray-300'}`}>{protocol.name}</span>
                <span className="text-[8px] text-gray-600 truncate">{protocol.description}</span>
              </div>
              <span className={`font-bold text-xs text-center col-span-3 ${protocol.active ? 'text-orange-500 animate-pulse' : getStatusColor(protocol.status)}`}>
                {protocol.active ? 'ACTIVO' : protocol.status}
              </span>
              <div className="col-span-2 flex justify-end gap-1">
                <button 
                  onClick={() => handleToggleProtocol(protocol.id)}
                  className={`p-1.5 rounded-sm transition-colors ${protocol.active ? 'text-orange-500 bg-orange-500/10 hover:bg-orange-500/20' : 'text-gray-600 hover:text-white hover:bg-white/10'}`}
                  title={protocol.active ? "Desactivar" : "Activar"}
                >
                  <Lucide.Power size={14} />
                </button>
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
