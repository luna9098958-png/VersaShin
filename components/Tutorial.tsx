import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Info, Terminal, Users, Book, Shield, Database, Globe } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  target: string; // CSS selector or logical name
  icon: React.ReactNode;
}

const STEPS: TutorialStep[] = [
  {
    title: "BIENVENIDO AL BIOMA OXIDIANA",
    description: "Has sido sincronizado con la interfaz de comando de nivel OMEGA. Este tutorial te guiará por los protocolos básicos de operación.",
    target: "header",
    icon: <Shield className="text-oxidiana-red" size={24} />
  },
  {
    title: "TERMINAL DE COMANDO (C2)",
    description: "Aquí es donde interactúas con la GESTALT. Puedes enviar comandos directos o conversar con los agentes activos. Prueba comandos como 'search [query]' o 'cls'.",
    target: "terminal",
    icon: <Terminal className="text-orange-400" size={24} />
  },
  {
    title: "PANEL TÁCTICO DE AGENTES",
    description: "Gestiona las unidades de IA desplegadas. Puedes activar diferentes agentes, editar sus parámetros de entropía o inyectar nuevos perfiles mediante JSON.",
    target: "agents",
    icon: <Users className="text-orange-400" size={24} />
  },
  {
    title: "GRIMORIO DE SCRIPTS",
    description: "Accede a las funciones de bajo nivel del sistema. Ejecuta protocolos de emergencia, cambia la estética del bioma o monitorea los logs de ejecución.",
    target: "grimorio",
    icon: <Book className="text-orange-400" size={24} />
  },
  {
    title: "PROTOCOLOS Y SEGURIDAD",
    description: "Monitorea el estado de los protocolos críticos. Aquí es donde la integridad del sistema se visualiza y se gestionan las brechas de seguridad.",
    target: "protocols",
    icon: <Shield className="text-orange-400" size={24} />
  },
  {
    title: "MEMORIA A LARGO PLAZO",
    description: "El sistema almacena fragmentos de datos críticos aquí. Puedes revisar memorias pasadas o añadir nuevas para asegurar la persistencia de la información.",
    target: "memory",
    icon: <Database className="text-orange-400" size={24} />
  },
  {
    title: "COMUNICACIONES GLOBALES",
    description: "Establece contacto con otros nodos en la red. El Live Chat permite la comunicación inter-bioma en tiempo real.",
    target: "live_chat",
    icon: <Globe className="text-orange-400" size={24} />
  }
];

interface TutorialProps {
  onClose: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-mono">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="max-w-md w-full bg-[#0a0a0c] border-2 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-white/5 w-full">
          <motion.div 
            className="h-full bg-oxidiana-red"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 pt-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg shrink-0">
              {step.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tighter uppercase mb-1">
                {step.title}
              </h2>
              <div className="text-[10px] text-oxidiana-red font-bold tracking-widest uppercase opacity-60">
                Paso {currentStep + 1} de {STEPS.length}
              </div>
            </div>
          </div>

          <p className="text-gray-400 text-xs leading-relaxed mb-8 min-h-[60px]">
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <button 
              onClick={onClose}
              className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              Omitir
            </button>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={prevStep}
                  className="p-2 border border-white/10 hover:bg-white/5 text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <button 
                onClick={nextStep}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold text-[10px] uppercase tracking-widest hover:bg-oxidiana-red hover:text-white transition-all"
              >
                {currentStep === STEPS.length - 1 ? "Finalizar" : "Siguiente"}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 p-2 opacity-10 pointer-events-none">
          <Shield size={64} />
        </div>
      </motion.div>
    </div>
  );
};
