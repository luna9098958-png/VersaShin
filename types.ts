
export interface User {
  id: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isGlitch?: boolean;
  groundingChunks?: GroundingChunk[];
  agentId?: string;
  typingComplete?: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
  };
}

export interface DetectedEntity {
  point: [number, number]; // [y, x] in 0-1000 scale
  label: string;
}

export type ImageResolution = '1K' | '2K' | '4K';

export interface ImageGenerationConfig {
  prompt: string;
  resolution: ImageResolution;
  aspectRatio: '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
}

export interface AgentConfig {
  syntropy: number; // Order/Logic (0-1)
  entropy: number;  // Chaos/Creativity (0-1)
}

export type GeminiVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface VoiceConfig {
  voiceName: GeminiVoiceName;
  pitch: number;    // 0 to 2
  rate: number;     // 0.1 to 10
  gender: 'male' | 'female';
}

export interface VisualConfig {
  drift: number;     // Slow movement intensity (0-20px)
  jitter: number;    // High frequency shiver (0-5px)
  expansion: number; // Letter spacing dynamic (0-10px)
}

export type AgentAction = 'IDLE' | 'THINKING' | 'SPEAKING' | 'ANALYZING' | 'SYNTHESIZING' | 'ERROR';

export interface Agent {
  id: string;
  name: string;
  role: string;
  systemInstruction: string;
  color: string;
  status: 'ONLINE' | 'OFFLINE' | 'CORRUPTED';
  avatar?: string;
  config: AgentConfig;
  voiceConfig: VoiceConfig;
  visualConfig: VisualConfig;
  currentAction?: AgentAction;
  nivel_acceso?: 'ESTANDAR' | 'OMEGA' | 'ALTA_PRIORIDAD';
}

export type ThemeType = 'OXIDIANA' | 'LIGHT_MINIMAL' | 'HIGH_CONTRAST' | 'CYBER_CYAN';

export interface SystemStatus {
  integrity: number;
  layer: string;
  activeAgentIds: string[];
  accentColor: string;
  glitchIntensity: number;
  glitchTiming: number;
  preferredFont: 'mono' | 'tech';
  theme: ThemeType;
}

export interface SystemLog {
  id: string;
  type: 'COGNITIVE' | 'SISTEMICO' | 'EJECUCION' | 'INYECCION';
  content: string;
  timestamp: Date;
}

export interface Memory {
  id: string;
  content: string;
  timestamp: Date;
}

export interface Protocol {

  id: number;
  name: string;
  status: string;
  icon: string;
  description: string;
}

export enum ViewMode {
  CHAT = 'CHAT',

  AGENTS = 'AGENTS',
  CONSOLE = 'CONSOLE',
  GRIMORIO = 'GRIMORIO',

  PROTOCOLS = 'PROTOCOLS',
  MEMORY = 'MEMORY',
  LIVE_CHAT = 'LIVE_CHAT',
}
